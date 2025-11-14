import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { validate } from '../middleware/validation.middleware';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';

const router = Router();

// Create user
router.post('/', validate(createUserSchema), userController.create.bind(userController));

// Get all users (with pagination and filtering)
router.get('/', userController.list.bind(userController));

// Get user by ID
router.get('/:id', userController.findById.bind(userController));

// Get user by email
router.get('/email/:email', userController.findByEmail.bind(userController));

// Update user
router.put('/:id', validate(updateUserSchema), userController.update.bind(userController));

// Delete user
router.delete('/:id', userController.delete.bind(userController));

export { router as userRouter };
