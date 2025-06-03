const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

const db = admin.firestore();

/**
 * Validate voting token
 */
const validateVotingToken = async (pollId, email, token) => {
  try {
    const tokenDoc = await db.collection('pollVotingTokens')
      .doc(`${pollId}_${email.replace(/[.@]/g, '_')}`)
      .get();
    
    if (!tokenDoc.exists) {
      return false;
    }
    
    const tokenData = tokenDoc.data();
    
    // Check if token matches
    if (tokenData.token !== token) {
      return false;
    }
    
    // Check if token is expired
    if (tokenData.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating voting token:', error);
    return false;
  }
};

/**
 * Track email opens via pixel tracking
 */
const trackEmailOpen = functions.https.onRequest(async (req, res) => {
  try {
    const { pollId, email, token } = req.query;
    
    // Always return a 1x1 transparent GIF
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Validate required fields
    if (!pollId || !email) {
      return res.send(transparentGif);
    }
    
    // Validate token if provided
    if (token) {
      const isValidToken = await validateVotingToken(pollId, email, token);
      if (!isValidToken) {
        return res.send(transparentGif);
      }
    }
    
    // Update email tracking info
    const trackingQuery = await db.collection('emailTracking')
      .where('pollId', '==', pollId)
      .where('participantEmail', '==', email)
      .where('type', '==', 'poll_invitation')
      .limit(1)
      .get();
    
    if (!trackingQuery.empty) {
      const trackingDoc = trackingQuery.docs[0];
      const trackingData = trackingDoc.data();
      
      // Only update if not already opened
      if (!trackingData.opened) {
        await trackingDoc.ref.update({
          opened: true,
          openedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update poll statistics
        await updatePollEmailStats(pollId);
      }
    }
    
    return res.send(transparentGif);
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Return transparent GIF even on error
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    return res.send(transparentGif);
  }
});

/**
 * Handle email vote submission
 */
const submitEmailVote = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
      }
      
      const { pollId, email, token, source } = req.body;
      
      // Validate required fields
      if (!pollId || !email || !token) {
        return res.status(400).send('Missing required fields');
      }
      
      // Validate token
      const isValidToken = await validateVotingToken(pollId, email, token);
      if (!isValidToken) {
        return res.status(403).send('Invalid or expired token');
      }
      
      // Get the poll
      const pollDoc = await db.collection('polls').doc(pollId).get();
      if (!pollDoc.exists) {
        return res.status(404).send('Poll not found');
      }
      
      const poll = pollDoc.data();
      
      // Check if poll is still active
      if (poll.status !== 'active') {
        return res.status(400).send('This poll is no longer active');
      }
      
      // Process votes
      const votes = [];
      
      // Extract option IDs and votes from form data
      for (const key in req.body) {
        if (key.startsWith('vote_')) {
          const optionId = key.replace('vote_', '');
          const voteType = req.body[key];
          
          // Validate vote type
          if (!['yes', 'if_need_be', 'no'].includes(voteType)) {
            continue;
          }
          
          votes.push({
            pollId,
            optionId,
            participantEmail: email,
            type: voteType,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            source: source || 'email_form'
          });
        }
      }
      
      if (votes.length === 0) {
        return res.status(400).send('No valid votes submitted');
      }
      
      // Delete existing votes for this participant
      const existingVotesSnapshot = await db.collection('votes')
        .where('pollId', '==', pollId)
        .where('participantEmail', '==', email)
        .get();
      
      const batch = db.batch();
      
      existingVotesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Add new votes
      for (const vote of votes) {
        const voteRef = db.collection('votes').doc();
        batch.set(voteRef, vote);
      }
      
      await batch.commit();
      
      // Update email tracking info
      const trackingQuery = await db.collection('emailTracking')
        .where('pollId', '==', pollId)
        .where('participantEmail', '==', email)
        .where('type', '==', 'poll_invitation')
        .limit(1)
        .get();
      
      if (!trackingQuery.empty) {
        const trackingDoc = trackingQuery.docs[0];
        await trackingDoc.ref.update({
          votedViaEmail: true,
          votedViaEmailAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Redirect to thank you page
      const baseUrl = req.headers.origin || req.headers.referer || 'http://localhost:3000';
      res.redirect(303, `${baseUrl}/vote-success?pollId=${pollId}`);
    } catch (error) {
      console.error('Error handling email vote submission:', error);
      res.status(500).send('Internal Server Error');
    }
  });
});

/**
 * Update poll email statistics
 */
const updatePollEmailStats = async (pollId) => {
  try {
    const trackingSnapshot = await db.collection('emailTracking')
      .where('pollId', '==', pollId)
      .get();
    
    let emailsOpened = 0;
    trackingSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'opened') {
        emailsOpened++;
      }
    });
    
    await db.collection('polls').doc(pollId).update({
      emailsOpened: emailsOpened,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error updating poll email stats:', error);
  }
};

/**
 * Update notice email statistics
 */
