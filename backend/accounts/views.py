from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    accessible_websites = serializers.PrimaryKeyRelatedField(
        many=True, 
        read_only=True
    )
    
    # We use this for writing assignments
    monitor_access = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'is_master', 'is_staff', 'can_view_system_health', 'can_view_crashlytics', 'accessible_websites', 'monitor_access']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        monitor_access = validated_data.pop('monitor_access', [])
        user = User.objects.create_user(**validated_data)
        if monitor_access:
            from monitor.models import Website
            websites = Website.objects.filter(id__in=monitor_access)
            user.accessible_websites.set(websites)
        return user

    def update(self, instance, validated_data):
        monitor_access = validated_data.pop('monitor_access', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
        
        instance.save()
        
        if monitor_access is not None:
            from monitor.models import Website
            websites = Website.objects.filter(id__in=monitor_access)
            instance.accessible_websites.set(websites)
            
        return instance


class IsMasterUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and (request.user.is_master or request.user.is_staff)

@method_decorator(csrf_exempt, name='dispatch')
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [IsMasterUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):

    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            return Response(UserSerializer(user).data)
        return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)

@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    def post(self, request):

        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)

