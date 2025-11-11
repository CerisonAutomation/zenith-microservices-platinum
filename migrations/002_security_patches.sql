-- Migration: 002_security_patches
-- Description: Add security enhancements for file uploads, webhooks, and messaging
-- Author: Security Team
-- Date: 2025-11-10
-- Database: PostgreSQL 14+

-- ============================================================================
-- FORWARD MIGRATION
-- ============================================================================

BEGIN;

-- Create file_uploads table for secure file management
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(500) NOT NULL UNIQUE,
    file_path VARCHAR(1000) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 104857600), -- Max 100MB
    mime_type VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA256 hash
    virus_scan_status VARCHAR(50) DEFAULT 'pending',
    virus_scan_result VARCHAR(100),
    upload_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_file_uploads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at DESC);
CREATE INDEX idx_file_uploads_file_hash ON file_uploads(file_hash);
CREATE INDEX idx_file_uploads_virus_scan ON file_uploads(virus_scan_status) WHERE virus_scan_status = 'pending';

-- Create webhook_events table for Stripe webhook verification
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL UNIQUE, -- Stripe event ID
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    signature VARCHAR(500) NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed) WHERE processed = false;
CREATE INDEX idx_webhook_events_received_at ON webhook_events(received_at DESC);
CREATE INDEX idx_webhook_events_retry ON webhook_events(retry_count) WHERE retry_count > 0;

-- Add unique constraint to prevent replay attacks (process event only once within 24 hours)
CREATE UNIQUE INDEX idx_webhook_events_event_id_recent 
ON webhook_events(event_id) 
WHERE received_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- Create message_participants table for proper message authorization
CREATE TABLE IF NOT EXISTS message_participants (
    message_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('sender', 'receiver')),
    can_read BOOLEAN DEFAULT true,
    can_delete BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (message_id, user_id),
    CONSTRAINT fk_message_participants_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_participants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_message_participants_user_id ON message_participants(user_id);
CREATE INDEX idx_message_participants_message_id ON message_participants(message_id);

-- Create rate_limit_tracking table for API rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    blocked BOOLEAN DEFAULT false,
    CONSTRAINT fk_rate_limit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_rate_limit_user_endpoint ON rate_limit_tracking(user_id, endpoint, window_end);
CREATE INDEX idx_rate_limit_window_end ON rate_limit_tracking(window_end) WHERE blocked = false;

-- Add comment for documentation
COMMENT ON TABLE file_uploads IS 'Secure file upload tracking with virus scanning and validation';
COMMENT ON TABLE webhook_events IS 'Stripe webhook event tracking with replay attack prevention';
COMMENT ON TABLE message_participants IS 'Message authorization and participant management';
COMMENT ON TABLE rate_limit_tracking IS 'API rate limiting and abuse prevention';

COMMIT;

-- ============================================================================
-- ROLLBACK MIGRATION
-- ============================================================================

-- To rollback, run the following:
/*
BEGIN;

DROP TABLE IF EXISTS rate_limit_tracking CASCADE;
DROP TABLE IF EXISTS message_participants CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;

COMMIT;
*/
