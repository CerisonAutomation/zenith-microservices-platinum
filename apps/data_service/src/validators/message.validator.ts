import { z } from 'zod';

export const createMessageSchema = z.object({
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  content: z.string().min(1),
  type: z.enum(['text', 'image', 'video', 'file']).default('text'),
  metadata: z.record(z.any()).optional(),
});

export const markAsReadSchema = z.object({
  userId: z.string().uuid(),
});

export const messageQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  read: z.string().optional().transform(val => val === 'true'),
  type: z.string().optional(),
});

export type CreateMessageDTO = z.infer<typeof createMessageSchema>;
export type MarkAsReadDTO = z.infer<typeof markAsReadSchema>;
export type MessageQueryDTO = z.infer<typeof messageQuerySchema>;
