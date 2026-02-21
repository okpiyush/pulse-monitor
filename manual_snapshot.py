import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from monitor.tasks import take_system_snapshot

print("Taking snapshot...")
take_system_snapshot(
    title="Simulated Spike: Kernel Panic",
    reason="Simulated artificial crash for Crashlytics Inspector testing.",
    response_time=7.42
)
print("Snapshot taken.")
