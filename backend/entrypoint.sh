#!/bin/sh
set -e

echo "Iniciando migraciones de Prisma..."
npx --yes prisma@7.5.0 migrate deploy
echo "Migraciones completadas. Iniciando servidor..."
exec node dist/src/main
