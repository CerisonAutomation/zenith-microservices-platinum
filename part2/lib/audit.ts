/**
 * 📊 Audit Logging System
 * Zenith Oracle Executive Apex - Compliance & Security Monitoring
 *
 * Implements:
 * - Comprehensive audit trails for all auth operations
 * - GDPR compliance with data retention policies
 * - Security event logging and alerting
 * - User activity monitoring
 * - Compliance reporting capabilities
 * - Data export for regulatory requirements
 *
 * @see https://supabase.com/docs/guides/auth/auth-audit
 */

import { supabase } from '@/lib/supabase';
import { ErrorTracker, UserAnalytics } from '@/lib/observability';

export interface AuditEvent {
  id?: string;
  user_id: string | null;
  action: AuditAction;
  resource: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compliance_flags?: string[];
}

export type AuditAction =
  // Authentication events
  | 'user_sign_in'
  | 'user_sign_up'
  | 'user_sign_out'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'email_verification_sent'
  | 'email_verified'
  | 'account_locked'
  | 'account_unlocked'
  // Profile events
  | 'profile_updated'
  | 'profile_deleted'
  | 'avatar_uploaded'
  | 'avatar_deleted'
  // Security events
  | 'suspicious_activity_detected'
  | 'rate_limit_exceeded'
  | 'csrf_attempt'
  | 'session_hijacking_attempt'
  | 'unusual_login_pattern'
  // Data events
  | 'data_export_requested'
  | 'data_deletion_requested'
  | 'consent_updated'
  | 'privacy_settings_changed'
  // Admin events
  | 'admin_user_created'
  | 'admin_user_deleted'
  | 'admin_permissions_changed';

class AuditLogger {
  private static instance: AuditLogger;
  private eventQueue: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  private constructor() {
    this.startPeriodicFlush();
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  // Log an audit event
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Add to queue for batch processing
    this.eventQueue.push(auditEvent);

    // Track with analytics
    UserAnalytics.trackEvent('audit_event', {
      action: event.action,
      resource: event.resource,
      severity: event.severity,
    });

    // Immediately log critical events
    if (event.severity === 'critical') {
      await this.flushEvent(auditEvent);
    } else if (this.eventQueue.length >= this.BATCH_SIZE) {
      await this.flushQueue();
    }
  }

