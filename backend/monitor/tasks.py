import requests
import time
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Website, MonitorLog, Incident, SystemConfig, SystemSnapshot
from datetime import timedelta
import os
import psutil
import json
import redis
import logging

logger = logging.getLogger(__name__)
def take_system_snapshot(title, reason, website_id=None, incident_id=None, response_time=None):
    try:
        cpu = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/').percent
        
        load = os.getloadavg() if hasattr(os, 'getloadavg') else [0,0,0]
        net = psutil.net_io_counters()
        
        SystemSnapshot.objects.create(
            title=title,
            reason=reason,
            cpu=cpu,
            memory=memory,
            disk=disk,
            load_1=load[0],
            load_5=load[1],
            load_15=load[2],
            net_sent=net.bytes_sent,
            net_recv=net.bytes_recv,
            website_id=website_id,
            incident_id=incident_id,
            response_time=response_time
        )
    except Exception as e:
        print(f"Failed to capture system snapshot: {e}")

@shared_task
def check_website(website_id):
    try:
        website = Website.objects.get(id=website_id)
    except Website.DoesNotExist:
        logger.error(f"Task received for non-existent website ID: {website_id}")
        return

    logger.info(f"Starting check for {website.name} ({website.url})")

    start_time = time.time()
    ttfb = None
    payload_size = 0
    
    try:
        # Use stream=True to measure TTFB
        with requests.get(website.url, timeout=15, stream=True) as response:
            # TTFB is the time when headers are received
            ttfb = time.time() - start_time
            
            # Read the content to get payload size
            content = response.content
            payload_size = len(content)
            
            response_time = time.time() - start_time
            status_code = response.status_code
            is_success = 200 <= status_code < 400
            error_message = None if is_success else f"HTTP {status_code}"
    except requests.exceptions.RequestException as e:
        response_time = time.time() - start_time
        status_code = None
        is_success = False
        error_message = str(e)

    # Log the result
    MonitorLog.objects.create(
        website=website,
        status_code=status_code,
        response_time=response_time,
        ttfb=ttfb,
        payload_size=payload_size,
        is_success=is_success,
        error_message=error_message
    )

    # Trigger latency snapshot if extremely high (e.g. > 5s) and successful
    if is_success and response_time and response_time > 5.0:
        # Debounce logic: rely on the snapshot timestamps or just take it sparsely
        # For simplicity, just fire the task
        take_system_snapshot(
            title=f"High Latency Spike: {website.name}",
            reason=f"Response time spiked to {response_time:.2f}s",
            website_id=website.id,
            response_time=response_time
        )

    # State update logic
    prev_status = website.current_status
    now = timezone.now()
    
    if is_success:
        website.consecutive_failures = 0
        website.consecutive_successes += 1
        
        # Check for recovery
        if prev_status == 'down' and website.consecutive_successes >= website.recovery_threshold:
            website.current_status = 'up'
            # Resolve incident
            active_incident = website.incidents.filter(is_resolved=False).first()
            if active_incident:
                active_incident.end_time = now
                active_incident.is_resolved = True
                duration = (now - active_incident.start_time).total_seconds()
                active_incident.mttr_seconds = int(duration)
                active_incident.save()
                
                # Big Signal: Recovery Alert
                send_alert(website, "RECOVERED", f"Service is back online after {int(duration/60)} minutes.")
    else:
        website.consecutive_successes = 0
        website.consecutive_failures += 1
        
        # Check for failure
        if prev_status != 'down':
            # Small Signal/Warning: First few failures
            if website.consecutive_failures == 1:
                website.current_status = 'down' # Mark as down immediately to trigger fast polling
                inc = Incident.objects.create(website=website, reason=error_message)
                
                # Crashlytics Snapshot
                take_system_snapshot(
                    title=f"Service Failure: {website.name}",
                    reason=f"Service dropped offline. Error: {error_message}",
                    website_id=website.id,
                    incident_id=inc.id
                )
            
            # Big Signal: Escalation after threshold
            if website.consecutive_failures == website.alert_threshold:
                send_alert(website, "CRITICAL FAILURE", f"Service has failed {website.alert_threshold} consecutive times. Error: {error_message}")

    website.last_check_time = now
    website.save()

    # Dynamic Polling: If failing, check again in failure_poll_interval seconds
    if not is_success or website.current_status == 'down':
        logger.info(f"Website {website.name} is DOWN or failing. Scheduling next check in {website.failure_poll_interval}s")
        # Schedule next check in failure_poll_interval seconds
        check_website.apply_async(args=[website.id], countdown=website.failure_poll_interval)

