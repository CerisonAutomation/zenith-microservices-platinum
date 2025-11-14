import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../db/prisma';
import { auditService } from '../services/audit.service';
import {
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  CancelSubscriptionDTO,
  SubscriptionQueryDTO,
} from '../validators/subscription.validator';
import { config } from '../config';

const prisma = getPrismaClient();

export class SubscriptionController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateSubscriptionDTO = req.body;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      const subscription = await prisma.subscription.create({
        data: {
          ...data,
          status: 'active',
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
      });

      await auditService.log({
        userId: data.userId,
        action: 'create',
        resource: 'subscription',
        resourceId: subscription.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json(subscription);
    } catch (error) {
      next(error);
    }
  }

  async findByUserId(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const query: SubscriptionQueryDTO = req.query as any;

      const where: any = { userId };

      if (query.status) {
        where.status = query.status;
      }

      if (query.plan) {
        where.plan = query.plan;
      }

      const subscriptions = await prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.json(subscriptions);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!subscription) {
        return res.status(404).json({
          error: 'Subscription not found',
        });
      }

      res.json(subscription);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateSubscriptionDTO = req.body;

      const existing = await prisma.subscription.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          error: 'Subscription not found',
        });
      }

      const subscription = await prisma.subscription.update({
        where: { id },
        data: {
          ...data,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
      });

      await auditService.log({
        userId: existing.userId,
        action: 'update',
        resource: 'subscription',
        resourceId: id,
        changes: data,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(subscription);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: CancelSubscriptionDTO = req.body;

      const existing = await prisma.subscription.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          error: 'Subscription not found',
        });
      }

      if (existing.status === 'cancelled') {
        return res.status(400).json({
          error: 'Subscription is already cancelled',
        });
      }

      const subscription = await prisma.subscription.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: data.cancellationReason,
        },
      });

      await auditService.log({
        userId: existing.userId,
        action: 'cancel',
        resource: 'subscription',
        resourceId: id,
        changes: { cancellationReason: data.cancellationReason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(subscription);
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
