#!/bin/sh
echo "Iniciando migraciones de Prisma..."
npx prisma migrate deploy
echo "Migraciones completadas. Iniciando servidor..."
exec node dist/src/main
