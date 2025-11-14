import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { validate } from '../middleware/validation.middleware';
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  cancelSubscriptionSchema,
} from '../validators/subscription.validator';

const router = Router();

// Create subscription
router.post('/', validate(createSubscriptionSchema), subscriptionController.create.bind(subscriptionController));

// Get subscription by ID
router.get('/:id', subscriptionController.findById.bind(subscriptionController));

// Get subscriptions by user ID
router.get('/user/:userId', subscriptionController.findByUserId.bind(subscriptionController));

// Update subscription
router.put('/:id', validate(updateSubscriptionSchema), subscriptionController.update.bind(subscriptionController));

// Cancel subscription
router.post('/:id/cancel', validate(cancelSubscriptionSchema), subscriptionController.cancel.bind(subscriptionController));

export { router as subscriptionRouter };
