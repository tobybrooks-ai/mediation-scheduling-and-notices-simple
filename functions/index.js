const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Import service modules
const emailService = require('./src/emailService');
const noticeService = require('./src/noticeService');
const fileService = require('./src/fileService');
const trackingService = require('./src/trackingService');

// Middleware to verify Firebase Auth token
const validateFirebaseIdToken = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    console.error('No Firebase ID token was passed');
    return res.status(403).json({ error: 'Unauthorized' });
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1];
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedIdToken;
    return next();
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    return res.status(403).json({ error: 'Unauthorized' });
  }
};

// ===== CASE FUNCTIONS =====

// Get all cases for a user
exports.getCases = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await validateFirebaseIdToken(req, res, async () => {
        const userId = req.user.uid;
        
        // Query cases where the user is the mediator
        const casesSnapshot = await db.collection('cases')
          .where('mediatorId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();
        
        const cases = [];
        casesSnapshot.forEach(doc => {
          cases.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return res.status(200).json(cases);
      });
    } catch (error) {
      console.error('Error getting cases:', error);
      return res.status(500).json({ error: 'Failed to get cases' });
    }
  });
});

// Get a single case by ID
exports.getCaseById = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await validateFirebaseIdToken(req, res, async () => {
        const userId = req.user.uid;
        const caseId = req.query.caseId;
        
        if (!caseId) {
          return res.status(400).json({ error: 'Case ID is required' });
        }
        
        const caseDoc = await db.collection('cases').doc(caseId).get();
        
        if (!caseDoc.exists) {
          return res.status(404).json({ error: 'Case not found' });
        }
        
        const caseData = caseDoc.data();
        
        // Check if user is the mediator
        if (caseData.mediatorId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        return res.status(200).json({
          id: caseDoc.id,
          ...caseData
        });
      });
    } catch (error) {
      console.error('Error getting case:', error);
      return res.status(500).json({ error: 'Failed to get case' });
    }
  });
});

// Create a new case
exports.createCase = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await validateFirebaseIdToken(req, res, async () => {
        const userId = req.user.uid;
        const caseData = req.body;
        
        if (!caseData) {
          return res.status(400).json({ error: 'Case data is required' });
        }
        
        // Add timestamps and creator
        const newCase = {
          ...caseData,
          createdBy: userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const caseRef = await db.collection('cases').add(newCase);
        
        return res.status(201).json({
          id: caseRef.id,
          ...newCase
        });
      });
    } catch (error) {
      console.error('Error creating case:', error);
      return res.status(500).json({ error: 'Failed to create case' });
    }
  });
});

// Update an existing case
exports.updateCase = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await validateFirebaseIdToken(req, res, async () => {
        const userId = req.user.uid;
        const caseId = req.query.caseId;
        const caseData = req.body;
        
        if (!caseId) {
          return res.status(400).json({ error: 'Case ID is required' });
        }
        
        if (!caseData) {
          return res.status(400).json({ error: 'Case data is required' });
        }
        
        const caseDoc = await db.collection('cases').doc(caseId).get();
        
        if (!caseDoc.exists) {
          return res.status(404).json({ error: 'Case not found' });
        }
        
        const existingCase = caseDoc.data();
        
        // Check if user is the mediator
        if (existingCase.mediatorId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        // Add updated timestamp
        const updatedCase = {
          ...caseData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('cases').doc(caseId).update(updatedCase);
        
        return res.status(200).json({
          id: caseId,
          ...updatedCase
        });
      });
    } catch (error) {
      console.error('Error updating case:', error);
      return res.status(500).json({ error: 'Failed to update case' });
    }
  });
});

// Delete a case
exports.deleteCase = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await validateFirebaseIdToken(req, res, async () => {
        const userId = req.user.uid;
        const caseId = req.query.caseId;
        
        if (!caseId) {
          return res.status(400).json({ error: 'Case ID is required' });
        }
        
        const caseDoc = await db.collection('cases').doc(caseId).get();
        
        if (!caseDoc.exists) {
          return res.status(404).json({ error: 'Case not found' });
        }
        
        const caseData = caseDoc.data();
        
        // Check if user is the mediator
        if (caseData.mediatorId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        await db.collection('cases').doc(caseId).delete();
        
        return res.status(200).json({ message: 'Case deleted successfully' });
      });
    } catch (error) {
      console.error('Error deleting case:', error);
      return res.status(500).json({ error: 'Failed to delete case' });
    }
  });
});

// ===== POLL FUNCTIONS =====

// Create a new poll
exports.createPoll = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await validateFirebaseIdToken(req, res, async () => {
        const userId = req.user.uid;
        const pollData = req.body;
        
        if (!pollData) {
          return res.status(400).json({ error: 'Poll data is required' });
        }
        
        // Add timestamps and creator
        const newPoll = {
          ...pollData,
          createdBy: userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const pollRef = await db.collection('polls').add(newPoll);
        
        return res.status(201).json({
          id: pollRef.id,
          ...newPoll
        });
      });
    } catch (error) {
      console.error('Error creating poll:', error);
      return res.status(500).json({ error: 'Failed to create poll' });
    }
  });
});

// Get poll by ID (public access for voting)
exports.getPollById = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const pollId = req.query.pollId;
      
      if (!pollId) {
        return res.status(400).json({ error: 'Poll ID is required' });
      }
      
      const pollDoc = await db.collection('polls').doc(pollId).get();
      
      if (!pollDoc.exists) {
        return res.status(404).json({ error: 'Poll not found' });
      }
      
      return res.status(200).json({
        id: pollDoc.id,
        ...pollDoc.data()
      });
    } catch (error) {
      console.error('Error getting poll:', error);
      return res.status(500).json({ error: 'Failed to get poll' });
    }
  });
});

// Submit vote (public access)
exports.submitVote = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const voteData = req.body;
      
      if (!voteData || !voteData.pollId) {
        return res.status(400).json({ error: 'Vote data with poll ID is required' });
      }
      
      // Add timestamp
      const newVote = {
        ...voteData,
        votedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const voteRef = await db.collection('polls').doc(voteData.pollId).collection('votes').add(newVote);
      
      return res.status(201).json({
        id: voteRef.id,
        ...newVote
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      return res.status(500).json({ error: 'Failed to submit vote' });
    }
  });
});

// ===== EMAIL FUNCTIONS =====

// Send poll invitation emails
exports.sendPollInvitations = emailService.sendPollInvitations;

// Send mediation notice emails
exports.sendMediationNotices = noticeService.sendMediationNotices;

// Track email opens
exports.trackEmailOpen = trackingService.trackEmailOpen;

// ===== FILE FUNCTIONS =====

// Get upload URL for PDF files
exports.getUploadUrl = fileService.getUploadUrl;

// Process uploaded file
exports.processUploadedFile = fileService.processUploadedFile;

// ===== NOTICE FUNCTIONS =====

// Create mediation notice
exports.createNotice = noticeService.createNotice;

// Get notices for a case
exports.getNoticesForCase = noticeService.getNoticesForCase;

// Update notice
exports.updateNotice = noticeService.updateNotice;

// Delete notice
exports.deleteNotice = noticeService.deleteNotice;