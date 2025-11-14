import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db/database';
import { config } from '../config';

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  used_at: Date | null;
}

export class TokenService {
  async generateTokenPair(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, expiresAt]
    );

    return { accessToken, refreshToken };
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    const result = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1',
      [token]
    );

    return result.rows[0] || null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1',
      [token]
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
  }

  async findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const result = await query(
      'SELECT * FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    return result.rows[0] || null;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
      [token]
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    // Cleanup expired refresh tokens
    await query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
    );

    // Cleanup old password reset tokens
    await query(
      'DELETE FROM password_reset_tokens WHERE created_at < NOW() - INTERVAL \'7 days\''
    );
  }
}
