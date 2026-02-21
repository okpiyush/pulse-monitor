from rest_framework import serializers
from .models import Website, MonitorLog

class MonitorLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitorLog
        fields = ['id', 'timestamp', 'status_code', 'response_time', 'is_success', 'error_message']

class WebsiteSerializer(serializers.ModelSerializer):
    recent_logs = serializers.SerializerMethodField()
    uptime_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Website
        fields = [
            'id', 'name', 'url', 'check_interval', 'is_active', 
            'current_status', 'last_check_time', 'recent_logs', 'uptime_percentage'
        ]
        read_only_fields = ['owner', 'current_status', 'last_check_time']

    def get_recent_logs(self, obj):
        logs = obj.logs.all()[:10]
        return MonitorLogSerializer(logs, many=True).data

    def get_uptime_percentage(self, obj):
        total = obj.logs.count()
        if total == 0:
            return 100
        success = obj.logs.filter(is_success=True).count()
        return round((success / total) * 100, 2)