def send_alert(website, level, message):
    subject = f"[{level}] Uptime Pulse: {website.name}"
    full_message = f"Alert for {website.name} ({website.url})\n\nLevel: {level}\nTime: {timezone.now()}\n\nMessage: {message}"
    
    print(f"ALERTER: {subject} - {message}") # Always log to console
    
    if website.alert_email:
        try:
            send_mail(
                subject,
                full_message,
                settings.DEFAULT_FROM_EMAIL,
                [website.alert_email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"FAILED TO SEND EMAIL: {e}")

@shared_task
def dispatch_all_checks():
    now = timezone.now()
    websites = Website.objects.filter(is_active=True)
    
    for website in websites:
        is_due = False
        
        if not website.last_check_time:
            is_due = True
        else:
            elapsed = (now - website.last_check_time).total_seconds()
            
            # If status is down, use failure_poll_interval (seconds)
            if website.current_status == 'down':
                if elapsed >= website.failure_poll_interval:
                    is_due = True
            # If status is up or pending, use check_interval (minutes)
            else:
                if elapsed >= (website.check_interval * 60):
                    is_due = True
        
        if is_due:
            logger.info(f"Dispatching check for {website.name} (Status: {website.current_status})")
            check_website.delay(website.id)

@shared_task
def check_system_health():
    config = SystemConfig.get_solo()
    
    cpu = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory().percent
    disk = psutil.disk_usage('/').percent
    
    redis_url = config.custom_redis_url or settings.CELERY_BROKER_URL
    try:
        r = redis.from_url(redis_url)
        point = {
            "time": time.time(),
            "cpu": cpu,
            "memory": memory,
            "disk": disk
        }
        r.lpush('system_health_history', json.dumps(point))
        r.ltrim('system_health_history', 0, 19) # Keep last 20 elements
        
        # Alerting logic
        if config.alert_email:
            spikes = []
            if cpu > config.cpu_alert_threshold:
                spikes.append(f"CPU at {cpu}% (Threshold {config.cpu_alert_threshold}%)")
            if memory > config.memory_alert_threshold:
                spikes.append(f"Memory at {memory}% (Threshold {config.memory_alert_threshold}%)")
            if disk > config.disk_alert_threshold:
                spikes.append(f"Disk at {disk}% (Threshold {config.disk_alert_threshold}%)")
                
            if spikes:
                # Need to debounce alerts so we don't spam every minute!
                last_alert = r.get('system_health_last_alert')
                if not last_alert or time.time() - float(last_alert) > 3600: # 1 hour cooldown
                    r.set('system_health_last_alert', time.time(), ex=3600)
                    subject = "CRITICAL: System Health Spike"
                    message = f"System resource spike detected:\n\n{chr(10).join(spikes)}"
                    print(f"ALERTER: {subject} - {message}")
                    # Trigger Crashlytics Snapshot
                    take_system_snapshot(
                        title=subject,
                        reason=message
                    )
                    
                    try:
                        send_mail(
                            subject,
                            message,
                            settings.DEFAULT_FROM_EMAIL,
                            [config.alert_email],
                            fail_silently=True,
                        )
                    except Exception as e:
                        print(f"FAILED TO SEND EMAIL: {e}")
    except Exception as e:
        print(f"Failed to record system health: {e}")
