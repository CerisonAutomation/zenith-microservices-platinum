import Joi from 'joi';

// Common validation schemas
export const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(2).max(100).required(),
  age: Joi.number().integer().min(18).max(100),
  gender: Joi.string().valid('male', 'female', 'other'),
  bio: Joi.string().max(500),
  interests: Joi.array().items(Joi.string()).max(20),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  })
});

export const messageSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  conversationId: Joi.string().uuid(),
  recipientId: Joi.string().uuid().required(),
  attachments: Joi.array().items(Joi.object({
    type: Joi.string().valid('image', 'video', 'file').required(),
    url: Joi.string().uri().required(),
    filename: Joi.string().required()
  })).max(5)
});

export const searchFiltersSchema = Joi.object({
  query: Joi.string().min(1).max(100),
  ageMin: Joi.number().integer().min(18).max(100),
  ageMax: Joi.number().integer().min(18).max(100),
  gender: Joi.array().items(Joi.string()),
  distance: Joi.number().min(0).max(500),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  verifiedOnly: Joi.boolean(),
  onlineOnly: Joi.boolean(),
  hasPhotos: Joi.boolean(),
  interests: Joi.array().items(Joi.string()),
  compatibilityMin: Joi.number().min(0).max(1),
  excludeMatched: Joi.boolean()
});

// Validation middleware
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail: any) => detail.message)
      });
    }
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Query validation failed',
        details: error.details.map((detail: any) => detail.message)
      });
    }
    next();
  };
};