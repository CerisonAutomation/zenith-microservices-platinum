import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../db/prisma';
import { auditService } from '../services/audit.service';
import { CreateUserDTO, UpdateUserDTO, UserQueryDTO } from '../validators/user.validator';
import { config } from '../config';

const prisma = getPrismaClient();

export class UserController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateUserDTO = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User with this email already exists',
        });
      }

      const user = await prisma.user.create({
        data: {
          ...data,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        },
      });

      await auditService.log({
        userId: user.id,
        action: 'create',
        resource: 'user',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          subscriptions: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async findByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.params;

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          subscriptions: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query: UserQueryDTO = req.query as any;
      const page = query.page || 1;
      const limit = Math.min(query.limit || config.defaultPageSize, config.maxPageSize);
      const skip = (page - 1) * limit;

      const where: any = {};

      if (query.search) {
        where.OR = [
          { email: { contains: query.search, mode: 'insensitive' } },
          { username: { contains: query.search, mode: 'insensitive' } },
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      if (query.verified !== undefined) {
        where.verified = query.verified;
      }

      if (query.active !== undefined) {
        where.active = query.active;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        data: users,
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

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateUserDTO = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        },
      });

      await auditService.log({
        userId: id,
        action: 'update',
        resource: 'user',
        resourceId: id,
        changes: data,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      await prisma.user.delete({
        where: { id },
      });

      await auditService.log({
        userId: id,
        action: 'delete',
        resource: 'user',
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

export const userController = new UserController();
