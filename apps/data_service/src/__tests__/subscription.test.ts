import request from 'supertest';
import { app } from '../index';
import { getPrismaClient } from '../db/prisma';

const prisma = getPrismaClient();

describe('Subscription API', () => {
  let testUserId: string;
  let testSubscriptionId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-sub-${Date.now()}@example.com`,
        username: `testuser-sub-${Date.now()}`,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.subscription.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('POST /subscriptions', () => {
    it('should create a new subscription', async () => {
      const response = await request(app)
        .post('/subscriptions')
        .send({
          userId: testUserId,
          plan: 'premium',
          price: 9.99,
          currency: 'USD',
          billingCycle: 'monthly',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.plan).toBe('premium');
      expect(response.body.status).toBe('active');
      testSubscriptionId = response.body.id;
    });

    it('should reject invalid plan', async () => {
      const response = await request(app)
        .post('/subscriptions')
        .send({
          userId: testUserId,
          plan: 'invalid_plan',
          price: 9.99,
          billingCycle: 'monthly',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /subscriptions/user/:userId', () => {
    it('should get subscriptions by user id', async () => {
      const response = await request(app).get(`/subscriptions/user/${testUserId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /subscriptions/:id', () => {
    it('should update subscription', async () => {
      const response = await request(app)
        .put(`/subscriptions/${testSubscriptionId}`)
        .send({
          autoRenew: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.autoRenew).toBe(false);
    });
  });

  describe('POST /subscriptions/:id/cancel', () => {
    it('should cancel subscription', async () => {
      const response = await request(app)
        .post(`/subscriptions/${testSubscriptionId}/cancel`)
        .send({
          cancellationReason: 'Test cancellation',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('cancelled');
      expect(response.body.cancellationReason).toBe('Test cancellation');
    });
  });
});
