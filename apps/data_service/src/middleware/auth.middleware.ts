import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Simple API key authentication middleware
// In production, this should integrate with the auth_service for JWT validation
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization header provided',
      });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer') {
      return res.status(401).json({
        error: 'Invalid authorization type. Expected Bearer token',
      });
    }

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
      });
    }

    // TODO: In production, validate JWT token with auth_service
    // For now, we'll accept any token in development mode
    if (config.nodeEnv !== 'development') {
      // Implement JWT validation here
      // const response = await fetch(`${config.authServiceUrl}/auth/verify`, {
      //   headers: { Authorization: authHeader }
      // });
      // if (!response.ok) {
      //   return res.status(401).json({ error: 'Invalid token' });
      // }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
    });
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  return authenticate(req, res, next);
};
