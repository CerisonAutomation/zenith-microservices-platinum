import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../db/prisma';
import { auditService } from '../services/audit.service';
import {
  CreateBookingDTO,
  UpdateBookingDTO,
  CancelBookingDTO,
  BookingQueryDTO,
} from '../validators/booking.validator';
import { config } from '../config';

const prisma = getPrismaClient();

export class BookingController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateBookingDTO = req.body;

      // Verify user and provider exist
      const [user, provider] = await Promise.all([
        prisma.user.findUnique({ where: { id: data.userId } }),
        prisma.user.findUnique({ where: { id: data.providerId } }),
      ]);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      if (!provider) {
        return res.status(404).json({
          error: 'Provider not found',
        });
      }

      const booking = await prisma.booking.create({
        data: {
          ...data,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          provider: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await auditService.log({
        userId: data.userId,
        action: 'create',
        resource: 'booking',
        resourceId: booking.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  async findByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const query: BookingQueryDTO = req.query as any;
      const page = query.page || 1;
      const limit = Math.min(query.limit || config.defaultPageSize, config.maxPageSize);
      const skip = (page - 1) * limit;

      const where: any = {
        OR: [
          { userId },
          { providerId: userId },
        ],
      };

      if (query.status) {
        where.status = query.status;
      }

      if (query.serviceType) {
        where.serviceType = query.serviceType;
      }

      if (query.startDate) {
        where.startTime = {
          gte: new Date(query.startDate),
        };
      }

      if (query.endDate) {
        where.endTime = {
          lte: new Date(query.endDate),
        };
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          skip,
          take: limit,
          orderBy: { startTime: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            provider: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        }),
        prisma.booking.count({ where }),
      ]);

      res.json({
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          provider: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({
          error: 'Booking not found',
        });
      }

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateBookingDTO = req.body;

      const existing = await prisma.booking.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          error: 'Booking not found',
        });
      }

      const booking = await prisma.booking.update({
        where: { id },
        data: {
          ...data,
          startTime: data.startTime ? new Date(data.startTime) : undefined,
          endTime: data.endTime ? new Date(data.endTime) : undefined,
          confirmedAt: data.status === 'confirmed' ? new Date() : undefined,
          completedAt: data.status === 'completed' ? new Date() : undefined,
        },
      });

      await auditService.log({
        userId: existing.userId,
        action: 'update',
        resource: 'booking',
        resourceId: id,
        changes: data,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: CancelBookingDTO = req.body;

      const existing = await prisma.booking.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          error: 'Booking not found',
        });
      }

      if (existing.status === 'cancelled') {
        return res.status(400).json({
          error: 'Booking is already cancelled',
        });
      }

      const booking = await prisma.booking.update({
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
        resource: 'booking',
        resourceId: id,
        changes: { cancellationReason: data.cancellationReason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
