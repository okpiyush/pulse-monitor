# Uptime Pulse Monitor

A professional-grade website monitoring tool built with **Django** and **React**.

## Features
- **Real-time Monitoring**: Periodic background checks using Celery & Redis.
- **Premium Visualization**: High-resolution response time & uptime charts using Recharts.
- **Mobile Responsive**: Fully optimized for phone screens with a dedicated mobile navigation system.
- **Master Admin Account**: A main account that can create and manage other users.
- **Detailed Log History**: Full execution logs with HTTP status codes and millisecond-level latency.


## Tech Stack
- **Backend**: Django, DRF, Celery, Redis.
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Recharts.

## Setup Instructions

### 1. Redis
Ensure Redis is running on your system (usually port 6379).
```bash
brew install redis
brew services start redis
```

### 2. Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
# Start Django Server
python manage.py runserver
# Start Celery Worker (In a new terminal)
celery -A core worker -l info
# Start Celery Beat (For periodic tasks)
celery -A core beat -l info
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```


# pulse-monitor
