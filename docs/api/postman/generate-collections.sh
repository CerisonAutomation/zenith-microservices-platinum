#!/bin/bash

# Zenith Microservices - Postman Collection Generator
# This script generates Postman collections from OpenAPI specifications

set -e

echo "🚀 Generating Postman Collections from OpenAPI Specs"
echo "=================================================="

# Check if services are running
check_service() {
    local url=$1
    local name=$2

    echo "Checking $name..."
    if curl -s -f -o /dev/null "$url/health" || curl -s -f -o /dev/null "$url/health/live"; then
        echo "✓ $name is running"
        return 0
    else
        echo "⚠ $name is not running at $url"
        return 1
    fi
}

# Install dependencies if needed
if ! command -v openapi-to-postmanv2 &> /dev/null; then
    echo "Installing openapi-to-postmanv2..."
    npm install -g openapi-to-postmanv2
fi

# Create output directory
OUTPUT_DIR="$(dirname "$0")"
mkdir -p "$OUTPUT_DIR"

# Service configurations
declare -A SERVICES=(
    ["auth"]="http://localhost:3001"
    ["data"]="http://localhost:3003"
    ["payment"]="http://localhost:3002"
    ["i18n"]="http://localhost:3004"
    ["gateway"]="http://localhost:8080"
)

declare -A FASTAPI_SERVICES=(
    ["user"]="http://localhost:8000"
)

echo ""
echo "Generating collections for TypeScript services..."
echo "------------------------------------------------"

for service in "${!SERVICES[@]}"; do
    url="${SERVICES[$service]}"

    if check_service "$url" "$service-service"; then
        echo "Generating collection for $service-service..."

        openapi-to-postmanv2 \
            -s "$url/openapi.json" \
            -o "$OUTPUT_DIR/${service}-service.postman_collection.json" \
            -p

        echo "✓ Generated ${service}-service.postman_collection.json"
    fi
    echo ""
done

echo "Generating collections for FastAPI services..."
echo "------------------------------------------------"

for service in "${!FASTAPI_SERVICES[@]}"; do
    url="${FASTAPI_SERVICES[$service]}"

    if check_service "$url" "$service-service"; then
        echo "Generating collection for $service-service..."

        openapi-to-postmanv2 \
            -s "$url/api/openapi.json" \
            -o "$OUTPUT_DIR/${service}-service.postman_collection.json" \
            -p

        echo "✓ Generated ${service}-service.postman_collection.json"
    fi
    echo ""
done

echo ""
echo "=================================================="
echo "✓ Collection generation complete!"
echo ""
echo "Import these collections into Postman:"
echo "  1. Open Postman"
echo "  2. Click Import"
echo "  3. Select files from: $OUTPUT_DIR"
echo "  4. Import the environment file: zenith-environment.json"
echo ""
