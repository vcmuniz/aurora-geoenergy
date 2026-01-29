FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
  curl \
  netcat-traditional \
  && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Copy migrations
COPY migrations ./migrations
COPY alembic.ini .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["./entrypoint.sh"]
