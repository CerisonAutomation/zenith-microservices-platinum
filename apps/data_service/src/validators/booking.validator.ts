import { z } from 'zod';

export const createBookingSchema = z.object({
  userId: z.string().uuid(),
  providerId: z.string().uuid(),
  serviceType: z.enum(['date', 'event', 'consultation']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateBookingSchema = z.object({
  serviceType: z.enum(['date', 'event', 'consultation']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const cancelBookingSchema = z.object({
  cancellationReason: z.string().optional(),
});

export const bookingQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  status: z.string().optional(),
  serviceType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateBookingDTO = z.infer<typeof createBookingSchema>;
export type UpdateBookingDTO = z.infer<typeof updateBookingSchema>;
export type CancelBookingDTO = z.infer<typeof cancelBookingSchema>;
export type BookingQueryDTO = z.infer<typeof bookingQuerySchema>;
