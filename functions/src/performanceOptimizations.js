/**
 * Performance optimizations for Cloud Functions
 */

const admin = require('firebase-admin');

/**
 * Connection pooling and caching utilities
 */
class PerformanceOptimizer {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.dbConnections = new Map();
  }

  /**
   * Cache frequently accessed data
   */
  setCache(key, value, customTimeout = null) {
    const timeout = customTimeout || this.cacheTimeout;
    const expiry = Date.now() + timeout;
    
    this.cache.set(key, {
      value,
      expiry
    });
  }

  /**
   * Get cached data if not expired
   */
  getCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Batch Firestore operations for better performance
   */
  async batchWrite(operations) {
    const db = admin.firestore();
    const batch = db.batch();
    
    operations.forEach(operation => {
      switch (operation.type) {
        case 'set':
          batch.set(operation.ref, operation.data);
          break;
        case 'update':
          batch.update(operation.ref, operation.data);
          break;
        case 'delete':
          batch.delete(operation.ref);
          break;
      }
    });
    
    return await batch.commit();
  }

  /**
   * Optimized query with caching
   */
  async cachedQuery(collectionPath, queryConstraints, cacheKey, cacheTimeout = null) {
    // Check cache first
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Execute query
    const db = admin.firestore();
    let query = db.collection(collectionPath);
    
    queryConstraints.forEach(constraint => {
      query = query.where(constraint.field, constraint.operator, constraint.value);
    });
    
    const snapshot = await query.get();
    const results = [];
    
    snapshot.forEach(doc => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Cache results
    this.setCache(cacheKey, results, cacheTimeout);
    
    return results;
  }

  /**
   * Paginated query for large datasets
   */
  async paginatedQuery(collectionPath, queryConstraints, orderBy, limit = 20, startAfter = null) {
    const db = admin.firestore();
    let query = db.collection(collectionPath);
    
    // Apply constraints
    queryConstraints.forEach(constraint => {
      query = query.where(constraint.field, constraint.operator, constraint.value);
    });
    
    // Apply ordering
    query = query.orderBy(orderBy.field, orderBy.direction || 'desc');
    
    // Apply pagination
    if (startAfter) {
      query = query.startAfter(startAfter);
    }
    
    query = query.limit(limit);
    
    const snapshot = await query.get();
    const results = [];
    let lastDoc = null;
    
    snapshot.forEach(doc => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
      lastDoc = doc;
    });
    
    return {
      results,
      hasMore: results.length === limit,
      lastDoc
    };
  }

  /**
   * Parallel processing for independent operations
   */
  async parallelProcess(operations) {
    return await Promise.all(operations);
  }

  /**
   * Sequential processing with error handling
   */
  async sequentialProcess(operations) {
    const results = [];
    const errors = [];
    
    for (const operation of operations) {
      try {
        const result = await operation();
        results.push(result);
      } catch (error) {
        errors.push({
          operation: operation.name || 'unknown',
          error: error.message
        });
      }
    }
    
    return { results, errors };
  }

  /**
   * Memory usage monitoring
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
      cacheSize: this.cache.size
    };
  }

  /**
   * Performance metrics logging
   */
  logPerformanceMetrics(functionName, startTime, additionalMetrics = {}) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const memory = this.getMemoryUsage();
    
    console.log(`Performance Metrics - ${functionName}:`, {
      duration: `${duration}ms`,
      memory,
      timestamp: new Date().toISOString(),
      ...additionalMetrics
    });
    
    // Log warning for slow functions
    if (duration > 5000) { // 5 seconds
      console.warn(`Slow function detected: ${functionName} took ${duration}ms`);
    }
  }
}

// Global instance
const performanceOptimizer = new PerformanceOptimizer();

/**
 * Middleware for performance monitoring
 */
