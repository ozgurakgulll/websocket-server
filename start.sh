#!/bin/bash
source .env
ENVIRONMENT="$NODE_ENV"

pm2 delete "$ENVIRONMENT"


START_PORT=3001
NUM_INSTANCES=4

for i in $(seq 0 $((NUM_INSTANCES - 1))); do
  PORT=$((START_PORT + i))
  pm2 start "npm run start" \
    --name "${ENVIRONMENT}-${PORT}" \
    --log-date-format 'DD-MM HH:mm:ss.SSS' \
    --env PORT=$PORT
done
