#!/bin/bash
set -e

echo "Aguardando PostgreSQL ficar pronto..."
while ! nc -z postgres 5432; do
  sleep 1
done

echo "Rodando migrations..."
alembic upgrade head

echo "Rodando seeder..."
python seed.py

echo "Iniciando aplicação..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