const updateNoticeEmailStats = async (noticeId) => {
  try {
    const trackingSnapshot = await db.collection('emailTracking')
      .where('noticeId', '==', noticeId)
      .get();
    
    let emailsOpened = 0;
    trackingSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'opened') {
        emailsOpened++;
      }
    });
    
    await db.collection('notices').doc(noticeId).update({
      emailsOpened: emailsOpened,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error updating notice email stats:', error);
  }
};

/**
 * Get email tracking statistics for a case
 */
const getEmailTrackingStats = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { caseId } = req.query;
      
      if (!caseId) {
        return res.status(400).json({ error: 'Case ID is required' });
      }
      
      // Get all email tracking records for the case
      const trackingSnapshot = await db.collection('emailTracking')
        .where('caseId', '==', caseId)
        .orderBy('sentAt', 'desc')
        .get();
      
      const trackingRecords = [];
      trackingSnapshot.forEach(doc => {
        trackingRecords.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Calculate statistics
      const stats = {
        total: trackingRecords.length,
        sent: trackingRecords.filter(r => r.status === 'sent').length,
        delivered: trackingRecords.filter(r => r.status === 'delivered' || r.status === 'opened').length,
        opened: trackingRecords.filter(r => r.status === 'opened').length,
        failed: trackingRecords.filter(r => r.status === 'failed').length,
        byType: {}
      };
      
      // Group by email type
      const typeGroups = trackingRecords.reduce((groups, record) => {
        const type = record.type;
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(record);
        return groups;
      }, {});
      
      // Calculate stats by type
      Object.keys(typeGroups).forEach(type => {
        const records = typeGroups[type];
        stats.byType[type] = {
          total: records.length,
          sent: records.filter(r => r.status === 'sent').length,
          delivered: records.filter(r => r.status === 'delivered' || r.status === 'opened').length,
          opened: records.filter(r => r.status === 'opened').length,
          failed: records.filter(r => r.status === 'failed').length
        };
      });
      
      // Calculate rates
      stats.deliveryRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
      stats.openRate = stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 100) : 0;
      
      return res.status(200).json({
        stats,
        records: trackingRecords
      });
      
    } catch (error) {
      console.error('Error getting email tracking stats:', error);
      return res.status(500).json({ error: 'Failed to get email tracking stats' });
    }
  });
});

/**
 * Get email tracking records for a specific poll or notice
 */
const getEmailTrackingRecords = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { pollId, noticeId, type } = req.query;
      
      if (!pollId && !noticeId) {
        return res.status(400).json({ error: 'Poll ID or Notice ID is required' });
      }
      
      let query = db.collection('emailTracking');
      
      if (pollId) {
        query = query.where('pollId', '==', pollId);
      }
      
      if (noticeId) {
        query = query.where('noticeId', '==', noticeId);
      }
      
      if (type) {
        query = query.where('type', '==', type);
      }
      
      const trackingSnapshot = await query.orderBy('sentAt', 'desc').get();
      
      const trackingRecords = [];
      trackingSnapshot.forEach(doc => {
        trackingRecords.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return res.status(200).json(trackingRecords);
      
    } catch (error) {
      console.error('Error getting email tracking records:', error);
      return res.status(500).json({ error: 'Failed to get email tracking records' });
    }
  });
});

/**
 * Retry failed email
 */
const retryFailedEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate Firebase Auth token
      if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const idToken = req.headers.authorization.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      const { trackingId } = req.body;
      
      if (!trackingId) {
        return res.status(400).json({ error: 'Tracking ID is required' });
      }
      
      // Get tracking record
      const trackingDoc = await db.collection('emailTracking').doc(trackingId).get();
      if (!trackingDoc.exists) {
        return res.status(404).json({ error: 'Tracking record not found' });
      }
      
      const trackingData = trackingDoc.data();
      
      // Check if email can be retried
      if (trackingData.status !== 'failed' || trackingData.retryCount >= 3) {
        return res.status(400).json({ error: 'Email cannot be retried' });
      }
      
      // Update retry count
      await trackingDoc.ref.update({
        retryCount: (trackingData.retryCount || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Trigger appropriate email sending function
      if (trackingData.type === 'poll_invitation' && trackingData.pollId) {
        // Trigger poll invitation resend
        return res.status(200).json({
          success: true,
          message: 'Poll invitation retry initiated',
          retryCount: (trackingData.retryCount || 0) + 1
        });
      } else if (trackingData.type === 'mediation_notice' && trackingData.noticeId) {
        // Trigger notice resend
        return res.status(200).json({
          success: true,
          message: 'Mediation notice retry initiated',
          retryCount: (trackingData.retryCount || 0) + 1
        });
      } else {
        return res.status(400).json({ error: 'Invalid email type for retry' });
      }
      
    } catch (error) {
      console.error('Error retrying failed email:', error);
      return res.status(500).json({ error: 'Failed to retry email' });
    }
  });
});

module.exports = {
  trackEmailOpen,
  submitEmailVote,
  getEmailTrackingStats,
  getEmailTrackingRecords,
  retryFailedEmail,
  updatePollEmailStats,
  updateNoticeEmailStats,
  validateVotingToken
};