const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(50).optional()
  }),

  login: Joi.object({
    login: Joi.string().required(), // email or username
    password: Joi.string().required()
  }),

  createPost: Joi.object({
    content: Joi.string().required(),
    platform: Joi.string().valid('INSTAGRAM', 'LINKEDIN', 'TWITTER').required(),
    mediaUrls: Joi.array().items(Joi.string().uri()).optional(),
    hashtags: Joi.array().items(Joi.string()).optional()
  }),

  schedulePost: Joi.object({
    content: Joi.string().required(),
    platforms: Joi.array().items(
      Joi.string().valid('INSTAGRAM', 'LINKEDIN', 'TWITTER')
    ).min(1).required(),
    scheduledTime: Joi.date().iso().greater('now').required(),
    mediaUrls: Joi.array().items(Joi.string().uri()).optional(),
    hashtags: Joi.array().items(Joi.string()).optional()
  }),

  generateContent: Joi.object({
    prompt: Joi.string().required(),
    platform: Joi.string().valid('INSTAGRAM', 'LINKEDIN', 'TWITTER').required(),
    tone: Joi.string().valid('professional', 'casual', 'creative').optional(),
    length: Joi.string().valid('short', 'medium', 'long').optional()
  }),

  publishNow: Joi.object({
    content: Joi.string().required(),
    platforms: Joi.array().items(
      Joi.string().valid('INSTAGRAM', 'LINKEDIN', 'TWITTER')
    ).min(1).required(),
    mediaUrls: Joi.array().items(Joi.string().uri()).optional()
  }),

  connectSocial: Joi.object({
    code: Joi.string().required()
  }),

  connectTwitter: Joi.object({
    oauth_token: Joi.string().required(),
    oauth_verifier: Joi.string().required()
  })
};

module.exports = { validate, schemas };
