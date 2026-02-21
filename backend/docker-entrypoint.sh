#!/bin/sh

# Perform migrations
python manage.py migrate --noinput

# Create superuser if it doesn't exist
python manage.py shell <<EOF
from accounts.models import User
import os
username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')

if username and password:
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password, is_master=True)
        print(f"Superuser {username} created and assigned Master privileges.")
    else:
        print(f"User {username} already exists. Skipping creation.")
else:
    print("DJANGO_SUPERUSER_USERNAME or DJANGO_SUPERUSER_PASSWORD not set. Skipping superuser creation.")
EOF

# Collect static files (optional but good for production)
# python manage.py collectstatic --noinput

# Start the application
exec "$@"
