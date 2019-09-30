#!/bin/bash
echo "KAFKA replayer service"
# echo Command line arguments: "$@"
echo Broker '<HOSTNAME:<PORT>': $KAFKA_BROKER_URL 
echo Schema registry '<HOSTNAME:<PORT>': $SCHEMA_REGISTRY_URL
cd /app
http-server public &>/dev/null &
node dist/index.js -k $KAFKA_BROKER_URL -s $SCHEMA_REGISTRY_URL -p $API_REST_PORT -f /app/logs