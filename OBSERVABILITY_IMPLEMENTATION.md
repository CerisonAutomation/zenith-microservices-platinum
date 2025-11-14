# Zenith Microservices - Observability Implementation

## Overview

This document describes the comprehensive observability stack implemented for the Zenith microservices platform, featuring OpenTelemetry integration, distributed tracing, metrics collection, and centralized logging.

## Architecture

The observability stack consists of:

- **OpenTelemetry**: Industry-standard observability framework for distributed tracing and metrics
- **Jaeger**: Distributed tracing backend for visualizing request flows
- **Tempo**: High-volume distributed tracing storage by Grafana Labs
- **Prometheus**: Metrics collection and time-series database
- **Loki**: Log aggregation system
- **Promtail**: Log collector for Loki
- **Grafana**: Unified visualization and dashboarding platform

## Components

### 1. OpenTelemetry Integration

#### Node.js Services (auth, data, i18n, payment, gateway)

Each Node.js service includes:

**Dependencies** (`package.json`):
```json
{
  "@opentelemetry/sdk-node": "^0.45.0",
  "@opentelemetry/auto-instrumentations-node": "^0.39.4",
  "@opentelemetry/exporter-trace-otlp-http": "^0.45.0",
  "@opentelemetry/exporter-metrics-otlp-http": "^0.45.0",
  "@opentelemetry/sdk-metrics": "^1.18.0",
  "@opentelemetry/instrumentation-express": "^0.34.0",
  "@opentelemetry/instrumentation-http": "^0.45.0",
  "@opentelemetry/instrumentation-pg": "^0.38.0",
  "@opentelemetry/resources": "^1.18.0",
  "@opentelemetry/semantic-conventions": "^1.18.0",
  "prom-client": "^15.0.0",
  "winston": "^3.11.0",
  "uuid": "^9.0.1"
}
```

**Tracing Configuration** (`src/tracing.ts`):
- Automatic instrumentation of Express, HTTP, and PostgreSQL
- OTLP exporter configuration for traces and metrics
- Service resource attributes (name, version, environment)
- Graceful shutdown handling

**Logger** (`src/utils/logger.ts`):
- Structured JSON logging with Winston
- Automatic trace context injection (trace_id, span_id)
- Environment-based log levels
- Production file logging

**Metrics Middleware** (`src/middleware/metrics.ts`):
- Prometheus client integration
- HTTP request counter and duration histogram
- Database query metrics
- Service-specific custom metrics
- Metrics endpoint at `/metrics`

**Correlation Middleware** (`src/middleware/correlation.ts`):
- Correlation ID generation and propagation
- W3C Trace Context propagation
- Request/response header injection
- Span attribute enrichment

**Integration** (`src/index.ts`):
```typescript
// Initialize tracing first
import { startTracing } from './tracing';
startTracing();

// ... other imports

app.use(correlationIdMiddleware);
app.use(requestLogger);
app.use(metricsMiddleware);
app.get('/metrics', metricsHandler);
```

#### Python Service (user-service)

**Dependencies** (`requirements.txt`):
```
opentelemetry-api==1.20.0
opentelemetry-sdk==1.20.0
opentelemetry-exporter-otlp==1.20.0
opentelemetry-exporter-otlp-proto-http==1.20.0
opentelemetry-instrumentation==0.41b0
opentelemetry-instrumentation-fastapi==0.41b0
opentelemetry-instrumentation-httpx==0.41b0
opentelemetry-instrumentation-sqlalchemy==0.41b0
opentelemetry-instrumentation-redis==0.41b0
opentelemetry-instrumentation-requests==0.41b0
```

**Tracing Configuration** (`tracing.py`):
- FastAPI, SQLAlchemy, Redis, and HTTP client instrumentation
- OTLP exporters for traces and metrics
- Custom `@traced` decorator for manual span creation
- Automatic exception recording

**Logger** (`utils/logger.py`):
- JSON-formatted structured logging
- Trace context correlation
- Custom JSONFormatter with span context

**Correlation Middleware** (`middleware/correlation.py`):
- FastAPI middleware for correlation ID handling
- W3C Trace Context propagation
- Request state management

