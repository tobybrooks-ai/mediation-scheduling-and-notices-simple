const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

const storage = admin.storage();
const db = admin.firestore();

/**
 * Generate a signed URL for PDF upload
 */
const getUploadUrl = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate Firebase Auth token
      if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const idToken = req.headers.authorization.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
      
      const { caseId, fileName, fileType } = req.query;
      
      if (!caseId) {
        return res.status(400).json({ error: 'Case ID is required' });
      }
      
      if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
      }
      
      // Validate file type (only PDFs allowed)
      if (fileType !== 'application/pdf') {
        return res.status(400).json({ error: 'Only PDF files are allowed' });
      }
      
      // Check if user has access to the case
      const caseDoc = await db.collection('cases').doc(caseId).get();
      if (!caseDoc.exists) {
        return res.status(404).json({ error: 'Case not found' });
      }
      
      const caseData = caseDoc.data();
      if (caseData.mediatorId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `notices/${caseId}/${timestamp}_${sanitizedFileName}`;
      
      // Create signed URL for upload
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      
      const [signedUrl] = await file.getSignedUrl({
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: 'application/pdf',
        conditions: [
          ['content-length-range', 0, 10 * 1024 * 1024] // 10MB max
        ]
      });
      
      return res.status(200).json({
        signedUrl,
        filePath,
        fileName: sanitizedFileName,
        maxSize: 10 * 1024 * 1024 // 10MB
      });
      
    } catch (error) {
      console.error('Error generating upload URL:', error);
      return res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });
});

/**
 * Process uploaded file and generate download URL
 */
const processUploadedFile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate Firebase Auth token
      if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const idToken = req.headers.authorization.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
      
      const { filePath, caseId } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      if (!caseId) {
        return res.status(400).json({ error: 'Case ID is required' });
      }
      
      // Check if user has access to the case
      const caseDoc = await db.collection('cases').doc(caseId).get();
      if (!caseDoc.exists) {
        return res.status(404).json({ error: 'Case not found' });
      }
      
      const caseData = caseDoc.data();
      if (caseData.mediatorId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Check if file exists
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      const [fileExists] = await file.exists();
      
      if (!fileExists) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Validate file type and size
      if (metadata.contentType !== 'application/pdf') {
        await file.delete(); // Clean up invalid file
        return res.status(400).json({ error: 'Invalid file type. Only PDF files are allowed.' });
      }
      
      if (metadata.size > 10 * 1024 * 1024) { // 10MB
        await file.delete(); // Clean up oversized file
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      
      // Generate download URL (long-lived)
      const [downloadUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Far future expiration
      });
      
      // Extract file name from path
      const fileName = filePath.split('/').pop();
      
      return res.status(200).json({
        success: true,
        filePath,
        fileName,
        downloadUrl,
        fileSize: metadata.size,
        contentType: metadata.contentType,
        uploadedAt: metadata.timeCreated
      });
      
    } catch (error) {
      console.error('Error processing uploaded file:', error);
      return res.status(500).json({ error: 'Failed to process uploaded file' });
    }
  });
});

/**
 * Delete a file from storage
 */
const deleteFile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate Firebase Auth token
      if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const idToken = req.headers.authorization.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
      
      const { filePath, caseId } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      if (!caseId) {
        return res.status(400).json({ error: 'Case ID is required' });
      }
      
      // Check if user has access to the case
      const caseDoc = await db.collection('cases').doc(caseId).get();
      if (!caseDoc.exists) {
        return res.status(404).json({ error: 'Case not found' });
      }
      
      const caseData = caseDoc.data();
      if (caseData.mediatorId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Delete file from storage
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      const [fileExists] = await file.exists();
      
      if (fileExists) {
        await file.delete();
      }
      
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting file:', error);
      return res.status(500).json({ error: 'Failed to delete file' });
    }
  });
});

/**
 * Get file metadata and download URL
 */
const getFileInfo = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate Firebase Auth token
      if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const idToken = req.headers.authorization.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
      
      const { filePath, caseId } = req.query;
      
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      if (!caseId) {
        return res.status(400).json({ error: 'Case ID is required' });
      }
      
      // Check if user has access to the case
      const caseDoc = await db.collection('cases').doc(caseId).get();
      if (!caseDoc.exists) {
        return res.status(404).json({ error: 'Case not found' });
      }
      
      const caseData = caseDoc.data();
      if (caseData.mediatorId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get file info
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      const [fileExists] = await file.exists();
      
      if (!fileExists) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Generate download URL
      const [downloadUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000 // 1 hour
      });
      
      // Extract file name from path
      const fileName = filePath.split('/').pop();
      
      return res.status(200).json({
        filePath,
        fileName,
        downloadUrl,
        fileSize: metadata.size,
        contentType: metadata.contentType,
        uploadedAt: metadata.timeCreated,
        updatedAt: metadata.updated
      });
      
    } catch (error) {
      console.error('Error getting file info:', error);
      return res.status(500).json({ error: 'Failed to get file info' });
    }
  });
});

module.exports = {
  getUploadUrl,
  processUploadedFile,
  deleteFile,
  getFileInfo
};