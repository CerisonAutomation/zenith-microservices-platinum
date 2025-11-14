import request from 'supertest';
import express from 'express';
import paymentMethodRoutes from '../routes/payment-methods';
import { stripe } from '../utils/stripe/config';
import * as supabaseAdmin from '../utils/supabase/admin';

// Mock dependencies
jest.mock('../utils/stripe/config');
jest.mock('../utils/supabase/admin');

const app = express();
app.use(express.json());
app.use('/methods', paymentMethodRoutes);

describe('Payment Methods Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /methods/:customerId', () => {
    it('should retrieve all payment methods for a customer', async () => {
      const mockPaymentMethods = {
        data: [
          {
            id: 'pm_test123',
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025,
            },
          },
          {
            id: 'pm_test456',
            type: 'card',
            card: {
              brand: 'mastercard',
              last4: '5555',
              exp_month: 6,
              exp_year: 2026,
            },
          },
        ],
      };

      (stripe.paymentMethods.list as jest.Mock).mockResolvedValue(
        mockPaymentMethods
      );

      const response = await request(app)
        .get('/methods/cus_test123')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id', 'pm_test123');
      expect(response.body[0].card).toHaveProperty('last4', '4242');
    });

    it('should return 400 when customerId is missing', async () => {
      const response = await request(app).get('/methods/').expect(404);
    });
  });

  describe('GET /methods/user/:userId', () => {
    it('should retrieve payment methods for a user', async () => {
      const mockCustomer = {
        stripe_customer_id: 'cus_test123',
      };

      const mockPaymentMethods = {
        data: [
          {
            id: 'pm_test123',
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025,
            },
          },
        ],
      };

      (supabaseAdmin.supabaseAdmin as any) = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockCustomer,
                error: null,
              }),
            }),
          }),
        }),
      };

      (stripe.paymentMethods.list as jest.Mock).mockResolvedValue(
        mockPaymentMethods
      );

      const response = await request(app)
        .get('/methods/user/user_123')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('should return 404 when customer not found', async () => {
      (supabaseAdmin.supabaseAdmin as any) = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Not found'),
              }),
            }),
          }),
        }),
      };

      const response = await request(app)
        .get('/methods/user/user_invalid')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Customer not found');
    });
  });

  describe('POST /methods/attach', () => {
    it('should attach a payment method to a customer', async () => {
      const mockPaymentMethod = {
        id: 'pm_test123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
      };

      (stripe.paymentMethods.attach as jest.Mock).mockResolvedValue(
        mockPaymentMethod
      );

      const response = await request(app)
        .post('/methods/attach')
        .send({
          paymentMethodId: 'pm_test123',
          customerId: 'cus_test123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', 'pm_test123');
      expect(response.body).toHaveProperty('type', 'card');
      expect(stripe.paymentMethods.attach).toHaveBeenCalledWith('pm_test123', {
        customer: 'cus_test123',
      });
    });

    it('should set as default when requested', async () => {
      const mockPaymentMethod = {
        id: 'pm_test123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
      };

      (stripe.paymentMethods.attach as jest.Mock).mockResolvedValue(
        mockPaymentMethod
      );
      (stripe.customers.update as jest.Mock).mockResolvedValue({});

      await request(app)
        .post('/methods/attach')
        .send({
          paymentMethodId: 'pm_test123',
          customerId: 'cus_test123',
          setAsDefault: true,
        })
        .expect(200);

      expect(stripe.customers.update).toHaveBeenCalledWith('cus_test123', {
        invoice_settings: {
          default_payment_method: 'pm_test123',
        },
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/methods/attach')
        .send({
          paymentMethodId: 'pm_test123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('DELETE /methods/:paymentMethodId', () => {
    it('should detach a payment method', async () => {
      const mockPaymentMethod = {
        id: 'pm_test123',
      };

      (stripe.paymentMethods.detach as jest.Mock).mockResolvedValue(
        mockPaymentMethod
      );

      const response = await request(app)
        .delete('/methods/pm_test123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('detached', true);
      expect(stripe.paymentMethods.detach).toHaveBeenCalledWith('pm_test123');
    });
  });

  describe('PUT /methods/:paymentMethodId/default', () => {
    it('should set a payment method as default', async () => {
      (stripe.customers.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .put('/methods/pm_test123/default')
        .send({
          customerId: 'cus_test123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('setAsDefault', true);
      expect(stripe.customers.update).toHaveBeenCalledWith('cus_test123', {
        invoice_settings: {
          default_payment_method: 'pm_test123',
        },
      });
    });

    it('should return 400 when customerId is missing', async () => {
      const response = await request(app)
        .put('/methods/pm_test123/default')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('POST /methods/setup-intent', () => {
    it('should create a setup intent', async () => {
      const mockSetupIntent = {
        id: 'seti_test123',
        client_secret: 'seti_test123_secret',
      };

      (stripe.setupIntents.create as jest.Mock).mockResolvedValue(
        mockSetupIntent
      );

      const response = await request(app)
        .post('/methods/setup-intent')
        .send({
          customerId: 'cus_test123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('clientSecret', 'seti_test123_secret');
      expect(response.body).toHaveProperty('setupIntentId', 'seti_test123');
      expect(stripe.setupIntents.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        payment_method_types: ['card'],
      });
    });

    it('should return 400 when customerId is missing', async () => {
      const response = await request(app)
        .post('/methods/setup-intent')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing customerId');
    });
  });
});
