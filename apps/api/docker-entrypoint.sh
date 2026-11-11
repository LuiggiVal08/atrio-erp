#!/bin/sh
set -e

if [ -n "$MIGRATE_DATABASE_URL" ]; then
  echo "Running database migrations via direct connection..."
  DATABASE_URL="$MIGRATE_DATABASE_URL" npx prisma migrate deploy
else
  echo "Running database migrations..."
  npx prisma migrate deploy
fi

echo "Starting application..."
exec node dist/apps/api/src/main
