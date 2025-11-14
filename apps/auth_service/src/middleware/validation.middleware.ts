import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/errors';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error.errors) {
        const messages = error.errors.map((err: any) => {
          return `${err.path.join('.')}: ${err.message}`;
        });
        next(new AppError(`Validation failed: ${messages.join(', ')}`, 400));
      } else {
        next(error);
      }
    }
  };
};
