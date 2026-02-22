# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Email Configuration Defaults
ENV EMAIL_HOST=smtp.gmail.com
ENV EMAIL_PORT=587
ENV EMAIL_USE_TLS=True
ENV EMAIL_HOST_USER=""
ENV EMAIL_HOST_PASSWORD=""

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/
RUN mkdir -p /app/data
RUN chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Start server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

