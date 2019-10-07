#!/bin/bash
echo "KAFKA replayer service"
cd /app

# Environment variables are baked into builded vue application.
for file in /app/public/js/app.*.js*;
do
  echo "Processing $file ...";
  sed -i 's|VUE_APP_PATH_REPLACE_AT_RUNTIME|'${VUE_APP_REPLAYER_REST_API}'|g' $file 
done

echo "Start web server on port 8080"
http-server public &>/dev/null &
echo "Execute: node dist/index.js -k $REPLAYER_KAFKA_BROKER_URL -s $REPLAYER_SCHEMA_REGISTRY_URL -p 8200 -f logs"
node dist/index.js -k $REPLAYER_KAFKA_BROKER_URL -s $REPLAYER_SCHEMA_REGISTRY_URL -p 8200 -f logs