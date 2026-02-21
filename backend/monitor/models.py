from django.db import models
from django.conf import settings

class Website(models.Model):
    STATUS_CHOICES = [
        ('up', 'Up'),
        ('down', 'Down'),
        ('pending', 'Pending'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='websites')
    name = models.CharField(max_length=255)
    url = models.URLField()
    check_interval = models.PositiveIntegerField(default=5, help_text="Frequency of checks in minutes")
    is_active = models.BooleanField(default=True)
    current_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    last_check_time = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.url})"

class MonitorLog(models.Model):
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    status_code = models.IntegerField(null=True, blank=True)
    response_time = models.FloatField(help_text="Response time in seconds")
    is_success = models.BooleanField()
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.website.name} check at {self.timestamp}"
