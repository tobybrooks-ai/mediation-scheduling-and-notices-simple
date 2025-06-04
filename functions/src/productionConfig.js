/**
 * Production configuration and environment setup
 */

const functions = require('firebase-functions/v1');

/**
 * Environment configuration
 */
const getEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    isProduction,
    isDevelopment,
    isTest,
    environment: process.env.NODE_ENV || 'development',
    
    // Firebase configuration
    projectId: process.env.FIREBASE_PROJECT_ID || functions.config().firebase?.projectId,
    region: process.env.FIREBASE_REGION || 'us-central1',
    
    // SMTP configuration
    smtp: {
      host: 'mail.smtp2go.com',
      port: 587,
      secure: false,
      username: functions.config().smtp2go?.username || process.env.SMTP2GO_USERNAME,
      password: functions.config().smtp2go?.password || process.env.SMTP2GO_PASSWORD,
      fromEmail: functions.config().smtp2go?.from_email || process.env.SMTP2GO_FROM_EMAIL || 'noreply@mediation-scheduling.com',
      fromName: functions.config().smtp2go?.from_name || process.env.SMTP2GO_FROM_NAME || 'Mediation Scheduling System'
    },
    
    // Application URLs
    urls: {
      frontend: isProduction 
        ? functions.config().app?.frontend_url || process.env.FRONTEND_URL || 'https://mediation-scheduling.web.app'
        : 'http://localhost:3000',
      backend: isProduction
        ? functions.config().app?.backend_url || process.env.BACKEND_URL
        : 'http://localhost:5001'
    },
    
    // Security settings
    security: {
      corsOrigins: isProduction 
        ? [
            'https://mediation-scheduling.web.app',
            'https://mediation-scheduling.firebaseapp.com'
          ]
        : ['http://localhost:3000', 'http://localhost:3001'],
      
      rateLimiting: {
        enabled: isProduction,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: isProduction ? 100 : 1000 // Requests per window
      },
      
      authentication: {
        required: true,
        skipForPaths: ['/health', '/api/track-email-open', '/api/vote']
      }
    },
    
    // Performance settings
    performance: {
      caching: {
        enabled: true,
        defaultTtl: isProduction ? 5 * 60 * 1000 : 30 * 1000, // 5 min prod, 30 sec dev
        maxSize: 1000 // Maximum cache entries
      },
      
      database: {
        connectionPooling: isProduction,
        queryTimeout: 30000, // 30 seconds
        batchSize: 500
      },
      
      email: {
        batchSize: isProduction ? 10 : 5,
        delayBetweenBatches: isProduction ? 2000 : 1000, // ms
        retryAttempts: 3,
        retryDelay: 5000 // ms
      },
      
      fileUpload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf'],
        signedUrlExpiry: 15 * 60 * 1000 // 15 minutes
      }
    },
    
    // Logging configuration
    logging: {
      level: isProduction ? 'info' : 'debug',
      enablePerformanceLogging: true,
      enableErrorTracking: isProduction,
      logRetentionDays: isProduction ? 30 : 7
    },
    
    // Monitoring and alerts
    monitoring: {
      enabled: isProduction,
      errorThreshold: 0.05, // 5% error rate
      latencyThreshold: 5000, // 5 seconds
      memoryThreshold: 512 // MB
    }
  };
};

/**
 * Validation for required environment variables
 */
