import request from 'supertest';
import { app } from '../index';
import { closePool } from '../db/database';

// Mock database to avoid real connections in tests
jest.mock('../db/database', () => ({
  query: jest.fn(),
  getPool: jest.fn(() => ({
    connect: jest.fn(() => ({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    })),
  })),
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  closePool: jest.fn(),
}));

describe('Auth Controller', () => {
  afterAll(async () => {
    await closePool();
  });

  describe('POST /auth/register', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation failed');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Password must be at least 8 characters');
    });

    it('should require uppercase letter in password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'lowercase123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('uppercase');
    });

    it('should require number in password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'NoNumbers',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('number');
    });
  });

  describe('POST /auth/login', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation failed');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should require refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation failed');
    });
  });

  describe('POST /auth/password-reset/request', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/password-reset/request')
        .send({
          email: 'invalid',
        });

      expect(response.status).toBe(400);
    });

    it('should not reveal if email exists', async () => {
      const response = await request(app)
        .post('/auth/password-reset/request')
        .send({
          email: 'nonexistent@example.com',
        });

      // Should always return success to prevent email enumeration
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If email exists');
    });
  });

  describe('GET /auth/verify', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/auth/verify');

      expect(response.status).toBe(401);
    });

    it('should reject invalid bearer token format', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
    });

    it('should reject invalid JWT', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
