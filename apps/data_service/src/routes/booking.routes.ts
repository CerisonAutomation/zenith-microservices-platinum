import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { validate } from '../middleware/validation.middleware';
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
} from '../validators/booking.validator';

const router = Router();

// Create booking
router.post('/', validate(createBookingSchema), bookingController.create.bind(bookingController));

// Get booking by ID
router.get('/:id', bookingController.findById.bind(bookingController));

// Get bookings by user ID (as user or provider)
router.get('/user/:userId', bookingController.findByUser.bind(bookingController));

// Update booking
router.put('/:id', validate(updateBookingSchema), bookingController.update.bind(bookingController));

// Cancel booking
router.post('/:id/cancel', validate(cancelBookingSchema), bookingController.cancel.bind(bookingController));

export { router as bookingRouter };
