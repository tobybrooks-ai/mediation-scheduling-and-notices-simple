# Deployment Guide

This guide covers deploying the Mediation Scheduling and Notices application to production.

## Prerequisites

1. **Firebase CLI** installed and authenticated
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Node.js 18+** for Cloud Functions

3. **SMTP2Go Account** for email delivery

4. **Firebase Project** with the following services enabled:
   - Authentication
   - Firestore Database
   - Cloud Functions
   - Cloud Storage
   - Hosting

## Environment Configuration

### 1. Firebase Configuration

Set up Firebase configuration using the Firebase CLI:

```bash
# Set SMTP2Go credentials
firebase functions:config:set smtp2go.username="your-smtp2go-username"
firebase functions:config:set smtp2go.password="your-smtp2go-password"
firebase functions:config:set smtp2go.from_email="noreply@yourdomain.com"
firebase functions:config:set smtp2go.from_name="Your Organization Name"

# Set application URLs
firebase functions:config:set app.frontend_url="https://your-app.web.app"
firebase functions:config:set app.backend_url="https://us-central1-your-project.cloudfunctions.net"
```

### 2. Environment Variables (Alternative)

You can also use environment variables in your deployment environment:

```bash
export SMTP2GO_USERNAME="your-username"
export SMTP2GO_PASSWORD="your-password"
export SMTP2GO_FROM_EMAIL="noreply@yourdomain.com"
export SMTP2GO_FROM_NAME="Your Organization"
export FRONTEND_URL="https://your-app.web.app"
export FIREBASE_PROJECT_ID="your-project-id"
export NODE_ENV="production"
```

## Security Rules

### Firestore Rules

