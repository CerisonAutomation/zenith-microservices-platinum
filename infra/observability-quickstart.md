# Observability Quick Start Guide

## 1. Start the Observability Stack

```bash
# From project root
docker-compose -f docker-compose.observability.yml up -d
```

## 2. Access the Dashboards

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | http://localhost:3000 | admin / zenith_admin |
| **Jaeger** | http://localhost:16686 | - |
| **Prometheus** | http://localhost:9090 | - |

## 3. Install Service Dependencies

### Node.js Services
```bash
# Auth Service
cd apps/auth_service && npm install

# Data Service
cd apps/data_service && npm install

# I18n Service
cd apps/i18n_service && npm install

# Payment Service
cd apps/payment_service && npm install

# API Gateway
cd apps/api_gateway && npm install
```

### Python Service
```bash
cd apps/user-service
pip install -r requirements.txt
```

## 4. Configure Environment Variables

Create a `.env` file in each service directory:

```bash
# Service Info
SERVICE_NAME=auth-service
SERVICE_VERSION=1.0.0
NODE_ENV=development

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Logging
LOG_LEVEL=info
```

## 5. Start Your Services

Services will automatically:
- Export traces to Jaeger
- Export metrics to Prometheus
- Send logs to Loki (via stdout)
- Generate correlation IDs

## 6. View Your Data

### Traces in Jaeger
1. Go to http://localhost:16686
2. Select your service
3. Click "Find Traces"
4. Explore the trace waterfall

### Metrics in Grafana
1. Go to http://localhost:3000
2. Navigate to "Dashboards"
3. Open "Zenith - Service Overview"
4. Select your service from the dropdown

### Logs in Grafana
1. Go to http://localhost:3000
2. Click "Explore"
3. Select "Loki" datasource
4. Query: `{service="auth-service"}`

## Common Tasks

### Find Slow Requests
**Grafana > Dashboards > Request Rate & Latency**
- View P95 and P99 latency
- Identify slow endpoints

### Investigate Errors
**Jaeger UI**
1. Filter by service
2. Add tag: `error=true`
3. Click on error trace
4. View error details and stack trace

### Correlate Logs with Traces
**In Grafana Explore (Loki)**
1. Find a log entry
2. Click on the `trace_id` value
3. Opens corresponding trace in Tempo

### Check Service Health
**Grafana > Dashboards > Service Overview**
- View service status
- Check error rates
- Monitor request rates

## Metrics Endpoints

Each service exposes metrics at:
- Node.js: `http://localhost:{port}/metrics`
- Python: `http://localhost:8000/metrics`

## Key Metrics

- `http_requests_total` - Total requests
- `http_request_duration_seconds` - Request latency
- `db_queries_total` - Database queries
- `db_query_duration_seconds` - Query latency

## Troubleshooting

### No Traces?
1. Check service logs: `docker-compose logs <service-name>`
2. Verify Jaeger is running: `docker-compose -f docker-compose.observability.yml ps`
3. Test OTLP endpoint: `curl http://localhost:4318/v1/traces`

### No Metrics?
1. Check Prometheus targets: http://localhost:9090/targets
2. Verify service metrics endpoint: `curl http://localhost:3001/metrics`
3. Check Prometheus config: `/infra/monitoring/prometheus.yml`

### No Logs?
1. Check Loki: `curl http://localhost:3100/ready`
2. Verify Promtail: `docker-compose -f docker-compose.observability.yml logs promtail`
3. Check service stdout logs

## Best Practices

1. **Always use correlation IDs** - They're automatically added to requests
2. **Add context to spans** - Use span attributes for business data
3. **Log with structure** - Use JSON format in production
4. **Monitor your monitors** - Check observability stack health
5. **Set up alerts** - Configure Prometheus alerting rules

## Next Steps

- Read full documentation: `/OBSERVABILITY_IMPLEMENTATION.md`
- Create custom dashboards in Grafana
- Add custom metrics to your services
- Set up alerting with Alertmanager
- Configure retention policies

## Quick Commands

```bash
# View all observability services
docker-compose -f docker-compose.observability.yml ps

# View logs
docker-compose -f docker-compose.observability.yml logs -f

# Restart specific service
docker-compose -f docker-compose.observability.yml restart grafana

# Stop observability stack
docker-compose -f docker-compose.observability.yml down

# Stop and remove volumes (reset all data)
docker-compose -f docker-compose.observability.yml down -v
```
