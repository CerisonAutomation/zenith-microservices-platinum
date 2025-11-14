import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.string().optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  preferences: z.record(z.any()).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(50).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.string().optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  preferences: z.record(z.any()).optional(),
  verified: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const userQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  search: z.string().optional(),
  verified: z.string().optional().transform(val => val === 'true'),
  active: z.string().optional().transform(val => val === 'true'),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export type UserQueryDTO = z.infer<typeof userQuerySchema>;
