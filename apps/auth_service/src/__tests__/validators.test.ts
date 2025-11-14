import {
  registerSchema,
  loginSchema,
  passwordResetSchema,
} from '../validators/auth.validators';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const valid = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      expect(() => registerSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'SecurePass123',
      };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it('should reject short password', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'Short1',
      };

      expect(() => registerSchema.parse(invalid)).toThrow('at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'lowercase123',
      };

      expect(() => registerSchema.parse(invalid)).toThrow('uppercase');
    });

    it('should reject password without lowercase', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'UPPERCASE123',
      };

      expect(() => registerSchema.parse(invalid)).toThrow('lowercase');
    });

    it('should reject password without number', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'NoNumbers',
      };

      expect(() => registerSchema.parse(invalid)).toThrow('number');
    });

    it('should accept optional metadata', () => {
      const valid = {
        email: 'test@example.com',
        password: 'SecurePass123',
        metadata: { firstName: 'John', lastName: 'Doe' },
      };

      expect(() => registerSchema.parse(valid)).not.toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const valid = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      expect(() => loginSchema.parse(valid)).not.toThrow();
    });

    it('should reject missing email', () => {
      const invalid = {
        password: 'password',
      };

      expect(() => loginSchema.parse(invalid)).toThrow();
    });

    it('should reject missing password', () => {
      const invalid = {
        email: 'test@example.com',
      };

      expect(() => loginSchema.parse(invalid)).toThrow();
    });
  });

  describe('passwordResetSchema', () => {
    it('should accept valid reset data', () => {
      const valid = {
        token: 'valid-token-string',
        newPassword: 'NewSecure123',
      };

      expect(() => passwordResetSchema.parse(valid)).not.toThrow();
    });

    it('should enforce password strength on reset', () => {
      const invalid = {
        token: 'valid-token',
        newPassword: 'weak',
      };

      expect(() => passwordResetSchema.parse(invalid)).toThrow();
    });

    it('should require token', () => {
      const invalid = {
        newPassword: 'NewSecure123',
      };

      expect(() => passwordResetSchema.parse(invalid)).toThrow();
    });
  });
});