const performanceMiddleware = (functionName) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Add performance utilities to request
    req.performance = {
      startTime,
      optimizer: performanceOptimizer
    };
    
    // Override res.json to log performance
    const originalJson = res.json;
    res.json = function(data) {
      performanceOptimizer.logPerformanceMetrics(functionName, startTime, {
        statusCode: res.statusCode,
        responseSize: JSON.stringify(data).length
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Database optimization utilities
 */
const dbOptimizations = {
  /**
   * Optimized user polls query with caching
   */
  async getUserPolls(userId, useCache = true) {
    const cacheKey = `user_polls_${userId}`;
    
    if (useCache) {
      const cached = performanceOptimizer.getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const db = admin.firestore();
    const snapshot = await db.collection('polls')
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50) // Limit to recent polls
      .get();
    
    const polls = [];
    snapshot.forEach(doc => {
      polls.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Cache for 2 minutes
    performanceOptimizer.setCache(cacheKey, polls, 2 * 60 * 1000);
    
    return polls;
  },

  /**
   * Optimized case notices query
   */
  async getCaseNotices(caseId, useCache = true) {
    const cacheKey = `case_notices_${caseId}`;
    
    if (useCache) {
      const cached = performanceOptimizer.getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const db = admin.firestore();
    const snapshot = await db.collection('notices')
      .where('caseId', '==', caseId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const notices = [];
    snapshot.forEach(doc => {
      notices.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Cache for 1 minute
    performanceOptimizer.setCache(cacheKey, notices, 60 * 1000);
    
    return notices;
  },

  /**
   * Batch email tracking updates
   */
  async batchUpdateEmailTracking(updates) {
    const operations = updates.map(update => ({
      type: 'update',
      ref: admin.firestore().collection('emailTracking').doc(update.id),
      data: update.data
    }));
    
    return await performanceOptimizer.batchWrite(operations);
  },

  /**
   * Optimized vote counting
   */
  async getOptimizedPollResults(pollId) {
    const cacheKey = `poll_results_${pollId}`;
    const cached = performanceOptimizer.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const db = admin.firestore();
    
    // Get poll and votes in parallel
    const [pollDoc, votesSnapshot] = await Promise.all([
      db.collection('polls').doc(pollId).get(),
      db.collection('votes').where('pollId', '==', pollId).get()
    ]);
    
    if (!pollDoc.exists) {
      throw new Error('Poll not found');
    }
    
    const poll = { id: pollDoc.id, ...pollDoc.data() };
    const votes = [];
    
    votesSnapshot.forEach(doc => {
      votes.push(doc.data());
    });
    
    // Calculate results
    const timeOptions = poll.timeOptions || [];
    const results = timeOptions.map(option => {
      const optionVotes = votes.filter(vote => vote.optionId === option.id);
      
      return {
        ...option,
        votes: {
          yes: optionVotes.filter(v => v.type === 'yes').length,
          ifNeedBe: optionVotes.filter(v => v.type === 'if_need_be').length,
          no: optionVotes.filter(v => v.type === 'no').length,
          total: optionVotes.length
        }
      };
    });
    
    const finalResults = {
      poll,
      results,
      totalVotes: votes.length,
      participantCount: poll.participants ? poll.participants.length : 0
    };
    
    // Cache for 30 seconds (short cache for active polls)
    performanceOptimizer.setCache(cacheKey, finalResults, 30 * 1000);
    
    return finalResults;
  }
};

/**
 * Email optimization utilities
 */
const emailOptimizations = {
  /**
   * Batch email sending with rate limiting
   */
  async batchSendEmails(emails, batchSize = 5, delayMs = 1000) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.all(
          batch.map(email => this.sendSingleEmail(email))
        );
        
        results.push(...batchResults);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error) {
        errors.push({
          batch: i / batchSize + 1,
          error: error.message
        });
      }
    }
    
    return { results, errors };
  },

  /**
   * Email template caching
   */
  getCachedEmailTemplate(templateName, data) {
    const cacheKey = `email_template_${templateName}_${JSON.stringify(data).slice(0, 50)}`;
    
    let template = performanceOptimizer.getCache(cacheKey);
    
    if (!template) {
      // Generate template (this would call the actual template function)
      template = this.generateEmailTemplate(templateName, data);
      
      // Cache for 10 minutes
      performanceOptimizer.setCache(cacheKey, template, 10 * 60 * 1000);
    }
    
    return template;
  }
};

/**
 * File upload optimizations
 */
const fileOptimizations = {
  /**
   * Parallel file processing
   */
  async processMultipleFiles(files) {
    const operations = files.map(file => 
      () => this.processSingleFile(file)
    );
    
    return await performanceOptimizer.parallelProcess(operations);
  },

  /**
   * File metadata caching
   */
  async getCachedFileMetadata(filePath) {
    const cacheKey = `file_metadata_${filePath}`;
    
    let metadata = performanceOptimizer.getCache(cacheKey);
    
    if (!metadata) {
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      const [fileMetadata] = await file.getMetadata();
      
      metadata = {
        size: fileMetadata.size,
        contentType: fileMetadata.contentType,
        timeCreated: fileMetadata.timeCreated,
        updated: fileMetadata.updated
      };
      
      // Cache for 1 hour
      performanceOptimizer.setCache(cacheKey, metadata, 60 * 60 * 1000);
    }
    
    return metadata;
  }
};

/**
 * Cleanup utilities
 */
const cleanupUtilities = {
  /**
   * Clean expired cache entries periodically
   */
  startCacheCleanup(intervalMs = 5 * 60 * 1000) { // 5 minutes
    setInterval(() => {
      performanceOptimizer.clearExpiredCache();
      console.log('Cache cleanup completed. Current cache size:', performanceOptimizer.cache.size);
    }, intervalMs);
  },

  /**
   * Clean old email tracking records
   */
  async cleanOldEmailTracking(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const db = admin.firestore();
    const snapshot = await db.collection('emailTracking')
      .where('createdAt', '<', cutoffDate)
      .limit(100) // Process in batches
      .get();
    
    if (snapshot.empty) {
      return { deleted: 0 };
    }
    
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return { deleted: snapshot.size };
  }
};

module.exports = {
  performanceOptimizer,
  performanceMiddleware,
  dbOptimizations,
  emailOptimizations,
  fileOptimizations,
  cleanupUtilities
};