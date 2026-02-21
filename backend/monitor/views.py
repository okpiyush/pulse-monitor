from rest_framework import viewsets, permissions
from .models import Website, MonitorLog
from .serializers import WebsiteSerializer, MonitorLogSerializer

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import action
from rest_framework.response import Response

@method_decorator(csrf_exempt, name='dispatch')
class WebsiteViewSet(viewsets.ModelViewSet):
    serializer_class = WebsiteSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def trigger_check(self, request, pk=None):
        website = self.get_object()
        from .tasks import check_website
        check_website.delay(website.id)
        return Response({'status': 'check triggered'})

    
    def get_queryset(self):
        # Master user can see everything, others only their own
        if self.request.user.is_master or self.request.user.is_staff:
            return Website.objects.all()
        return Website.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        website = serializer.save(owner=self.request.user)
        from .tasks import check_website
        check_website.delay(website.id)


@method_decorator(csrf_exempt, name='dispatch')
class MonitorLogViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = MonitorLogSerializer
    
    def get_queryset(self):
        # Base queryset depends on user role
        if self.request.user.is_master or self.request.user.is_staff:
            queryset = MonitorLog.objects.all()
        else:
            queryset = MonitorLog.objects.filter(website__owner=self.request.user)
            
        website_id = self.request.query_params.get('website_id')
        if website_id:
            queryset = queryset.filter(website_id=website_id)
            
        return queryset

