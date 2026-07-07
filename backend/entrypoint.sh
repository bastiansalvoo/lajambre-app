#!/bin/sh
set -e

echo "DATABASE_URL is: $DATABASE_URL"
export DATABASE_URL=$(echo $DATABASE_URL | sed -e 's/^"//' -e 's/"$//')
node -e "console.log('Node sees DATABASE_URL:', process.env.DATABASE_URL)"
echo "Iniciando migraciones de Prisma..."
npx --yes prisma@7.5.0 migrate deploy
echo "Migraciones completadas. Iniciando servidor..."
exec node dist/src/main
