import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { TokenService } from '../services/token.service';
import { AuditService } from '../services/audit.service';
import { config } from '../config';
import { AppError } from '../utils/errors';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;
  private tokenService: TokenService;
  private auditService: AuditService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
    this.tokenService = new TokenService();
    this.auditService = new AuditService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, metadata } = req.body;

      // Check if user exists
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        throw new AppError('Email already registered', 409);
      }

      // Validate password strength
      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

      // Create user
      const user = await this.userService.create({
        email,
        passwordHash,
        metadata: metadata || {},
      });

      // Generate tokens
      const { accessToken, refreshToken } = await this.tokenService.generateTokenPair(user);

      // Audit log
      await this.auditService.log({
        userId: user.id,
        action: 'REGISTER',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          metadata: user.metadata,
        },
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await this.userService.findByEmail(email);
      if (!user || !user.password_hash) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if account is locked
      if (user.is_locked) {
        if (user.locked_until && new Date() < user.locked_until) {
          const remainingMs = user.locked_until.getTime() - Date.now();
          const remainingMinutes = Math.ceil(remainingMs / 60000);
          throw new AppError(
            `Account locked. Try again in ${remainingMinutes} minutes`,
            423
          );
        } else {
          // Unlock account if lockout period expired
          await this.userService.unlockAccount(user.id);
          user.is_locked = false;
          user.failed_login_attempts = 0;
        }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        // Increment failed attempts
        await this.userService.incrementFailedAttempts(user.id);

        // Check if should lock account
        if (user.failed_login_attempts + 1 >= config.maxLoginAttempts) {
          await this.userService.lockAccount(user.id, config.lockoutDurationMs);
          throw new AppError('Too many failed attempts. Account locked.', 423);
        }

        throw new AppError('Invalid credentials', 401);
      }

      // Reset failed attempts on successful login
      if (user.failed_login_attempts > 0) {
        await this.userService.resetFailedAttempts(user.id);
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.tokenService.generateTokenPair(user);

      // Audit log
      await this.auditService.log({
        userId: user.id,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          metadata: user.metadata,
        },
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // Revoke all refresh tokens for user
      await this.tokenService.revokeAllUserTokens(userId);

      // Audit log
      await this.auditService.log({
        userId,
        action: 'LOGOUT',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const storedToken = await this.tokenService.findRefreshToken(refreshToken);

      if (!storedToken || storedToken.revoked_at) {
        throw new AppError('Invalid refresh token', 401);
      }

      if (new Date() > storedToken.expires_at) {
        throw new AppError('Refresh token expired', 401);
      }

      // Get user
      const user = await this.userService.findById(storedToken.user_id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate new token pair
      const { accessToken, refreshToken: newRefreshToken } =
        await this.tokenService.generateTokenPair(user);

      // Revoke old refresh token
      await this.tokenService.revokeRefreshToken(refreshToken);

      res.json({
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 7 * 24 * 60 * 60,
      });
    } catch (error) {
      next(error);
    }
  };

  verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Token already verified by middleware
      res.json({
        valid: true,
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await this.userService.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        metadata: user.metadata,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at,
      });
    } catch (error) {
      next(error);
    }
  };

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const user = await this.userService.findByEmail(email);

      if (!user) {
        // Don't reveal if email exists
        res.json({ message: 'If email exists, reset link will be sent' });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await this.tokenService.createPasswordResetToken(user.id, resetToken, expiresAt);

      // TODO: Send email with reset link
      // For now, log the token (in production, send email)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      // Audit log
      await this.auditService.log({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ message: 'If email exists, reset link will be sent' });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;

      // Validate password strength
      if (newPassword.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }

      // Find reset token
      const resetTokenRecord = await this.tokenService.findPasswordResetToken(token);

      if (!resetTokenRecord || resetTokenRecord.used_at) {
        throw new AppError('Invalid or used reset token', 400);
      }

      if (new Date() > resetTokenRecord.expires_at) {
        throw new AppError('Reset token expired', 400);
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

      // Update password
      await this.userService.updatePassword(resetTokenRecord.user_id, passwordHash);

      // Mark token as used
      await this.tokenService.markPasswordResetTokenUsed(token);

      // Revoke all refresh tokens
      await this.tokenService.revokeAllUserTokens(resetTokenRecord.user_id);

      // Audit log
      await this.auditService.log({
        userId: resetTokenRecord.user_id,
        action: 'PASSWORD_RESET_COMPLETED',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  };

  handleOAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const oauthUser = req.user as any;

      if (!oauthUser) {
        throw new AppError('OAuth authentication failed', 401);
      }

      // Find or create user
      let user = await this.userService.findByEmail(oauthUser.email);

      if (!user) {
        // Create new user
        user = await this.userService.create({
          email: oauthUser.email,
          passwordHash: null, // OAuth users don't have passwords
          metadata: {
            provider: oauthUser.provider,
            displayName: oauthUser.displayName,
            profilePicture: oauthUser.profilePicture,
          },
        });
      }

      // Store OAuth account info
      await this.userService.upsertOAuthAccount({
        userId: user.id,
        provider: oauthUser.provider,
        providerUserId: oauthUser.id,
        accessToken: oauthUser.accessToken,
        refreshToken: oauthUser.refreshToken,
      });

      // Generate tokens
      const { accessToken, refreshToken } = await this.tokenService.generateTokenPair(user);

      // Audit log
      await this.auditService.log({
        userId: user.id,
        action: `OAUTH_LOGIN_${oauthUser.provider.toUpperCase()}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  };
}
