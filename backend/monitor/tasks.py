import requests
import time
from celery import shared_task
from django.utils import timezone
from .models import Website, MonitorLog

@shared_task
def check_website(website_id):
    try:
        website = Website.objects.get(id=website_id)
    except Website.DoesNotExist:
        return

    start_time = time.time()
    try:
        response = requests.get(website.url, timeout=10)
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
        is_success=is_success,
        error_message=error_message
    )

    # Update website status
    website.current_status = 'up' if is_success else 'down'
    website.last_check_time = timezone.now()
    website.save()

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
            if elapsed >= (website.check_interval * 60):
                is_due = True
        
        if is_due:
            check_website.delay(website.id)

