from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User model for the Uptime Monitor.
    """
    is_master = models.BooleanField(default=False)

    def __str__(self):
        return self.username
