#!/bin/bash

# pH7Builder Deployment Script for Zenith Platform
# This script starts pH7Builder with MySQL database

set -e

echo "🚀 Starting pH7Builder Social Dating CMS for Zenith Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
mkdir -p data/mysql
mkdir -p ph7builder/data/uploads

# Start only MySQL and pH7Builder services
echo "📦 Starting MySQL and pH7Builder services..."
docker-compose -f docker-compose.full.yml up -d mysql ph7builder

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if MySQL is ready
echo "🔍 Checking MySQL connection..."
if docker-compose -f docker-compose.full.yml exec -T mysql mysqladmin ping -h localhost -u ph7user -pzenith123! --silent; then
    echo "✅ MySQL is ready!"
else
    echo "❌ MySQL connection failed. Checking logs..."
    docker-compose -f docker-compose.full.yml logs mysql
    exit 1
fi

# Check if pH7Builder is responding
echo "🔍 Checking pH7Builder..."
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ pH7Builder is responding!"
    echo ""
    echo "🎉 pH7Builder Social Dating CMS is now running!"
    echo ""
    echo "📋 Access URLs:"
    echo "   • pH7Builder: http://localhost:8080"
    echo "   • Admin Panel: http://localhost:8080/admin123/"
    echo "   • Through Nginx: http://localhost/dating/"
    echo ""
    echo "🔐 Default Admin Credentials (change these!):"
    echo "   • Username: admin"
    echo "   • Password: admin123"
    echo ""
    echo "📊 Database Info:"
    echo "   • Host: mysql"
    echo "   • Database: ph7builder"
    echo "   • User: ph7user"
    echo "   • Password: zenith123!"
    echo ""
    echo "🛑 To stop: docker-compose -f docker-compose.full.yml down"
else
    echo "❌ pH7Builder is not responding. Checking logs..."
    docker-compose -f docker-compose.full.yml logs ph7builder
    exit 1
fi