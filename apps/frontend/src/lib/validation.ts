import { z } from 'zod'

// User validation schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  dateOfBirth: z.date().refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear()
    return age >= 18
  }, 'You must be at least 18 years old'),
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Profile validation schemas
export const profileSchema = z.object({
  name: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  age: z.number().min(18).max(100),
  gender: z.enum(['male', 'female', 'non-binary', 'other']),
  interests: z.array(z.string()).min(1, 'Select at least one interest').max(10, 'Maximum 10 interests'),
  location: z.object({
    city: z.string(),
    state: z.string().optional(),
    country: z.string(),
  }),
  lookingFor: z.enum(['relationship', 'casual', 'friendship', 'not_sure']),
  height: z.number().min(120).max(250).optional(),
  education: z.string().optional(),
  occupation: z.string().optional(),
  smoker: z.enum(['yes', 'no', 'occasionally']).optional(),
  drinker: z.enum(['yes', 'no', 'socially']).optional(),
  religion: z.string().optional(),
  politicalViews: z.string().optional(),
})

export const profileUpdateSchema = profileSchema.partial()

// Message validation schemas
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters'),
  conversationId: z.string(),
})

// Booking validation schemas
export const bookingSchema = z.object({
  userId: z.string(),
  date: z.string().datetime(),
  location: z.string().min(3, 'Location is required'),
  type: z.enum(['coffee', 'dinner', 'activity', 'drinks', 'other']),
  notes: z.string().max(500).optional(),
})

// Report validation schemas
export const reportSchema = z.object({
  userId: z.string(),
  reason: z.enum([
    'inappropriate_content',
    'harassment',
    'fake_profile',
    'underage',
    'spam',
    'safety_concern',
    'other',
  ]),
  details: z.string().min(10, 'Please provide details').max(1000),
})

// Filter validation schemas
export const filterSchema = z.object({
  minAge: z.number().min(18).max(100).optional(),
  maxAge: z.number().min(18).max(100).optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'other', 'all']).optional(),
  maxDistance: z.number().min(1).max(500).optional(),
  interests: z.array(z.string()).optional(),
  lookingFor: z.enum(['relationship', 'casual', 'friendship', 'not_sure', 'all']).optional(),
  verified: z.boolean().optional(),
  premiumOnly: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.minAge && data.maxAge) {
      return data.minAge <= data.maxAge
    }
    return true
  },
  {
    message: 'Minimum age must be less than or equal to maximum age',
    path: ['minAge'],
  }
)

// Payment validation schemas
export const paymentMethodSchema = z.object({
  paymentMethodId: z.string(),
  billingDetails: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    address: z.object({
      line1: z.string(),
      city: z.string(),
      state: z.string(),
      postal_code: z.string(),
      country: z.string(),
    }),
  }),
})

export const boostPurchaseSchema = z.object({
  quantity: z.number().min(1).max(50),
})

export const walletTopUpSchema = z.object({
  amount: z.number().min(10).max(1000),
})

// Settings validation schemas
export const notificationSettingsSchema = z.object({
  email: z.object({
    matches: z.boolean(),
    messages: z.boolean(),
    likes: z.boolean(),
    promotions: z.boolean(),
  }),
  push: z.object({
    matches: z.boolean(),
    messages: z.boolean(),
    likes: z.boolean(),
  }),
  sms: z.object({
    matches: z.boolean(),
    messages: z.boolean(),
  }),
})

export const privacySettingsSchema = z.object({
  showDistance: z.boolean(),
  showAge: z.boolean(),
  showOnline: z.boolean(),
  incognito: z.boolean(),
  onlyMatchedMessages: z.boolean(),
})

export const accountSettingsSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  language: z.string(),
  timezone: z.string(),
})

// Verification schemas
export const phoneVerificationSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
})

export const codeVerificationSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
})

// 2FA schemas
export const twoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
})

// Helper function to validate data against a schema
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

// Helper function to safely validate and return errors
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

// Type exports
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type BookingInput = z.infer<typeof bookingSchema>
export type ReportInput = z.infer<typeof reportSchema>
export type FilterInput = z.infer<typeof filterSchema>
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>
export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>