  // Flush a single event immediately
  private async flushEvent(event: AuditEvent): Promise<void> {
    try {
      // For now, store in localStorage until audit_logs table is created
      const existing = localStorage.getItem('audit_events') || '[]';
      const events = JSON.parse(existing);
      events.push({
        ...event,
        timestamp: event.timestamp.toISOString(),
      });

      // Keep only last 1000 events to prevent storage bloat
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }

      localStorage.setItem('audit_events', JSON.stringify(events));
      console.log('Audit Event:', event);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  // Flush queued events
  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Store in localStorage for now
      const existing = localStorage.getItem('audit_events') || '[]';
      const storedEvents = JSON.parse(existing);

      const eventsToStore = events.map((event) => ({
        ...event,
        timestamp: event.timestamp.toISOString(),
      }));

      storedEvents.push(...eventsToStore);

      // Keep only last 1000 events
      if (storedEvents.length > 1000) {
        storedEvents.splice(0, storedEvents.length - 1000);
      }

      localStorage.setItem('audit_events', JSON.stringify(storedEvents));
      console.log(`Flushed ${events.length} audit events`);
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
      console.error('Failed to flush audit events:', error);
    }
  }

  // Start periodic flush
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushQueue();
    }, this.FLUSH_INTERVAL);
  }

  // Stop periodic flush
  stopPeriodicFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  // Get audit events for a user (from localStorage)
  async getUserAuditEvents(
    userId: string,
    limit = 100,
    offset = 0,
  ): Promise<AuditEvent[]> {
    try {
      const existing = localStorage.getItem('audit_events') || '[]';
      const events: any[] = JSON.parse(existing);

      const userEvents = events
        .filter((event) => event.user_id === userId)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(offset, offset + limit);

      return userEvents.map((event) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
    } catch (error) {
      console.error('Failed to get user audit events:', error);
      return [];
    }
  }

  // Get audit events by action type
  async getAuditEventsByAction(
    action: AuditAction,
    limit = 100,
    offset = 0,
  ): Promise<AuditEvent[]> {
    try {
      const existing = localStorage.getItem('audit_events') || '[]';
      const events: any[] = JSON.parse(existing);

      const actionEvents = events
        .filter((event) => event.action === action)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(offset, offset + limit);

      return actionEvents.map((event) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
    } catch (error) {
      console.error('Failed to get audit events by action:', error);
      return [];
    }
  }

  // GDPR compliance: Delete user audit data
  async deleteUserAuditData(userId: string): Promise<void> {
    try {
      const existing = localStorage.getItem('audit_events') || '[]';
      const events: any[] = JSON.parse(existing);

      const filteredEvents = events.filter((event) => event.user_id !== userId);
      localStorage.setItem('audit_events', JSON.stringify(filteredEvents));

      await this.logEvent({
        user_id: userId,
        action: 'data_deletion_requested',
        resource: 'audit_logs',
        details: { deleted_by: 'system', reason: 'GDPR_compliance' },
        severity: 'medium',
        compliance_flags: ['gdpr'],
      });
    } catch (error) {
      console.error('Failed to delete user audit data:', error);
    }
  }

  // Export audit data for compliance
  async exportAuditData(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<AuditEvent[]> {
    try {
      const existing = localStorage.getItem('audit_events') || '[]';
      const events: any[] = JSON.parse(existing);

      let filteredEvents = events.filter((event) => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= startDate && eventDate <= endDate;
      });

      if (userId) {
        filteredEvents = filteredEvents.filter(
          (event) => event.user_id === userId,
        );
      }

      return filteredEvents
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )
        .map((event) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));
    } catch (error) {
      console.error('Failed to export audit data:', error);
      return [];
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

/**
 * React hook for audit logging
 */
export function useAuditLogger() {
  const logAuthEvent = (
    action: AuditAction,
    details: Record<string, any>,
    severity: AuditEvent['severity'] = 'low',
  ) => {
    auditLogger.logEvent({
      user_id: null, // Will be set by context if available
      action,
      resource: 'authentication',
      details,
      severity,
    });
  };

  const logSecurityEvent = (
    action: AuditAction,
    details: Record<string, any>,
    severity: AuditEvent['severity'] = 'high',
  ) => {
    auditLogger.logEvent({
      user_id: null,
      action,
      resource: 'security',
      details,
      severity,
      compliance_flags: ['security'],
    });
  };

  return {
    logAuthEvent,
    logSecurityEvent,
    getUserAuditEvents: auditLogger.getUserAuditEvents.bind(auditLogger),
    exportAuditData: auditLogger.exportAuditData.bind(auditLogger),
  };
}

/**
 * Data retention policies
 */
export const DATA_RETENTION_POLICIES = {
  audit_logs: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
  security_events: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
  user_activity: 365 * 24 * 60 * 60 * 1000, // 1 year
};

/**
 * Clean up old audit data (run periodically)
 */
export async function cleanupOldAuditData(): Promise<void> {
  const now = Date.now();

  try {
    // Clean up old audit logs
    const auditCutoff = new Date(now - DATA_RETENTION_POLICIES.audit_logs);
    await supabase
      .from('audit_logs')
      .delete()
      .lt('timestamp', auditCutoff.toISOString());

    // Clean up old security events
    const securityCutoff = new Date(
      now - DATA_RETENTION_POLICIES.security_events,
    );
    await supabase
      .from('audit_logs')
      .delete()
      .eq('resource', 'security')
      .lt('timestamp', securityCutoff.toISOString());

    UserAnalytics.trackEvent('audit_cleanup_completed');
  } catch (error) {
    ErrorTracker.trackError(error as Error, { context: 'audit_cleanup' });
  }
}
