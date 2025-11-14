import { query } from '../db/database';
import { config } from '../config';

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  role: string;
  metadata: any;
  is_email_verified: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string | null;
  metadata?: any;
}

export interface OAuthAccountInput {
  userId: string;
  provider: string;
  providerUserId: string;
  accessToken?: string;
  refreshToken?: string;
}

export class UserService {
  async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const { email, passwordHash, metadata = {} } = input;

    const result = await query(
      `INSERT INTO users (email, password_hash, metadata)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email, passwordHash, metadata]
    );

    return result.rows[0];
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );
  }

  async incrementFailedAttempts(userId: string): Promise<void> {
    await query(
      'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1',
      [userId]
    );
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await query(
      'UPDATE users SET failed_login_attempts = 0 WHERE id = $1',
      [userId]
    );
  }

  async lockAccount(userId: string, durationMs: number): Promise<void> {
    const lockedUntil = new Date(Date.now() + durationMs);

    await query(
      'UPDATE users SET is_locked = true, locked_until = $1 WHERE id = $2',
      [lockedUntil, userId]
    );
  }

  async unlockAccount(userId: string): Promise<void> {
    await query(
      'UPDATE users SET is_locked = false, locked_until = NULL, failed_login_attempts = 0 WHERE id = $1',
      [userId]
    );
  }

  async upsertOAuthAccount(input: OAuthAccountInput): Promise<void> {
    const { userId, provider, providerUserId, accessToken, refreshToken } = input;

    await query(
      `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, refresh_token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider, provider_user_id)
       DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         updated_at = NOW()`,
      [userId, provider, providerUserId, accessToken, refreshToken]
    );
  }
}
