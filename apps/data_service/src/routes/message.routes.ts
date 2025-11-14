import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { validate } from '../middleware/validation.middleware';
import { createMessageSchema, markAsReadSchema } from '../validators/message.validator';

const router = Router();

// Create message
router.post('/', validate(createMessageSchema), messageController.create.bind(messageController));

// Get messages by participant (sender or receiver)
router.get('/participant/:userId', messageController.findByParticipant.bind(messageController));

// Mark message as read
router.post('/:messageId/read', validate(markAsReadSchema), messageController.markAsRead.bind(messageController));

// Delete message
router.delete('/:id', messageController.delete.bind(messageController));

export { router as messageRouter };
