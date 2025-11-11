-- Zenith Database Initialization Script
-- This script sets up the initial database structure and roles

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS zenith;
\c zenith;

-- Create application user with secure password
CREATE USER IF NOT EXISTS zenith_app WITH ENCRYPTED PASSWORD 'zenith_secure_password_2025';
GRANT ALL PRIVILEGES ON DATABASE zenith TO zenith_app;

-- Create readonly user for analytics
CREATE USER IF NOT EXISTS zenith_readonly WITH ENCRYPTED PASSWORD 'readonly_secure_password_2025';
GRANT CONNECT ON DATABASE zenith TO zenith_readonly;

-- Create admin user for migrations
CREATE USER IF NOT EXISTS zenith_admin WITH ENCRYPTED PASSWORD 'admin_secure_password_2025';
GRANT ALL PRIVILEGES ON DATABASE zenith TO zenith_admin;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO zenith_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO zenith_readonly;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schema for different services
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS chat;
CREATE SCHEMA IF NOT EXISTS payment;
CREATE SCHEMA IF NOT EXISTS notification;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Grant schema permissions
GRANT USAGE ON SCHEMA auth TO zenith_app, zenith_readonly;
GRANT USAGE ON SCHEMA chat TO zenith_app, zenith_readonly;
GRANT USAGE ON SCHEMA payment TO zenith_app, zenith_readonly;
GRANT USAGE ON SCHEMA notification TO zenith_app, zenith_readonly;
GRANT USAGE ON SCHEMA storage TO zenith_app, zenith_readonly;
GRANT USAGE ON SCHEMA analytics TO zenith_app, zenith_readonly;

-- Create indexes for common queries (will be populated by migrations)
-- These are placeholder comments for future reference
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON auth.users(email);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON auth.users(created_at);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id ON chat.messages(conversation_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_id ON payment.transactions(user_id);