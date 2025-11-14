import request from 'supertest';
import express from 'express';
import checkoutRoutes from '../routes/checkout';
import { stripe } from '../utils/stripe/config';
import * as supabaseAdmin from '../utils/supabase/admin';

// Mock dependencies
jest.mock('../utils/stripe/config');
jest.mock('../utils/supabase/admin');

const app = express();
app.use(express.json());
app.use('/checkout', checkoutRoutes);

describe('Checkout Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /checkout/create-session', () => {
    it('should create a checkout session successfully', async () => {
      const mockCustomerId = 'cus_test123';
      const mockSessionId = 'cs_test_123';
      const mockSessionUrl = 'https://checkout.stripe.com/pay/cs_test_123';

      // Mock createOrRetrieveCustomer
      (supabaseAdmin.createOrRetrieveCustomer as jest.Mock).mockResolvedValue(
        mockCustomerId
      );

      // Mock Stripe checkout session creation
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        id: mockSessionId,
        url: mockSessionUrl,
      });

      const response = await request(app)
        .post('/checkout/create-session')
        .send({
          priceId: 'price_test123',
          userId: 'user_123',
          email: 'test@example.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('sessionId', mockSessionId);
      expect(response.body).toHaveProperty('url', mockSessionUrl);
      expect(supabaseAdmin.createOrRetrieveCustomer).toHaveBeenCalledWith({
        email: 'test@example.com',
        userId: 'user_123',
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/checkout/create-session')
        .send({
          priceId: 'price_test123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Missing required fields');
    });

    it('should handle Stripe errors', async () => {
      (supabaseAdmin.createOrRetrieveCustomer as jest.Mock).mockResolvedValue(
        'cus_test123'
      );

      (stripe.checkout.sessions.create as jest.Mock).mockRejectedValue(
        new Error('Stripe API error')
      );

      const response = await request(app)
        .post('/checkout/create-session')
        .send({
          priceId: 'price_test123',
          userId: 'user_123',
          email: 'test@example.com',
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to create checkout session');
    });

    it('should include custom metadata in the session', async () => {
      const mockCustomerId = 'cus_test123';
      const metadata = { plan: 'premium', source: 'webapp' };

      (supabaseAdmin.createOrRetrieveCustomer as jest.Mock).mockResolvedValue(
        mockCustomerId
      );

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });

      await request(app)
        .post('/checkout/create-session')
        .send({
          priceId: 'price_test123',
          userId: 'user_123',
          email: 'test@example.com',
          metadata,
        })
        .expect(200);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining(metadata),
        })
      );
    });
  });

  describe('POST /checkout/success', () => {
    it('should handle successful checkout completion', async () => {
      const mockSession = {
        id: 'cs_test_123',
        subscription: 'sub_test_123',
        customer: 'cus_test_123',
        payment_status: 'paid',
      };

      (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue(
        mockSession
      );

      const response = await request(app)
        .post('/checkout/success')
        .send({
          sessionId: 'cs_test_123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('subscriptionId', 'sub_test_123');
      expect(response.body).toHaveProperty('customerId', 'cus_test_123');
      expect(response.body).toHaveProperty('status', 'paid');
    });

    it('should return 400 when sessionId is missing', async () => {
      const response = await request(app)
        .post('/checkout/success')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing sessionId');
    });

    it('should return 404 when session is not found', async () => {
      (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/checkout/success')
        .send({
          sessionId: 'cs_test_123',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Session not found');
    });

    it('should handle Stripe errors during session retrieval', async () => {
      (stripe.checkout.sessions.retrieve as jest.Mock).mockRejectedValue(
        new Error('Session not found')
      );

      const response = await request(app)
        .post('/checkout/success')
        .send({
          sessionId: 'cs_test_invalid',
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /checkout/session/:sessionId', () => {
    it('should retrieve a checkout session', async () => {
      const mockSession = {
        id: 'cs_test_123',
        status: 'complete',
        payment_status: 'paid',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        amount_total: 999,
        currency: 'usd',
      };

      (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue(
        mockSession
      );

      const response = await request(app)
        .get('/checkout/session/cs_test_123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'cs_test_123');
      expect(response.body).toHaveProperty('status', 'complete');
      expect(response.body).toHaveProperty('payment_status', 'paid');
      expect(response.body).toHaveProperty('amount_total', 999);
    });

    it('should handle errors when retrieving session', async () => {
      (stripe.checkout.sessions.retrieve as jest.Mock).mockRejectedValue(
        new Error('Session not found')
      );

      const response = await request(app)
        .get('/checkout/session/cs_test_invalid')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
