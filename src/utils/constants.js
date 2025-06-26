
// Social Media Platforms
const PLATFORMS = {
  INSTAGRAM: 'INSTAGRAM',
  LINKEDIN: 'LINKEDIN',
  TWITTER: 'TWITTER'
};

// Post Status
const POST_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED'
};

// Schedule Status
const SCHEDULE_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

// Content Generation Tones
const CONTENT_TONES = {
  PROFESSIONAL: 'professional',
  CASUAL: 'casual',
  CREATIVE: 'creative'
};

// Content Lengths
const CONTENT_LENGTHS = {
  SHORT: 'short',
  MEDIUM: 'medium',
  LONG: 'long'
};

// Platform Limits
const PLATFORM_LIMITS = {
  TWITTER: {
    MAX_CHARACTERS: 280,
    MAX_IMAGES: 4,
    MAX_VIDEO_SIZE: 512 * 1024 * 1024, // 512MB
    SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov']
  },
  INSTAGRAM: {
    MAX_CAPTION_LENGTH: 2200,
    MAX_IMAGES: 10,
    MAX_VIDEO_SIZE: 4 * 1024 * 1024 * 1024, // 4GB
    SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png'],
    SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov'],
    MIN_RESOLUTION: { width: 320, height: 320 },
    MAX_RESOLUTION: { width: 1080, height: 1080 }
  },
  LINKEDIN: {
    MAX_CHARACTERS: 3000,
    MAX_IMAGES: 20,
    MAX_VIDEO_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
    SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif'],
    SUPPORTED_VIDEO_FORMATS: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
    MIN_RESOLUTION: { width: 90, height: 90 },
    MAX_RESOLUTION: { width: 7680, height: 4320 }
  }
};

// API Endpoints
const API_ENDPOINTS = {
  INSTAGRAM: {
    BASE_URL: 'https://graph.instagram.com',
    AUTH_URL: 'https://api.instagram.com/oauth/authorize',
    TOKEN_URL: 'https://api.instagram.com/oauth/access_token'
  },
  LINKEDIN: {
    BASE_URL: 'https://api.linkedin.com/v2',
    AUTH_URL: 'https://www.linkedin.com/oauth/v2/authorization',
    TOKEN_URL: 'https://www.linkedin.com/oauth/v2/accessToken'
  },
  TWITTER: {
    BASE_URL: 'https://api.twitter.com',
    AUTH_URL: 'https://api.twitter.com/oauth/authenticate',
    REQUEST_TOKEN_URL: 'https://api.twitter.com/oauth/request_token',
    ACCESS_TOKEN_URL: 'https://api.twitter.com/oauth/access_token'
  }
};

// Error Messages
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid credentials provided',
  TOKEN_EXPIRED: 'Authentication token has expired',
  ACCESS_DENIED: 'Access denied. Authentication required',
  
  // User Management
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email or username already exists',
  
  // Social Accounts
  ACCOUNT_NOT_CONNECTED: 'Social media account not connected',
  ACCOUNT_CONNECTION_FAILED: 'Failed to connect social media account',
  INVALID_PLATFORM: 'Invalid social media platform',
  
  // Content & Posts
  POST_NOT_FOUND: 'Post not found',
  CONTENT_GENERATION_FAILED: 'Failed to generate content',
  POST_CREATION_FAILED: 'Failed to create post',
  POST_PUBLISHING_FAILED: 'Failed to publish post',
  
  // Scheduling
  INVALID_SCHEDULE_TIME: 'Scheduled time must be in the future',
  SCHEDULE_CREATION_FAILED: 'Failed to schedule post',
  SCHEDULE_NOT_FOUND: 'Scheduled post not found',
  
  // Validation
  VALIDATION_ERROR: 'Validation error',
  REQUIRED_FIELD_MISSING: 'Required field is missing',
  INVALID_FORMAT: 'Invalid format provided',
  
  // File Upload
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  UNSUPPORTED_FILE_FORMAT: 'Unsupported file format',
  UPLOAD_FAILED: 'File upload failed',
  
  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later'
};

// Success Messages
const SUCCESS_MESSAGES = {
  // Authentication
  REGISTRATION_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  
  // Social Accounts
  ACCOUNT_CONNECTED: 'Social media account connected successfully',
  ACCOUNT_DISCONNECTED: 'Social media account disconnected successfully',
  
  // Content & Posts
  CONTENT_GENERATED: 'Content generated successfully',
  POST_CREATED: 'Post created successfully',
  POST_PUBLISHED: 'Post published successfully',
  POST_UPDATED: 'Post updated successfully',
  POST_DELETED: 'Post deleted successfully',
  
  // Scheduling
  POST_SCHEDULED: 'Post scheduled successfully',
  SCHEDULE_UPDATED: 'Scheduled post updated successfully',
  SCHEDULE_CANCELLED: 'Scheduled post cancelled successfully',
  
  // File Upload
  FILE_UPLOADED: 'File uploaded successfully',
  
  // General
  OPERATION_SUCCESS: 'Operation completed successfully'
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Time Constants
const TIME_CONSTANTS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
};

// Retry Settings
const RETRY_SETTINGS = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 5 * 60 * 1000, // 5 minutes
  EXPONENTIAL_BACKOFF: true,
  MAX_RETRY_DELAY: 30 * 60 * 1000 // 30 minutes
};

// Rate Limiting
const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 5
  },
  CONTENT_GENERATION: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10
  },
  PUBLISHING: {
    WINDOW_MS: 60 * 1000,
    MAX_REQUESTS: 20
  }
};

module.exports = {
  PLATFORMS,
  POST_STATUS,
  SCHEDULE_STATUS,
  CONTENT_TONES,
  CONTENT_LENGTHS,
  PLATFORM_LIMITS,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  TIME_CONSTANTS,
  RETRY_SETTINGS,
  RATE_LIMITS
};

