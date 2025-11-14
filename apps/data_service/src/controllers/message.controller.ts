import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../db/prisma';
import { auditService } from '../services/audit.service';
import { CreateMessageDTO, MessageQueryDTO } from '../validators/message.validator';
import { config } from '../config';

const prisma = getPrismaClient();

export class MessageController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateMessageDTO = req.body;

      // Verify sender and receiver exist
      const [sender, receiver] = await Promise.all([
        prisma.user.findUnique({ where: { id: data.senderId } }),
        prisma.user.findUnique({ where: { id: data.receiverId } }),
      ]);

      if (!sender) {
        return res.status(404).json({
          error: 'Sender not found',
        });
      }

      if (!receiver) {
        return res.status(404).json({
          error: 'Receiver not found',
        });
      }

      const message = await prisma.message.create({
        data,
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          receiver: {
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
        userId: data.senderId,
        action: 'create',
        resource: 'message',
        resourceId: message.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  async findByParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const query: MessageQueryDTO = req.query as any;
      const page = query.page || 1;
      const limit = Math.min(query.limit || config.defaultPageSize, config.maxPageSize);
      const skip = (page - 1) * limit;

      const where: any = {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
        deleted: false,
      };

      if (query.read !== undefined) {
        where.read = query.read;
      }

      if (query.type) {
        where.type = query.type;
      }

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            receiver: {
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
        prisma.message.count({ where }),
      ]);

      res.json({
        data: messages,
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

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const { userId } = req.body;

      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        return res.status(404).json({
          error: 'Message not found',
        });
      }

      // Only the receiver can mark a message as read
      if (message.receiverId !== userId) {
        return res.status(403).json({
          error: 'You can only mark messages sent to you as read',
        });
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      await auditService.log({
        userId,
        action: 'mark_as_read',
        resource: 'message',
        resourceId: messageId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(updatedMessage);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const message = await prisma.message.findUnique({
        where: { id },
      });

      if (!message) {
        return res.status(404).json({
          error: 'Message not found',
        });
      }

      await prisma.message.update({
        where: { id },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      });

      await auditService.log({
        userId: message.senderId,
        action: 'delete',
        resource: 'message',
        resourceId: id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
