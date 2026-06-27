#!/bin/sh
echo "Running database init..."
npx ts-node --transpile-only src/db/seed.ts --init || true
echo "Running database seed..."
npx ts-node --transpile-only src/db/seed.ts || true
echo "Starting server..."
node dist/index.js