Update `firestore.rules` with production-ready security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Cases - only mediators can create/edit, participants can read
    match /cases/{caseId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.mediatorId || 
         request.auth.token.email in resource.data.participants[].email);
      allow write: if request.auth != null && request.auth.uid == resource.data.mediatorId;
    }
    
    // Polls - only creators can edit, participants can read and vote
    match /polls/{pollId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }
    
    // Votes - participants can create their own votes
    match /votes/{voteId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.token.email == request.resource.data.participantEmail;
    }
    
    // Notices - only mediators can create/edit
    match /notices/{noticeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }
    
    // Email tracking - system only
    match /emailTracking/{trackingId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

### Storage Rules

Update `storage.rules` for PDF file uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Notice PDFs - only authenticated users can upload, anyone can read
    match /notices/{caseId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.contentType == 'application/pdf' &&
        request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
    
    // Health check files - system only
    match /health/{fileName} {
      allow read, write: if false; // Only Cloud Functions
    }
  }
}
```

## Database Indexes

Create `firestore.indexes.json` for optimal query performance:

```json
{
  "indexes": [
    {
      "collectionGroup": "polls",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdBy", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "caseId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "votes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "pollId", "order": "ASCENDING" },
        { "fieldPath": "participantEmail", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "emailTracking",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "sentAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "cases",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mediatorId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Deployment Steps

### 1. Pre-deployment Checks

```bash
# Install dependencies
cd functions && npm install
cd ../client && npm install

# Run tests
cd ../functions && npm test
cd ../client && npm test

# Build client
cd ../client && npm run build
```

### 2. Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 3. Post-deployment Verification

```bash
# Test health endpoints
curl https://us-central1-your-project.cloudfunctions.net/health
curl https://us-central1-your-project.cloudfunctions.net/ping

# Test frontend
curl https://your-app.web.app

# Check logs
firebase functions:log
```

## Monitoring and Maintenance

### 1. Health Monitoring

The application includes several health check endpoints:

- `/health` - Comprehensive health check
- `/ping` - Simple availability check
- `/readiness` - Kubernetes-style readiness probe
- `/liveness` - Kubernetes-style liveness probe

### 2. Performance Monitoring

Monitor these metrics:

- **Function execution time** - Should be < 5 seconds
- **Memory usage** - Should be < 512MB
- **Error rate** - Should be < 5%
- **Email delivery rate** - Should be > 95%

### 3. Log Monitoring

Key logs to monitor:

```bash
# Function logs
firebase functions:log --only=createPoll,sendPollInvitations,createNotice

# Error logs
firebase functions:log --only=error

# Performance logs
firebase functions:log | grep "Performance Metrics"
```

### 4. Database Maintenance

Regular maintenance tasks:

```bash
# Clean old email tracking records (run monthly)
# This is handled automatically by the cleanupUtilities

# Monitor database usage
firebase firestore:usage

# Check index performance
firebase firestore:indexes
```

## Scaling Considerations

### 1. Function Scaling

Cloud Functions automatically scale, but consider:

- **Concurrency limits** - Default 1000 concurrent executions
- **Memory allocation** - Increase for heavy operations
- **Timeout settings** - Adjust for long-running operations

### 2. Database Scaling

Firestore scales automatically, but optimize:

- **Query patterns** - Use indexes effectively
- **Document structure** - Avoid deep nesting
- **Batch operations** - Use for bulk updates

### 3. Storage Scaling

Cloud Storage scales automatically:

- **File organization** - Use logical folder structure
- **CDN caching** - Enabled by default
- **Access patterns** - Monitor download patterns

## Security Best Practices

### 1. Authentication

- **Firebase Auth** - Use for all user authentication
- **Token validation** - Verify tokens on all protected endpoints
- **Role-based access** - Implement proper authorization

### 2. Data Protection

- **Firestore rules** - Restrict data access appropriately
- **Input validation** - Validate all user inputs
- **SQL injection** - Not applicable (NoSQL database)

### 3. Network Security

- **HTTPS only** - Enforced by Firebase Hosting
- **CORS configuration** - Restrict to known origins
- **Rate limiting** - Implemented for production

## Troubleshooting

### Common Issues

1. **Function timeout**
   ```bash
   # Increase timeout in firebase.json
   "functions": {
     "timeout": "60s"
   }
   ```

2. **Memory errors**
   ```bash
   # Increase memory allocation
   "functions": {
     "memory": "1GB"
   }
   ```

3. **CORS errors**
   ```bash
   # Check CORS configuration in productionConfig.js
   # Ensure frontend URL is in allowed origins
   ```

4. **Email delivery failures**
   ```bash
   # Check SMTP2Go credentials
   firebase functions:config:get
   
   # Check email service logs
   firebase functions:log --only=sendPollInvitations,sendMediationNotices
   ```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
firebase functions:config:set app.debug="true"

# Deploy and check logs
firebase deploy --only functions
firebase functions:log
```

## Backup and Recovery

### 1. Database Backup

```bash
# Export Firestore data
gcloud firestore export gs://your-backup-bucket/firestore-backup

# Schedule regular backups
# Use Cloud Scheduler + Cloud Functions
```

### 2. Storage Backup

```bash
# Sync storage bucket
gsutil -m rsync -r gs://your-app.appspot.com gs://your-backup-bucket
```

### 3. Configuration Backup

```bash
# Export function configuration
firebase functions:config:get > config-backup.json

# Export security rules
firebase firestore:rules > firestore-rules-backup.txt
firebase storage:rules > storage-rules-backup.txt
```

## Performance Optimization

### 1. Function Optimization

- **Cold start reduction** - Keep functions warm with scheduled calls
- **Memory optimization** - Right-size memory allocation
- **Caching** - Use in-memory caching for frequently accessed data

### 2. Database Optimization

- **Index optimization** - Create composite indexes for complex queries
- **Query optimization** - Limit result sets and use pagination
- **Document optimization** - Keep documents under 1MB

### 3. Frontend Optimization

- **Code splitting** - Lazy load components
- **Asset optimization** - Compress images and minify code
- **CDN usage** - Firebase Hosting includes CDN

## Cost Optimization

### 1. Function Costs

- **Execution time** - Optimize function performance
- **Memory usage** - Right-size memory allocation
- **Invocation count** - Batch operations where possible

### 2. Database Costs

- **Read/write operations** - Optimize query patterns
- **Storage costs** - Clean up old data regularly
- **Network egress** - Minimize data transfer

### 3. Storage Costs

- **File lifecycle** - Implement automatic cleanup
- **Compression** - Compress files before upload
- **Access patterns** - Use appropriate storage classes

## Support and Maintenance

### 1. Monitoring Setup

- **Firebase Console** - Monitor function performance
- **Cloud Logging** - Set up log-based alerts
- **Uptime monitoring** - Use external monitoring service

### 2. Update Process

1. **Test in staging** - Always test updates in staging environment
2. **Gradual rollout** - Deploy to subset of users first
3. **Rollback plan** - Have rollback procedure ready
4. **Monitor metrics** - Watch key metrics after deployment

### 3. Documentation

- **Keep docs updated** - Update this guide with changes
- **API documentation** - Document all endpoints
- **Runbooks** - Create operational runbooks for common tasks