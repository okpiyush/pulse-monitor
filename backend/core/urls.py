from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from monitor.views import WebsiteViewSet, MonitorLogViewSet
from accounts.views import UserViewSet, LoginView, LogoutView

router = DefaultRouter()
router.register(r'websites', WebsiteViewSet, basename='website')
router.register(r'logs', MonitorLogViewSet, basename='log')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('admin/', admin.site.admin_urls if hasattr(admin.site, 'admin_urls') else admin.site.urls),
    path('api/', include(router.urls)),
    path('api/login/', LoginView.as_view(), name='api_login'),
    path('api/logout/', LogoutView.as_view(), name='api_logout'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]

