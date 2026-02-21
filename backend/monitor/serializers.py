from rest_framework import serializers
from .models import Website, MonitorLog, Incident, SystemSnapshot
import numpy as np

class MonitorLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitorLog
        fields = ['id', 'timestamp', 'status_code', 'response_time', 'ttfb', 'payload_size', 'is_success', 'error_message']

class IncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = ['id', 'start_time', 'end_time', 'reason', 'is_resolved', 'mttr_seconds']

class SystemSnapshotSerializer(serializers.ModelSerializer):
    website_name = serializers.CharField(source='website.name', read_only=True)
    
    class Meta:
        model = SystemSnapshot
        fields = '__all__'

class WebsiteSerializer(serializers.ModelSerializer):
    recent_logs = serializers.SerializerMethodField()
    uptime_percentage = serializers.SerializerMethodField()
    performance_metrics = serializers.SerializerMethodField()
    active_incident = serializers.SerializerMethodField()

    class Meta:
        model = Website
        fields = [
            'id', 'name', 'url', 'check_interval', 'failure_poll_interval',
            'alert_threshold', 'recovery_threshold', 'alert_email',
            'is_active', 'current_status', 'last_check_time', 
            'recent_logs', 'uptime_percentage', 'performance_metrics', 'active_incident'
        ]
        read_only_fields = ['owner', 'current_status', 'last_check_time', 'consecutive_failures']

    def get_recent_logs(self, obj):
        logs = obj.logs.all()[:20]
        return MonitorLogSerializer(logs, many=True).data

    def get_uptime_percentage(self, obj):
        # Last 30 days logic (simplified for now)
        total = obj.logs.count()
        if total == 0:
            return 100
        success = obj.logs.filter(is_success=True).count()
        return round((success / total) * 100, 2)

    def get_performance_metrics(self, obj):
        # Calculate P95, P99 from last 100 successful logs
        latencies = list(obj.logs.filter(is_success=True).values_list('response_time', flat=True)[:100])
        if not latencies:
            return None
        
        return {
            "avg": round(float(np.mean(latencies)) * 1000, 2),
            "p95": round(float(np.percentile(latencies, 95)) * 1000, 2),
            "p99": round(float(np.percentile(latencies, 99)) * 1000, 2),
            "std": round(float(np.std(latencies)) * 1000, 2)
        }

    def get_active_incident(self, obj):
        incident = obj.incidents.filter(is_resolved=False).first()
        if incident:
            return IncidentSerializer(incident).data
        return None