**Integration** (`main.py`):
```python
from tracing import instrument_app

app = FastAPI()
instrument_app(app, engine=db_engine)
app.add_middleware(CorrelationMiddleware)
```

### 2. Distributed Tracing

#### Jaeger

- **UI**: http://localhost:16686
- **Features**:
  - Trace visualization and search
  - Service dependency graph
  - Latency distribution analysis
  - Error rate tracking

#### Tempo

- **Endpoint**: http://localhost:3200
- **Features**:
  - High-volume trace storage
  - Integration with Grafana
  - Traces-to-metrics correlation
  - Traces-to-logs correlation

### 3. Metrics Collection

#### Prometheus

- **UI**: http://localhost:9090
- **Scrape Interval**: 10-15 seconds
- **Retention**: 30 days

**Monitored Services**:
- auth-service (port 3001)
- data-service (port 3002)
- i18n-service (port 3003)
- payment-service (port 3004)
- api-gateway (port 80)
- user-service (port 8000)

**Key Metrics**:
- `http_requests_total` - Total HTTP requests by service, method, route, status
- `http_request_duration_seconds` - HTTP request latency histogram
- `db_queries_total` - Database query count by operation
- `db_query_duration_seconds` - Database query latency histogram
- `db_pool_connections_active/idle/waiting` - Connection pool status

**Alerting Rules** (`prometheus-rules.yml`):
- HighErrorRate (>5% error rate for 5 minutes)
- HighLatency (p95 latency >1s for 5 minutes)
- ServiceDown (service unavailable for 2 minutes)
- HighMemoryUsage (>90% memory usage for 5 minutes)
- HighCPUUsage (>90% CPU usage for 5 minutes)
- DatabaseConnectionPoolExhaustion (>90% pool usage for 5 minutes)
- SlowDatabaseQueries (p95 query time >2s for 5 minutes)

### 4. Log Aggregation

#### Loki

- **Endpoint**: http://localhost:3100
- **Features**:
  - Centralized log storage
  - Label-based indexing
  - Integration with Grafana
  - Trace context correlation

#### Promtail

- **Configuration**: Docker container log collection
- **Features**:
  - Automatic service label extraction
  - JSON log parsing
  - Trace ID extraction
  - Real-time log streaming

### 5. Visualization

#### Grafana

- **UI**: http://localhost:3000
- **Credentials**: admin / zenith_admin (default)

**Datasources** (auto-provisioned):
- Prometheus (default)
- Jaeger
- Tempo (with traces-to-logs and traces-to-metrics)
- Loki (with derived trace ID fields)

**Dashboards**:

1. **Service Overview** (`service-overview.json`)
   - Request rate by service
   - P95 latency gauge
   - Error rate trends
   - Service health status

2. **Request Rate & Latency** (`request-latency.json`)
   - Latency percentiles (p50, p90, p95, p99)
   - Request rate by endpoint
   - Status code distribution
   - Service-specific filtering

3. **Database Performance** (`database-performance.json`)
   - Query latency (p95, p99)
   - Query rate by operation
   - Connection pool usage
   - Total query count

## Deployment

### Start Observability Stack

```bash
# Start observability services
docker-compose -f docker-compose.observability.yml up -d

# Verify services are running
docker-compose -f docker-compose.observability.yml ps
```

### Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | Dashboards and visualization |
| Prometheus | http://localhost:9090 | Metrics and alerting |
| Jaeger UI | http://localhost:16686 | Distributed tracing |
| Loki | http://localhost:3100 | Log aggregation |
| Tempo | http://localhost:3200 | Trace storage |

### Install Dependencies

**Node.js services**:
```bash
cd apps/auth_service && npm install
cd apps/data_service && npm install
cd apps/i18n_service && npm install
cd apps/payment_service && npm install
cd apps/api_gateway && npm install
```

**Python service**:
```bash
cd apps/user-service
pip install -r requirements.txt
```

### Environment Variables

Set the following environment variables for each service:

```bash
# Service identification
SERVICE_NAME=auth-service
SERVICE_VERSION=1.0.0
NODE_ENV=production  # or ENVIRONMENT for Python

# OpenTelemetry configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318

# Logging
LOG_LEVEL=info
```

## Usage

### Viewing Traces

