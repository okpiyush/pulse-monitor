from django.contrib import admin
from .models import Website, MonitorLog

@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):
    list_display = ('name', 'url', 'owner', 'current_status', 'last_check_time')
    list_filter = ('current_status', 'is_active')
    search_fields = ('name', 'url')

@admin.register(MonitorLog)
class MonitorLogAdmin(admin.ModelAdmin):
    list_display = ('website', 'timestamp', 'status_code', 'response_time', 'is_success')
    list_filter = ('is_success',)
    date_hierarchy = 'timestamp'
