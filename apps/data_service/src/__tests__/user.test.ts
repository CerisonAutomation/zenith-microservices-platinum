import request from 'supertest';
import { app } from '../index';
import { getPrismaClient } from '../db/prisma';

const prisma = getPrismaClient();

describe('User API', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-',
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          email: `test-${Date.now()}@example.com`,
          username: `testuser${Date.now()}`,
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toContain('test-');
      testUserId = response.body.id;
    });

    it('should reject duplicate email', async () => {
      const email = `test-duplicate-${Date.now()}@example.com`;

      await request(app)
        .post('/users')
        .send({
          email,
          username: `testuser1${Date.now()}`,
        });

      const response = await request(app)
        .post('/users')
        .send({
          email,
          username: `testuser2${Date.now()}`,
        });

      expect(response.status).toBe(409);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by id', async () => {
      const response = await request(app).get(`/users/${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testUserId);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/users/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user', async () => {
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .send({
          firstName: 'Updated',
          bio: 'Updated bio',
        });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('Updated');
      expect(response.body.bio).toBe('Updated bio');
    });
  });

  describe('GET /users', () => {
    it('should list users with pagination', async () => {
      const response = await request(app).get('/users?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user', async () => {
      const response = await request(app).delete(`/users/${testUserId}`);

      expect(response.status).toBe(204);

      // Verify user is deleted
      const getResponse = await request(app).get(`/users/${testUserId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
