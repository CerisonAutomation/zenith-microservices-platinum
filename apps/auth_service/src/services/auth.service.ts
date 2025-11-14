import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserService } from './user.service';
import { TokenService } from './token.service';
import { AppError } from '../utils/errors';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    metadata?: any;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

export class AuthService {
  private userService: UserService;
  private tokenService: TokenService;

  constructor() {
    this.userService = new UserService();
    this.tokenService = new TokenService();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(email);

    if (!user || !user.password_hash) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const { accessToken, refreshToken } = await this.tokenService.generateTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        metadata: user.metadata,
      },
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }

  async register(email: string, password: string, metadata?: any): Promise<AuthResponse> {
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    const user = await this.userService.create({
      email,
      passwordHash,
      metadata: metadata || {},
    });

    const { accessToken, refreshToken } = await this.tokenService.generateTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        metadata: user.metadata,
      },
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
      return payload;
    } catch (error) {
      throw new AppError('Invalid token', 401);
    }
  }

  generateAccessToken(user: any): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }
}
