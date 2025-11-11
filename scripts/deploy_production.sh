#!/bin/bash

# Zenith Platform Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="zenith"
ENVIRONMENT="production"
DOCKER_REGISTRY="ghcr.io"
DOCKER_REPO="${DOCKER_REGISTRY}/your-username/${PROJECT_NAME}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."

    # Check if Docker is installed and running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed."
        exit 1
    fi

    # Check if .env.prod file exists
    if [ ! -f "config/secrets/.env.prod" ]; then
        log_error "Production secrets file not found: config/secrets/.env.prod"
        log_info "Please copy config/secrets/.env.prod.template to config/secrets/.env.prod and fill in your secrets."
        exit 1
    fi

    log_success "All dependencies are available."
}

load_secrets() {
    log_info "Loading production secrets..."
    if [ -f "config/secrets/.env.prod" ]; then
        export $(grep -v '^#' config/secrets/.env.prod | xargs)
        log_success "Production secrets loaded."
    else
        log_error "Production secrets file not found."
        exit 1
    fi
}

build_images() {
    log_info "Building production Docker images..."

    # Build backend image
    log_info "Building backend image..."
    docker build -f src/backend/Dockerfile.prod -t ${DOCKER_REPO}/backend:latest src/backend

    # Build frontend image
    log_info "Building frontend image..."
    docker build -f src/frontend/Dockerfile.prod -t ${DOCKER_REPO}/frontend:latest src/frontend

    log_success "Docker images built successfully."
}

push_images() {
    log_info "Pushing images to registry..."

    # Login to registry (uncomment and configure as needed)
    # echo $DOCKER_PASSWORD | docker login $DOCKER_REGISTRY -u $DOCKER_USERNAME --password-stdin

    # Push images
    docker push ${DOCKER_REPO}/backend:latest
    docker push ${DOCKER_REPO}/frontend:latest

    log_success "Images pushed to registry."
}

deploy_services() {
    log_info "Deploying services with Docker Compose..."

    # Create environment file for docker-compose
    cat > .env.prod << EOF
COMPOSE_PROJECT_NAME=${PROJECT_NAME}
DOCKER_REGISTRY=${DOCKER_REGISTRY}
DOCKER_REPO=${DOCKER_REPO}
DB_PASSWORD=${DB_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
SECRET_KEY=${SECRET_KEY}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
EOF

    # Deploy with production compose file
    docker-compose -f infra/docker/docker-compose.prod.yml --env-file .env.prod up -d

    log_success "Services deployed successfully."
}

run_health_checks() {
    log_info "Running health checks..."

    # Wait for services to be ready
    sleep 30

    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Backend health check passed."
    else
        log_error "Backend health check failed."
        exit 1
    fi

    # Check frontend health
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Frontend health check passed."
    else
        log_error "Frontend health check failed."
        exit 1
    fi

    log_success "All health checks passed."
}

run_database_migrations() {
    log_info "Running database migrations..."

    # Run migrations using the backend container
    docker-compose -f infra/docker/docker-compose.prod.yml --env-file .env.prod exec -T backend python manage.py migrate

    log_success "Database migrations completed."
}

backup_current_deployment() {
    log_info "Creating backup of current deployment..."

    # This is a placeholder - implement actual backup logic
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    mkdir -p backups/${TIMESTAMP}

    # Backup database
    docker-compose -f infra/docker/docker-compose.prod.yml --env-file .env.prod exec -T postgres pg_dump -U zenith_prod_user zenith_prod > backups/${TIMESTAMP}/database.sql

    # Backup volumes (if needed)
    # docker run --rm -v zenith_postgres_data:/data -v $(pwd)/backups/${TIMESTAMP}:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .

    log_success "Backup created: backups/${TIMESTAMP}"
}

rollback_deployment() {
    log_error "Deployment failed. Rolling back..."

    # Stop new deployment
    docker-compose -f infra/docker/docker-compose.prod.yml --env-file .env.prod down

    # Restore from backup (if implemented)
    # ./scripts/restore_backup.sh backups/${LATEST_BACKUP}

    log_info "Rollback completed."
}

cleanup() {
    log_info "Cleaning up temporary files..."

    # Remove temporary env file
    rm -f .env.prod

    # Remove old images
    docker image prune -f

    log_success "Cleanup completed."
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --check-only    Only run dependency checks"
    echo "  --build-only    Only build Docker images"
    echo "  --deploy-only   Only deploy services"
    echo "  --rollback      Rollback to previous deployment"
    echo "  --help          Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  ENVIRONMENT     Deployment environment (default: production)"
    echo "  SKIP_BACKUP     Skip backup creation (default: false)"
}

# Main deployment process
main() {
    local check_only=false
    local build_only=false
    local deploy_only=false
    local rollback=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check-only)
                check_only=true
                shift
                ;;
            --build-only)
                build_only=true
                shift
                ;;
            --deploy-only)
                deploy_only=true
                shift
                ;;
            --rollback)
                rollback=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    log_info "Starting Zenith Platform production deployment..."

    # Run dependency checks
    check_dependencies

    if [ "$check_only" = true ]; then
        log_success "Dependency check completed."
        exit 0
    fi

    # Load secrets
    load_secrets

    if [ "$rollback" = true ]; then
        rollback_deployment
        exit 0
    fi

    # Create backup unless skipped
    if [ "$SKIP_BACKUP" != "true" ] && [ "$deploy_only" != true ]; then
        backup_current_deployment
    fi

    # Build images unless deploy-only
    if [ "$deploy_only" != true ]; then
        build_images
    fi

    if [ "$build_only" = true ]; then
        log_success "Build completed."
        exit 0
    fi

    # Deploy services
    deploy_services

    # Run database migrations
    run_database_migrations

    # Run health checks
    run_health_checks

    # Cleanup
    cleanup

    log_success "Production deployment completed successfully!"
    log_info "Your application is now running at:"
    log_info "  Frontend: https://yourdomain.com"
    log_info "  API: https://api.yourdomain.com"
    log_info "  Monitoring: http://localhost:3001 (Grafana)"
    log_info "  Logs: http://localhost:5601 (Kibana)"
}

# Run main function with all arguments
main "$@"