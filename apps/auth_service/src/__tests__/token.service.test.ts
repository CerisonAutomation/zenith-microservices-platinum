import { TokenService } from '../services/token.service';
import jwt from 'jsonwebtoken';
import { config } from '../config';

jest.mock('../db/database');

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
  });

  describe('generateTokenPair', () => {
    it('should generate valid JWT access token', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const { accessToken } = await tokenService.generateTokenPair(user);

      const decoded = jwt.verify(accessToken, config.jwtSecret) as any;

      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should generate unique refresh tokens', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const token1 = await tokenService.generateTokenPair(user);
      const token2 = await tokenService.generateTokenPair(user);

      expect(token1.refreshToken).not.toBe(token2.refreshToken);
    });

    it('should include user role in token', async () => {
      const adminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      };

      const { accessToken } = await tokenService.generateTokenPair(adminUser);
      const decoded = jwt.verify(accessToken, config.jwtSecret) as any;

      expect(decoded.role).toBe('admin');
    });
  });

  describe('Token expiration', () => {
    it('should set appropriate expiration time', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const { accessToken } = await tokenService.generateTokenPair(user);
      const decoded = jwt.verify(accessToken, config.jwtSecret) as any;

      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + (7 * 24 * 60 * 60); // 7 days

      // Allow 10 second variance for test execution time
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThan(expectedExpiry + 10);
    });
  });
});
