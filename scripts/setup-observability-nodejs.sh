#!/bin/bash

# Script to set up OpenTelemetry observability for Node.js services
# Usage: ./setup-observability-nodejs.sh <service-name> <service-port>

set -e

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <service-name> <service-port>"
    echo "Example: $0 data-service 3002"
    exit 1
fi

SERVICE_NAME=$1
SERVICE_PORT=$2
SERVICE_DIR="/home/user/zenith-microservices-platinum/apps/${SERVICE_NAME//-/_}"

echo "Setting up observability for $SERVICE_NAME in $SERVICE_DIR..."

# Check if service directory exists
if [ ! -d "$SERVICE_DIR" ]; then
    echo "Error: Service directory $SERVICE_DIR does not exist"
    exit 1
fi

# Create directories if they don't exist
mkdir -p "$SERVICE_DIR/src/middleware"
mkdir -p "$SERVICE_DIR/src/utils"

# Copy tracing configuration
cat > "$SERVICE_DIR/src/tracing.ts" << 'EOF'
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const serviceName = process.env.SERVICE_NAME || 'SERVICE_NAME_PLACEHOLDER';
const serviceVersion = process.env.SERVICE_VERSION || '1.0.0';
const environment = process.env.NODE_ENV || 'development';

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
  headers: {},
});

const metricExporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://jaeger:4318/v1/metrics',
  headers: {},
});

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
  [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'zenith-microservices',
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: (request) => {
          const url = request.url || '';
          return url.includes('/health') || url.includes('/metrics');
        },
      },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
        enhancedDatabaseReporting: true,
      },
    }),
  ],
});

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

export const startTracing = async () => {
  try {
    await sdk.start();
    console.log(\`OpenTelemetry initialized for \${serviceName}\`);
  } catch (error) {
    console.error('Error initializing OpenTelemetry:', error);
  }
};

export default sdk;
EOF

# Replace service name placeholder
sed -i "s/SERVICE_NAME_PLACEHOLDER/$SERVICE_NAME/g" "$SERVICE_DIR/src/tracing.ts"

# Copy logger utility
cp "/home/user/zenith-microservices-platinum/apps/auth_service/src/utils/logger.ts" "$SERVICE_DIR/src/utils/logger.ts"

# Copy correlation middleware
cp "/home/user/zenith-microservices-platinum/apps/auth_service/src/middleware/correlation.ts" "$SERVICE_DIR/src/middleware/correlation.ts"

# Copy metrics middleware
cp "/home/user/zenith-microservices-platinum/apps/auth_service/src/middleware/metrics.ts" "$SERVICE_DIR/src/middleware/metrics.ts"

echo "✓ Observability files created for $SERVICE_NAME"
echo "✓ Next steps:"
echo "  1. Add OpenTelemetry dependencies to package.json"
echo "  2. Update index.ts to import and initialize tracing"
echo "  3. Add correlation and metrics middleware"
echo "  4. Run: npm install"
