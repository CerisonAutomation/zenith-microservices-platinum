import request from 'supertest';
import express from 'express';
import subscriptionRoutes from '../routes/subscriptions';
import { stripe } from '../utils/stripe/config';
import * as supabaseAdmin from '../utils/supabase/admin';

// Mock dependencies
jest.mock('../utils/stripe/config');
jest.mock('../utils/supabase/admin');

const app = express();
app.use(express.json());
app.use('/subscription', subscriptionRoutes);

describe('Subscription Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /subscription/create', () => {
    it('should create a subscription successfully', async () => {
      const mockCustomerId = 'cus_test123';
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
        customer: 'cus_test123',
        current_period_end: 1234567890,
        cancel_at_period_end: false,
        items: {
          data: [{ price: { id: 'price_test123' } }],
        },
      };

      (supabaseAdmin.createOrRetrieveCustomer as jest.Mock).mockResolvedValue(
        mockCustomerId
      );
      (stripe.subscriptions.create as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const response = await request(app)
        .post('/subscription/create')
        .send({
          priceId: 'price_test123',
          userId: 'user_123',
          email: 'test@example.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', 'sub_test123');
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('customerId', 'cus_test123');
    });

    it('should attach payment method when provided', async () => {
      const mockCustomerId = 'cus_test123';
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
        customer: 'cus_test123',
        current_period_end: 1234567890,
        cancel_at_period_end: false,
        items: {
          data: [{ price: { id: 'price_test123' } }],
        },
      };

      (supabaseAdmin.createOrRetrieveCustomer as jest.Mock).mockResolvedValue(
        mockCustomerId
      );
      (stripe.paymentMethods.attach as jest.Mock).mockResolvedValue({});
      (stripe.customers.update as jest.Mock).mockResolvedValue({});
      (stripe.subscriptions.create as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      await request(app)
        .post('/subscription/create')
        .send({
          priceId: 'price_test123',
          userId: 'user_123',
          email: 'test@example.com',
          paymentMethodId: 'pm_test123',
        })
        .expect(200);

      expect(stripe.paymentMethods.attach).toHaveBeenCalledWith('pm_test123', {
        customer: mockCustomerId,
      });
      expect(stripe.customers.update).toHaveBeenCalledWith(mockCustomerId, {
        invoice_settings: {
          default_payment_method: 'pm_test123',
        },
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/subscription/create')
        .send({
          priceId: 'price_test123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('PUT /subscription/update/:subscriptionId', () => {
    it('should update subscription price', async () => {
      const currentSub = {
        items: {
          data: [{ id: 'si_test123' }],
        },
      };

      const updatedSub = {
        id: 'sub_test123',
        status: 'active',
        customer: 'cus_test123',
        current_period_end: 1234567890,
        cancel_at_period_end: false,
        items: {
          data: [{ price: { id: 'price_test456' } }],
        },
      };

      (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(currentSub);
      (stripe.subscriptions.update as jest.Mock).mockResolvedValue(updatedSub);

      const response = await request(app)
        .put('/subscription/update/sub_test123')
        .send({
          priceId: 'price_test456',
        })
        .expect(200);

      expect(response.body).toHaveProperty('priceId', 'price_test456');
      expect(stripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          items: [{ id: 'si_test123', price: 'price_test456' }],
        })
      );
    });

    it('should update cancel_at_period_end flag', async () => {
      const updatedSub = {
        id: 'sub_test123',
        status: 'active',
        customer: 'cus_test123',
        current_period_end: 1234567890,
        cancel_at_period_end: true,
        items: {
          data: [{ price: { id: 'price_test123' } }],
        },
      };

      (stripe.subscriptions.update as jest.Mock).mockResolvedValue(updatedSub);

      const response = await request(app)
        .put('/subscription/update/sub_test123')
        .send({
          cancel_at_period_end: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('cancelAtPeriodEnd', true);
    });
  });

  describe('DELETE /subscription/cancel/:subscriptionId', () => {
    it('should cancel subscription at period end by default', async () => {
      const canceledSub = {
        id: 'sub_test123',
        status: 'active',
        customer: 'cus_test123',
        current_period_end: 1234567890,
        cancel_at_period_end: true,
        items: {
          data: [{ price: { id: 'price_test123' } }],
        },
      };

      (stripe.subscriptions.update as jest.Mock).mockResolvedValue(canceledSub);

      const response = await request(app)
        .delete('/subscription/cancel/sub_test123')
        .expect(200);

      expect(response.body).toHaveProperty('cancelAtPeriodEnd', true);
      expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: true,
      });
    });

    it('should cancel subscription immediately when requested', async () => {
      const canceledSub = {
        id: 'sub_test123',
        status: 'canceled',
        customer: 'cus_test123',
        current_period_end: 1234567890,
        cancel_at_period_end: false,
        items: {
          data: [{ price: { id: 'price_test123' } }],
        },
      };

      (stripe.subscriptions.cancel as jest.Mock).mockResolvedValue(canceledSub);

      const response = await request(app)
        .delete('/subscription/cancel/sub_test123?immediate=true')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'canceled');
      expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_test123');
    });
  });

  describe('GET /subscription/:subscriptionId', () => {
    it('should retrieve subscription details', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
        customer: 'cus_test123',
        current_period_end: 1234567890,
        cancel_at_period_end: false,
        items: {
          data: [{ price: { id: 'price_test123' } }],
        },
      };

      (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const response = await request(app)
        .get('/subscription/sub_test123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'sub_test123');
      expect(response.body).toHaveProperty('status', 'active');
    });
  });

  describe('GET /subscription/user/:userId', () => {
    it('should retrieve all subscriptions for a user', async () => {
      const mockSubscriptions = [
        {
          id: 'sub_test123',
          user_id: 'user_123',
          status: 'active',
          plan_name: 'Premium',
        },
      ];

      (supabaseAdmin.supabaseAdmin as any) = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockSubscriptions,
                error: null,
              }),
            }),
          }),
        }),
      };

      const response = await request(app)
        .get('/subscription/user/user_123')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /subscription/reactivate/:subscriptionId', () => {
    it('should reactivate a canceled subscription', async () => {
      const reactivatedSub = {
        id: 'sub_test123',
        status: 'active',
        customer: 'cus_test123',
        current_period_end: 1234567890,
        cancel_at_period_end: false,
        items: {
          data: [{ price: { id: 'price_test123' } }],
        },
      };

      (stripe.subscriptions.update as jest.Mock).mockResolvedValue(
        reactivatedSub
      );

      const response = await request(app)
        .post('/subscription/reactivate/sub_test123')
        .expect(200);

      expect(response.body).toHaveProperty('cancelAtPeriodEnd', false);
      expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: false,
      });
    });
  });
});
