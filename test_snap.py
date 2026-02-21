import os
import django
import sys

# Append backend path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

import psutil
from monitor.models import SystemSnapshot

def create_mock():
    print("Taking snapshot...")
    cpu = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory().percent
    disk = psutil.disk_usage('/').percent
    
    load = os.getloadavg() if hasattr(os, 'getloadavg') else [0,0,0]
    net = psutil.net_io_counters()

    SystemSnapshot.objects.create(
        title="Simulated Spike: Artificial Kernel Error",
        reason="Triggered manually via script for Crashlytics inspection.",
        response_time=7.42,
        cpu=cpu,
        memory=memory,
        disk=disk,
        load_1=load[0],
        load_5=load[1],
        load_15=load[2],
        net_sent=net.bytes_sent,
        net_recv=net.bytes_recv
    )

create_mock()
print("Snapshot taken.")
