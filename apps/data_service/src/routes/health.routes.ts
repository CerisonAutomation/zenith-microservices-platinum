import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../db/prisma';
import { config } from '../config';

const router = Router();

// Liveness probe - is the service running?
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe - is the service ready to accept traffic?
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'error',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Full health check with detailed information
router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrismaClient();

    // Database check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Get some stats
    const [userCount, subscriptionCount, messageCount, bookingCount] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count(),
      prisma.message.count(),
      prisma.booking.count(),
    ]);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.nodeEnv,
      uptime: process.uptime(),
      checks: {
        database: {
          status: 'ok',
          latency: `${dbLatency}ms`,
        },
      },
      stats: {
        users: userCount,
        subscriptions: subscriptionCount,
        messages: messageCount,
        bookings: bookingCount,
      },
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as healthRouter };
