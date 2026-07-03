#!/bin/bash
# deploy.sh - Script de despliegue automatizado para Producción

echo "🍔 Iniciando despliegue de Lajambre App..."

# 1. Asegurarse de tener los últimos cambios (si usas git)
# git pull origin main

# 2. Levantar la base de datos primero para que esté lista
echo "📦 Levantando Base de Datos..."
docker compose -f docker-compose.prod.yml up -d db

# Esperar unos segundos a que Postgres inicie
sleep 5

# 3. Construir la imagen del backend y levantar todo
echo "🚀 Construyendo y levantando contenedores..."
docker compose -f docker-compose.prod.yml up --build -d

# 4. Correr migraciones de Prisma
echo "🛠️ Ejecutando migraciones de base de datos..."
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

echo "✅ ¡Despliegue completado con éxito!"
echo "Puedes ver los logs con: docker compose -f docker-compose.prod.yml logs -f"
