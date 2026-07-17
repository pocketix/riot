#!/bin/sh

DITTO_URL="http://gateway:8080"
POLICY_AUTH_HEADER="x-ditto-pre-authenticated: nginx:ditto"
CONNECTION_BASIC_AUTH="devops:foobar"

POLICY_ID="cz.riot:policy-1"
CONNECTION_ID="mosquitto-connection"

# waiting for Ditto API to be ready
until curl -s -u "$CONNECTION_BASIC_AUTH" -f -o /dev/null "$DITTO_URL/api/2/connections"; do
  printf "."
  sleep 5
done

# Check if the policy already exists
POLICY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$POLICY_AUTH_HEADER" "$DITTO_URL/api/2/policies/$POLICY_ID")

if [ "$POLICY_STATUS" -eq 200 ]; then
    echo "Policy '$POLICY_ID' already exists. Skipping..."
else
    echo "Policy '$POLICY_ID' does not exist. Creating..."
    curl -X PUT -H "$POLICY_AUTH_HEADER" -H "Content-Type: application/json" -d @/ditto-init/policy.json "$DITTO_URL/api/2/policies/$POLICY_ID"
    echo -e "Policy created."
fi

# Check if the connection already exists
CONN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -u "$CONNECTION_BASIC_AUTH" "$DITTO_URL/api/2/connections/$CONNECTION_ID")

if [ "$CONN_STATUS" -eq 200 ]; then
    echo "Connection '$CONNECTION_ID' already exists. Skipping..."
else
    echo "Connection '$CONNECTION_ID' does not exist. Creating..."
    curl -X PUT -u "$CONNECTION_BASIC_AUTH" -H "Content-Type: application/json" -d @/ditto-init/connection.json "$DITTO_URL/api/2/connections/$CONNECTION_ID"
    echo -e "Connection created."
fi