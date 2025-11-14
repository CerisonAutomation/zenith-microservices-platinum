import { query } from '../db/database';

export interface AuditLogInput {
  userId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export class AuditService {
  async log(input: AuditLogInput): Promise<void> {
    const { userId, action, ipAddress, userAgent, metadata = {} } = input;

    await query(
      `INSERT INTO audit_log (user_id, action, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId || null, action, ipAddress, userAgent, metadata]
    );
  }

  async getUserAuditLog(userId: string, limit = 100): Promise<any[]> {
    const result = await query(
      `SELECT * FROM audit_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  async getRecentActivity(hours = 24, limit = 1000): Promise<any[]> {
    const result = await query(
      `SELECT * FROM audit_log
       WHERE created_at > NOW() - INTERVAL '${hours} hours'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  async cleanupOldLogs(daysToKeep = 90): Promise<void> {
    await query(
      `DELETE FROM audit_log
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'`
    );
  }
}
