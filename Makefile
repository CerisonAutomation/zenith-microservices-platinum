# Makefile for Zenith Microservices Platform

.PHONY: help install test lint type-check build clean docker-build docker-push deploy-staging deploy-production k8s-deploy k8s-delete logs

# Default target
help:
	@echo "Zenith Microservices Platform - Makefile Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install          - Install all dependencies"
	@echo "  make dev              - Start development environment with docker-compose"
	@echo "  make test             - Run all tests"
	@echo "  make lint             - Run linters for all services"
	@echo "  make type-check       - Run type checkers"
	@echo "  make format           - Format code (Prettier, Black)"
	@echo "  make clean            - Clean build artifacts and dependencies"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build     - Build all Docker images"
	@echo "  make docker-push      - Push images to registry"
	@echo "  make docker-up        - Start services with docker-compose"
	@echo "  make docker-down      - Stop services"
	@echo "  make docker-logs      - View docker-compose logs"
	@echo ""
	@echo "Kubernetes:"
	@echo "  make k8s-deploy-staging    - Deploy to staging Kubernetes"
	@echo "  make k8s-deploy-production - Deploy to production Kubernetes"
	@echo "  make k8s-delete-staging    - Delete staging deployment"
	@echo "  make k8s-delete-production - Delete production deployment"
	@echo "  make k8s-status            - Show Kubernetes status"
	@echo "  make k8s-logs              - Show logs from Kubernetes pods"
	@echo ""
	@echo "CI/CD:"
	@echo "  make ci               - Run full CI pipeline locally"
	@echo "  make security-scan    - Run security scans"
	@echo "  make coverage         - Generate test coverage report"

# Install dependencies
install:
	@echo "Installing Node.js dependencies..."
	@for service in apps/frontend apps/auth_service apps/api_gateway apps/data_service apps/i18n_service apps/payment_service; do \
		echo "Installing $$service..."; \
		cd $$service && npm install && cd ../..; \
	done
	@echo "Installing Python dependencies..."
	@cd apps/user-service && pip install -r requirements.txt && cd ../..

# Start development environment
dev:
	docker-compose up -d
	@echo "Development environment started!"
	@echo "Frontend: http://localhost:3000"
	@echo "API Gateway: http://localhost:8080"
	@echo "Grafana: http://localhost:3005 (admin/admin)"
	@echo "Prometheus: http://localhost:9090"
	@echo "Jaeger: http://localhost:16686"

# Stop development environment
dev-down:
	docker-compose down

# Run all tests
test:
	@echo "Running tests for Node.js services..."
	@for service in apps/frontend apps/auth_service apps/api_gateway apps/data_service apps/i18n_service apps/payment_service; do \
		echo "Testing $$service..."; \
		cd $$service && npm test && cd ../..; \
	done
	@echo "Running tests for Python services..."
	@cd apps/user-service && pytest && cd ../..

# Run linters
lint:
	@echo "Linting Node.js services..."
	@for service in apps/frontend apps/auth_service apps/api_gateway apps/data_service apps/i18n_service apps/payment_service; do \
		echo "Linting $$service..."; \
		cd $$service && npm run lint && cd ../..; \
	done
	@echo "Linting Python services..."
	@cd apps/user-service && flake8 . && cd ../..

# Run type checkers
type-check:
	@echo "Type checking Node.js services..."
	@for service in apps/auth_service apps/api_gateway apps/data_service apps/i18n_service apps/payment_service; do \
		echo "Type checking $$service..."; \
		cd $$service && npx tsc --noEmit && cd ../..; \
	done
	@echo "Type checking Python services..."
	@cd apps/user-service && mypy . --ignore-missing-imports && cd ../..

# Format code
format:
	@echo "Formatting Node.js code..."
	@for service in apps/frontend apps/auth_service apps/api_gateway apps/data_service apps/i18n_service apps/payment_service; do \
		echo "Formatting $$service..."; \
		cd $$service && npx prettier --write "**/*.{ts,tsx,js,jsx,json}" && cd ../..; \
	done
	@echo "Formatting Python code..."
	@cd apps/user-service && black . && cd ../..

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "*.pyc" -delete 2>/dev/null || true
	@find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true

# Build Docker images
docker-build:
	@echo "Building Docker images..."
	@for service in frontend auth_service api_gateway data_service i18n_service payment_service user-service; do \
		echo "Building $$service..."; \
		docker build -t zenith/$$service:latest ./apps/$$service; \
	done

