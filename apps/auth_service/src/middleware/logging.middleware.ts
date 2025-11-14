import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = crypto.randomBytes(16).toString('hex');
  const startTime = Date.now();

  // Attach request ID to request
  (req as any).requestId = requestId;

  // Log request
  console.log(`[${requestId}] ${req.method} ${req.path}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ${res.statusCode} - ${duration}ms`);
  });

  next();
};
