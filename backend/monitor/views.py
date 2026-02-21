from django.db import models
import psutil
import os
from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from django.conf import settings
import redis
import psycopg2
import json

from .models import Website, MonitorLog, SystemConfig, SystemSnapshot
from .serializers import WebsiteSerializer, MonitorLogSerializer, SystemSnapshotSerializer

@method_decorator(csrf_exempt, name='dispatch')
class WebsiteViewSet(viewsets.ModelViewSet):
    serializer_class = WebsiteSerializer

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def history(self, request, pk=None):
        website = self.get_object()
        hours = int(request.query_params.get('hours', 24))
        from django.utils import timezone
        from datetime import timedelta
        since = timezone.now() - timedelta(hours=hours)
        logs = website.logs.filter(timestamp__gte=since).order_by('-timestamp')
        
        # Debug: Print to console
        print(f"DEBUG: Fetching history for {website.name} (ID: {website.id}) - Found {logs.count()} logs since {since}")
        
        serializer = MonitorLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def trigger_check(self, request, pk=None):
        website = self.get_object()
        from .tasks import check_website
        check_website.delay(website.id)
        return Response({'status': 'check triggered'})

    def get_queryset(self):
        if self.request.user.is_master or self.request.user.is_staff:
            return Website.objects.all()
        return Website.objects.filter(
            models.Q(owner=self.request.user) | 
            models.Q(authorized_users=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        website = serializer.save(owner=self.request.user)
        from .tasks import check_website
        check_website.delay(website.id)

@method_decorator(csrf_exempt, name='dispatch')
class MonitorLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MonitorLogSerializer
    
    def get_queryset(self):
        if self.request.user.is_master or self.request.user.is_staff:
            queryset = MonitorLog.objects.all()
        else:
            queryset = MonitorLog.objects.filter(
                models.Q(website__owner=self.request.user) | 
                models.Q(website__authorized_users=self.request.user)
            ).distinct()
            
        website_id = self.request.query_params.get('website_id')
        if website_id:
            queryset = queryset.filter(website_id=website_id)
            
        return queryset

@method_decorator(csrf_exempt, name='dispatch')
class SystemSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SystemSnapshotSerializer
    
    def get_queryset(self):
        if self.request.user.is_master or self.request.user.is_staff or getattr(self.request.user, 'can_view_crashlytics', False):
            return SystemSnapshot.objects.all()
        return SystemSnapshot.objects.none()

class SystemHealthView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_master or request.user.is_staff or getattr(request.user, 'can_view_system_health', False)):
            return Response({"error": "Unauthorized"}, status=403)
            
        config = SystemConfig.get_solo()
        
        # Check Database
        db_status = "Healthy"
        if config.custom_postgres_url:
            try:
                conn = psycopg2.connect(config.custom_postgres_url, connect_timeout=3)
                conn.close()
            except Exception as e:
                db_status = f"Down ({str(e)})"
        else:
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
            except Exception as e:
                db_status = f"Down ({str(e)})"

        # Check Cache/Broker (Redis)
        redis_status = "Healthy"
        redis_url = config.custom_redis_url or settings.CELERY_BROKER_URL
        try:
            r = redis.from_url(redis_url, socket_timeout=2)
            r.ping()
        except Exception as e:
            redis_status = f"Down ({str(e)})"

        net = psutil.net_io_counters()

        # Fetch history
        history = []
        try:
            r = redis.from_url(redis_url, socket_timeout=2)
            raw = r.lrange('system_health_history', 0, 19)
            history = [json.loads(x) for x in raw]
            history.reverse() # chronological
        except:
            pass

        return Response({
            "cpu": psutil.cpu_percent(interval=None),
            "memory": psutil.virtual_memory().percent,
            "disk": psutil.disk_usage('/').percent,
            "load": os.getloadavg() if hasattr(os, 'getloadavg') else [0,0,0],
            "net_sent": net.bytes_sent,
            "net_recv": net.bytes_recv,
            "db_status": db_status,
            "redis_status": redis_status,
            "custom_postgres_url": config.custom_postgres_url,
            "custom_redis_url": config.custom_redis_url,
            "alert_email": config.alert_email,
            "cpu_alert_threshold": config.cpu_alert_threshold,
            "memory_alert_threshold": config.memory_alert_threshold,
            "disk_alert_threshold": config.disk_alert_threshold,
            "history": history
        })
        
    def post(self, request):
        if not (request.user.is_master or request.user.is_staff):
            return Response({"error": "Unauthorized"}, status=403)
            
        config = SystemConfig.get_solo()
        data = request.data
        if 'custom_postgres_url' in data:
            config.custom_postgres_url = data['custom_postgres_url']
        if 'custom_redis_url' in data:
            config.custom_redis_url = data['custom_redis_url']
        if 'alert_email' in data:
            config.alert_email = data['alert_email']
        if 'cpu_alert_threshold' in data:
            config.cpu_alert_threshold = int(data['cpu_alert_threshold'])
        if 'memory_alert_threshold' in data:
            config.memory_alert_threshold = int(data['memory_alert_threshold'])
        if 'disk_alert_threshold' in data:
            config.disk_alert_threshold = int(data['disk_alert_threshold'])
            
        config.save()
        return Response({"status": "Config updated"})
