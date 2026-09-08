#!/bin/sh
set -e

echo "🔄 Running Prisma migrations..."
until npx prisma migrate deploy; do
  echo "⏳ DB not ready or still starting, retrying migrate deploy in 5s..."
  sleep 5
done

echo "🚀 Starting application..."
exec node dist/main.js
