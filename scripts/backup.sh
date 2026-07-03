#!/bin/bash
# backup.sh - Script para respaldar la base de datos

TIMESTAMP=$(date +"%F_%H-%M-%S")
BACKUP_DIR="./backups"
DB_USER="postgres"
DB_NAME="lajambre"

mkdir -p "$BACKUP_DIR"

echo "💾 Iniciando respaldo de la base de datos..."

# Ejecutar pg_dump dentro del contenedor
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" -F c > "$BACKUP_DIR/db_backup_$TIMESTAMP.dump"

echo "✅ Respaldo completado: $BACKUP_DIR/db_backup_$TIMESTAMP.dump"
