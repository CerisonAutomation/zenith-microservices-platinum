/**
 * Authentication Service
 * Handles user authentication, JWT tokens, and session management
 */

export interface AuthService {
  // Login
  login(email: string, password: string): Promise<AuthResponse>;
  
  // Register
  register(email: string, password: string, metadata?: any): Promise<AuthResponse>;
  
  // Logout
  logout(userId: string): Promise<void>;
  
  // Token verification
  verifyToken(token: string): Promise<TokenPayload>;
  
  // Password reset
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  
  // OAuth
  initiateOAuth(provider: string): Promise<OAuthUrl>;
  handleOAuthCallback(code: string, provider: string): Promise<AuthResponse>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  role: string;
  metadata?: any;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
}