# Push Docker images
docker-push:
	@echo "Pushing Docker images to registry..."
	@for service in frontend auth_service api_gateway data_service i18n_service payment_service user-service; do \
		echo "Pushing $$service..."; \
		docker tag zenith/$$service:latest ghcr.io/your-org/zenith-microservices-platinum/$$service:latest; \
		docker push ghcr.io/your-org/zenith-microservices-platinum/$$service:latest; \
	done

# Start services with docker-compose
docker-up:
	docker-compose up -d
	@echo "Services started!"

# Stop services
docker-down:
	docker-compose down

# View docker-compose logs
docker-logs:
	docker-compose logs -f

# Deploy to staging Kubernetes
k8s-deploy-staging:
	@echo "Deploying to staging..."
	kubectl apply -f infra/k8s/namespace.yaml
	kubectl apply -f infra/k8s/configmap.yaml -n zenith-staging
	kubectl apply -f infra/k8s/secrets.yaml -n zenith-staging
	kubectl apply -f infra/k8s/ -n zenith-staging
	@echo "Waiting for deployments to be ready..."
	kubectl wait --for=condition=available --timeout=300s deployment --all -n zenith-staging
	@echo "Staging deployment complete!"

# Deploy to production Kubernetes
k8s-deploy-production:
	@echo "Deploying to production..."
	@echo "WARNING: This will deploy to production. Continue? [y/N] " && read ans && [ $${ans:-N} = y ]
	kubectl apply -f infra/k8s/namespace.yaml
	kubectl apply -f infra/k8s/configmap.yaml -n zenith-production
	kubectl apply -f infra/k8s/secrets.yaml -n zenith-production
	kubectl apply -f infra/k8s/ -n zenith-production
	@echo "Waiting for deployments to be ready..."
	kubectl wait --for=condition=available --timeout=600s deployment --all -n zenith-production
	@echo "Production deployment complete!"

# Delete staging deployment
k8s-delete-staging:
	@echo "Deleting staging deployment..."
	kubectl delete namespace zenith-staging

# Delete production deployment
k8s-delete-production:
	@echo "WARNING: This will delete production deployment. Continue? [y/N] " && read ans && [ $${ans:-N} = y ]
	kubectl delete namespace zenith-production

# Show Kubernetes status
k8s-status:
	@echo "=== Staging Status ==="
	kubectl get pods -n zenith-staging
	kubectl get svc -n zenith-staging
	@echo ""
	@echo "=== Production Status ==="
	kubectl get pods -n zenith-production
	kubectl get svc -n zenith-production

# Show Kubernetes logs
k8s-logs:
	@echo "Select namespace: [staging/production]" && read ns; \
	echo "Select service:" && read svc; \
	kubectl logs -f deployment/$$svc -n zenith-$$ns

# Run full CI pipeline locally
ci: lint type-check test security-scan
	@echo "CI pipeline completed successfully!"

# Run security scans
security-scan:
	@echo "Running Trivy security scans..."
	@for service in frontend auth_service api_gateway data_service i18n_service payment_service user-service; do \
		echo "Scanning $$service..."; \
		docker build -t zenith/$$service:scan ./apps/$$service; \
		trivy image zenith/$$service:scan; \
	done

# Generate coverage report
coverage:
	@echo "Generating coverage reports..."
	@for service in apps/frontend apps/auth_service apps/api_gateway apps/data_service apps/i18n_service apps/payment_service; do \
		echo "Coverage for $$service..."; \
		cd $$service && npm test -- --coverage && cd ../..; \
	done
	@cd apps/user-service && pytest --cov=. --cov-report=html && cd ../..
	@echo "Coverage reports generated in each service's coverage/ directory"

# Database commands
db-migrate:
	@echo "Running database migrations..."
	docker-compose exec auth-service npm run migrate
	docker-compose exec data-service npm run migrate
	docker-compose exec payment-service npm run migrate
	docker-compose exec user-service flask db upgrade

db-seed:
	@echo "Seeding database..."
	docker-compose exec user-service flask seed

# Utility commands
shell-%:
	docker-compose exec $* sh

restart-%:
	docker-compose restart $*

ps:
	docker-compose ps

top:
	docker stats

health:
	@echo "Checking service health..."
	@curl -f http://localhost:3000/health || echo "Frontend: DOWN"
	@curl -f http://localhost:8080/health || echo "API Gateway: DOWN"
