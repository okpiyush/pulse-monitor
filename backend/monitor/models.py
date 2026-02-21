from django.db import models
from django.conf import settings

class Website(models.Model):
    STATUS_CHOICES = [
        ('up', 'Up'),
        ('down', 'Down'),
        ('pending', 'Pending'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_websites')
    authorized_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='accessible_websites', blank=True)
    name = models.CharField(max_length=255)
    url = models.URLField()
    
    # Polling Configuration
    check_interval = models.PositiveIntegerField(default=5, help_text="Standard frequency in minutes")
    failure_poll_interval = models.PositiveIntegerField(default=5, help_text="Poll frequency in seconds when down")
    
    # Alerting Configuration
    alert_threshold = models.PositiveIntegerField(default=3, help_text="Consecutive failures before critical alert")
    recovery_threshold = models.PositiveIntegerField(default=2, help_text="Consecutive successes before marking UP")
    alert_email = models.EmailField(blank=True, null=True)
    
    # State tracking
    is_active = models.BooleanField(default=True)
    current_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    last_check_time = models.DateTimeField(null=True, blank=True)
    consecutive_failures = models.PositiveIntegerField(default=0)
    consecutive_successes = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.url})"

class MonitorLog(models.Model):
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    status_code = models.IntegerField(null=True, blank=True)
    response_time = models.FloatField(help_text="Response time in seconds")
    ttfb = models.FloatField(null=True, blank=True, help_text="Time to first byte in seconds")
    payload_size = models.IntegerField(null=True, blank=True, help_text="Payload size in bytes")
    is_success = models.BooleanField()
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.website.name} check at {self.timestamp}"

class Incident(models.Model):
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='incidents')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    reason = models.TextField(blank=True)
    is_resolved = models.BooleanField(default=False)
    mttr_seconds = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return f"Incident for {self.website.name} at {self.start_time}"

class SystemConfig(models.Model):
    custom_postgres_url = models.CharField(max_length=500, blank=True, null=True)
    custom_redis_url = models.CharField(max_length=500, blank=True, null=True)
    
    alert_email = models.EmailField(blank=True, null=True)
    cpu_alert_threshold = models.IntegerField(default=85, help_text="CPU percentage")
    memory_alert_threshold = models.IntegerField(default=85, help_text="RAM percentage")
    disk_alert_threshold = models.IntegerField(default=85, help_text="Disk percentage")
    
    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

class SystemSnapshot(models.Model):
    title = models.CharField(max_length=255)
    reason = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Hardware Telemetry at the time of the snapshot
    cpu = models.FloatField()
    memory = models.FloatField()
    disk = models.FloatField()
    load_1 = models.FloatField(default=0)
    load_5 = models.FloatField(default=0)
    load_15 = models.FloatField(default=0)
    net_sent = models.BigIntegerField(default=0)
    net_recv = models.BigIntegerField(default=0)
    
    # Context
    website = models.ForeignKey('Website', on_delete=models.SET_NULL, null=True, blank=True, related_name='snapshots')
    incident = models.ForeignKey('Incident', on_delete=models.SET_NULL, null=True, blank=True, related_name='snapshots')
    response_time = models.FloatField(null=True, blank=True, help_text="In seconds, if triggered by latency spike")

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Snapshot: {self.title} at {self.timestamp}"