const validateEnvironment = () => {
  const config = getEnvironmentConfig();
  const errors = [];
  
  // Required SMTP configuration
  if (!config.smtp.username) {
    errors.push('SMTP2GO_USERNAME is required');
  }
  
  if (!config.smtp.password) {
    errors.push('SMTP2GO_PASSWORD is required');
  }
  
  // Required Firebase configuration
  if (!config.projectId) {
    errors.push('FIREBASE_PROJECT_ID is required');
  }
  
  // Production-specific validations
  if (config.isProduction) {
    if (!config.urls.frontend.startsWith('https://')) {
      errors.push('Production frontend URL must use HTTPS');
    }
    
    if (!config.smtp.fromEmail.includes('@')) {
      errors.push('Valid from email address is required in production');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
};

/**
 * CORS configuration
 */
const getCorsConfig = () => {
  const config = getEnvironmentConfig();
  
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (config.security.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // In development, allow localhost with any port
      if (config.isDevelopment && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
};

/**
 * Rate limiting configuration
 */
const getRateLimitConfig = () => {
  const config = getEnvironmentConfig();
  
  if (!config.security.rateLimiting.enabled) {
    return null;
  }
  
  return {
    windowMs: config.security.rateLimiting.windowMs,
    max: config.security.rateLimiting.maxRequests,
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  };
};

/**
 * Error handling configuration
 */
const getErrorHandlingConfig = () => {
  const config = getEnvironmentConfig();
  
  return {
    showStackTrace: !config.isProduction,
    logErrors: true,
    enableErrorReporting: config.isProduction,
    
    // Error response format
    formatError: (error, req) => {
      const response = {
        error: error.message || 'An error occurred',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };
      
      // Include stack trace in development
      if (config.isDevelopment) {
        response.stack = error.stack;
      }
      
      return response;
    }
  };
};

/**
 * Database configuration
 */
const getDatabaseConfig = () => {
  const config = getEnvironmentConfig();
  
  return {
    settings: {
      ignoreUndefinedProperties: true,
      merge: true
    },
    
    // Query optimization
    queryLimits: {
      defaultLimit: 50,
      maxLimit: 1000
    },
    
    // Batch operation settings
    batchSettings: {
      maxOperations: config.performance.database.batchSize,
      timeout: config.performance.database.queryTimeout
    },
    
    // Indexing hints
    indexes: [
      { collection: 'polls', fields: ['createdBy', 'createdAt'] },
      { collection: 'notices', fields: ['caseId', 'createdAt'] },
      { collection: 'votes', fields: ['pollId', 'participantEmail'] },
      { collection: 'emailTracking', fields: ['type', 'sentAt'] },
      { collection: 'cases', fields: ['mediatorId', 'status'] }
    ]
  };
};

/**
 * Security headers configuration
 */
const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};

/**
 * Health check configuration
 */
const getHealthCheckConfig = () => {
  return {
    endpoint: '/health',
    checks: [
      {
        name: 'database',
        check: async () => {
          const admin = require('firebase-admin');
          const db = admin.firestore();
          await db.collection('health').doc('test').get();
          return { status: 'healthy' };
        }
      },
      {
        name: 'storage',
        check: async () => {
          const admin = require('firebase-admin');
          const bucket = admin.storage().bucket();
          await bucket.getMetadata();
          return { status: 'healthy' };
        }
      },
      {
        name: 'memory',
        check: async () => {
          const usage = process.memoryUsage();
          const memoryMB = usage.heapUsed / 1024 / 1024;
          const config = getEnvironmentConfig();
          
          return {
            status: memoryMB < config.monitoring.memoryThreshold ? 'healthy' : 'warning',
            memoryUsage: `${Math.round(memoryMB)}MB`,
            threshold: `${config.monitoring.memoryThreshold}MB`
          };
        }
      }
    ]
  };
};

/**
 * Initialize production configurations
 */
const initializeProductionConfig = () => {
  try {
    // Validate environment
    validateEnvironment();
    
    const config = getEnvironmentConfig();
    
    console.log(`🚀 Initializing ${config.environment} environment`);
    console.log(`📍 Region: ${config.region}`);
    console.log(`🔒 Security: CORS enabled, Rate limiting ${config.security.rateLimiting.enabled ? 'enabled' : 'disabled'}`);
    console.log(`⚡ Performance: Caching ${config.performance.caching.enabled ? 'enabled' : 'disabled'}`);
    console.log(`📊 Monitoring: ${config.monitoring.enabled ? 'enabled' : 'disabled'}`);
    
    return config;
    
  } catch (error) {
    console.error('❌ Failed to initialize production config:', error.message);
    throw error;
  }
};

module.exports = {
  getEnvironmentConfig,
  validateEnvironment,
  getCorsConfig,
  getRateLimitConfig,
  getErrorHandlingConfig,
  getDatabaseConfig,
  getSecurityHeaders,
  getHealthCheckConfig,
  initializeProductionConfig
};