1. Access Jaeger UI at http://localhost:16686
2. Select a service from the dropdown
3. Click "Find Traces" to view recent traces
4. Click on a trace to see the full span waterfall

### Querying Metrics

**Prometheus UI** (http://localhost:9090):
```promql
# Request rate
rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

### Viewing Logs

**Grafana Explore**:
1. Navigate to Explore in Grafana
2. Select "Loki" datasource
3. Use LogQL queries:
```logql
{service="auth-service"} |= "error"
{trace_id="<trace_id>"}
```

### Correlation

**Trace to Logs**:
1. View a trace in Tempo (via Grafana)
2. Click "Logs for this span" to see correlated logs

**Logs to Trace**:
1. View logs in Loki
2. Click on a trace_id to jump to the trace

**Trace to Metrics**:
1. View a trace in Tempo
2. Click "Service Graph" to see metrics for involved services

## Custom Instrumentation

### Node.js - Creating Custom Spans

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

async function myFunction() {
  const span = tracer.startSpan('my-operation');

  try {
    span.setAttribute('custom.attribute', 'value');

    // Your code here
    const result = await someOperation();

    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Python - Using the @traced Decorator

```python
from tracing import traced

@traced("custom-operation")
async def my_function():
    # Automatically creates a span
    # Exceptions are automatically recorded
    result = await some_operation()
    return result
```

### Adding Custom Metrics

**Node.js**:
```typescript
import { Counter, Histogram } from 'prom-client';
import { register } from './middleware/metrics';

const customCounter = new Counter({
  name: 'custom_operations_total',
  help: 'Total custom operations',
  labelNames: ['operation_type'],
  registers: [register],
});

customCounter.inc({ operation_type: 'example' });
```

**Python**:
```python
from opentelemetry import metrics

meter = metrics.get_meter(__name__)
custom_counter = meter.create_counter(
    "custom_operations_total",
    description="Total custom operations"
)

custom_counter.add(1, {"operation_type": "example"})
```

## Best Practices

### 1. Structured Logging
- Always use JSON format in production
- Include trace context (trace_id, span_id)
- Add relevant business context attributes
- Use appropriate log levels

### 2. Span Attributes
- Add meaningful attributes to spans
- Include business identifiers (user_id, order_id, etc.)
- Use semantic conventions when available
- Keep cardinality reasonable

### 3. Error Handling
- Always record exceptions in spans
- Set appropriate span status
- Include error details in span attributes
- Log errors with full context

### 4. Performance Considerations
- Sample traces in high-traffic scenarios
- Use appropriate metric bucket sizes
- Batch log writes
- Monitor exporter performance

### 5. Security
- Never log sensitive data (passwords, tokens, PII)
- Sanitize URLs and headers
- Use secure connections for exporters
- Implement proper access controls

## Troubleshooting

### Traces Not Appearing

1. Check service logs for OpenTelemetry initialization
2. Verify OTLP endpoint is accessible
3. Check Jaeger collector logs
4. Ensure services are generating traffic

### Missing Metrics

1. Verify Prometheus is scraping the service
2. Check service `/metrics` endpoint
3. Review Prometheus targets page
4. Ensure metric labels are correct

### Log Correlation Issues

1. Verify trace context propagation
2. Check logger configuration
3. Ensure correlation middleware is active
4. Review Promtail configuration

### High Cardinality Issues

1. Review metric label usage
2. Limit dynamic label values
3. Use exemplars instead of labels when appropriate
4. Monitor Prometheus memory usage

## Monitoring the Monitoring

Key metrics to watch:

- Prometheus TSDB storage size
- Jaeger collector queue length
- Loki ingestion rate
- Grafana query performance
- Exporter error rates

## Future Enhancements

- [ ] Alertmanager integration for alert routing
- [ ] Service mesh integration (Istio/Linkerd)
- [ ] Automatic anomaly detection
- [ ] Cost attribution and optimization
- [ ] Distributed profiling
- [ ] Synthetic monitoring
- [ ] Chaos engineering integration

## References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Tempo Documentation](https://grafana.com/docs/tempo/)

## Support

For issues or questions:
1. Check service logs in Loki
2. Review traces in Jaeger
3. Check metrics in Prometheus
4. Consult this documentation
5. Contact the platform team
