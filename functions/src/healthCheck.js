/**
 * Health check endpoint for monitoring system status
 */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { getHealthCheckConfig, getEnvironmentConfig } = require('./productionConfig');

/**
 * Comprehensive health check endpoint
 */
const healthCheck = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const startTime = Date.now();
    const config = getEnvironmentConfig();
    const healthConfig = getHealthCheckConfig();
    
    try {
      const results = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.environment,
        version: '1.0.0',
        uptime: process.uptime(),
        checks: {}
      };
      
      // Run all health checks
      for (const check of healthConfig.checks) {
        try {
          const checkStart = Date.now();
          const result = await check.check();
          const checkDuration = Date.now() - checkStart;
          
          results.checks[check.name] = {
            ...result,
            duration: `${checkDuration}ms`,
            timestamp: new Date().toISOString()
          };
          
        } catch (error) {
          results.checks[check.name] = {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
          };
          
          // Mark overall status as unhealthy if any check fails
          results.status = 'unhealthy';
        }
      }
      
      // Add performance metrics
      results.performance = {
        totalDuration: `${Date.now() - startTime}ms`,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        },
        cpu: {
          usage: process.cpuUsage()
        }
      };
      
      // Set appropriate HTTP status code
      const statusCode = results.status === 'healthy' ? 200 : 503;
      
      return res.status(statusCode).json(results);
      
    } catch (error) {
      console.error('Health check failed:', error);
      
      return res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        duration: `${Date.now() - startTime}ms`
      });
    }
  });
});

/**
 * Simple ping endpoint for basic availability checks
 */
const ping = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Service is running'
    });
  });
});

/**
 * Detailed system information endpoint (development only)
 */
const systemInfo = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const config = getEnvironmentConfig();
    
    // Only allow in development
    if (config.isProduction) {
      return res.status(403).json({
        error: 'System info not available in production'
      });
    }
    
    const info = {
      environment: config.environment,
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime()
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      firebase: {
        projectId: config.projectId,
        region: config.region
      },
      configuration: {
        cors: config.security.corsOrigins,
        rateLimiting: config.security.rateLimiting.enabled,
        caching: config.performance.caching.enabled,
        monitoring: config.monitoring.enabled
      }
    };
    
    res.status(200).json(info);
  });
});

/**
 * Database connectivity test
 */
const testDatabase = async () => {
  try {
    const db = admin.firestore();
    
    // Test read operation
    const testDoc = await db.collection('health').doc('connectivity-test').get();
    
    // Test write operation
    await db.collection('health').doc('connectivity-test').set({
      lastCheck: admin.firestore.FieldValue.serverTimestamp(),
      status: 'connected'
    });
    
    return {
      status: 'healthy',
      operations: ['read', 'write'],
      message: 'Database connectivity verified'
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Database connectivity failed'
    };
  }
};

/**
 * Storage connectivity test
 */
const testStorage = async () => {
  try {
    const bucket = admin.storage().bucket();
    
    // Test bucket access
    const [metadata] = await bucket.getMetadata();
    
    // Test file operations (create a small test file)
    const testFile = bucket.file('health/connectivity-test.txt');
    await testFile.save('Health check test file', {
      metadata: {
        contentType: 'text/plain'
      }
    });
    
    // Clean up test file
    await testFile.delete();
    
    return {
      status: 'healthy',
      operations: ['read', 'write', 'delete'],
      bucketName: metadata.name,
      message: 'Storage connectivity verified'
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Storage connectivity failed'
    };
  }
};

/**
 * Email service connectivity test
 */
const testEmailService = async () => {
  try {
    const config = getEnvironmentConfig();
    
    // Check SMTP configuration
    if (!config.smtp.username || !config.smtp.password) {
      return {
        status: 'unhealthy',
        error: 'SMTP credentials not configured',
        message: 'Email service configuration incomplete'
      };
    }
    
    // Test SMTP connection (without sending email)
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.username,
        pass: config.smtp.password
      }
    });
    
    await transporter.verify();
    
    return {
      status: 'healthy',
      host: config.smtp.host,
      port: config.smtp.port,
      message: 'Email service connectivity verified'
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Email service connectivity failed'
    };
  }
};

/**
 * Performance metrics collection
 */
const getPerformanceMetrics = () => {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();
  
  return {
    memory: {
      rss: Math.round(memory.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memory.external / 1024 / 1024 * 100) / 100, // MB
      arrayBuffers: Math.round(memory.arrayBuffers / 1024 / 1024 * 100) / 100 // MB
    },
    cpu: {
      user: cpu.user,
      system: cpu.system
    },
    uptime: process.uptime(),
    loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null,
    timestamp: new Date().toISOString()
  };
};

/**
 * Readiness probe (for Kubernetes/container orchestration)
 */
const readiness = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Quick checks for readiness
      const checks = await Promise.all([
        testDatabase(),
        // Add other critical service checks here
      ]);
      
      const allHealthy = checks.every(check => check.status === 'healthy');
      
      if (allHealthy) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          checks
        });
      }
      
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
});

/**
 * Liveness probe (for Kubernetes/container orchestration)
 */
const liveness = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // Simple liveness check - if the function responds, it's alive
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
});

module.exports = {
  healthCheck,
  ping,
  systemInfo,
  readiness,
  liveness,
  testDatabase,
  testStorage,
  testEmailService,
  getPerformanceMetrics
};