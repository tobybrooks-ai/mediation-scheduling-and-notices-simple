const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const nodemailer = require('nodemailer');

const db = admin.firestore();

// SMTP2Go configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: 'mail.smtp2go.com',
    port: 587,
    secure: false,
    auth: {
      user: functions.config().smtp2go?.username || process.env.SMTP2GO_USERNAME,
      pass: functions.config().smtp2go?.password || process.env.SMTP2GO_PASSWORD
    }
  });
};

/**
 * Generate mediation notice email HTML
 */
const generateMediationNoticeHTML = (notice, participant, baseUrl) => {
  const trackingUrl = `${baseUrl}/api/track-email-open?type=mediation_notice&noticeId=${notice.id}&email=${encodeURIComponent(participant.email)}`;
  
  const formatDateTime = (date, time) => {
    try {
      const dateObj = new Date(date);
      const dateStr = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Convert 24-hour time to 12-hour format
      const [hours, minutes] = time.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      const timeStr = `${hour12}:${minutes} ${ampm}`;
      
      return `${dateStr} at ${timeStr}`;
    } catch (error) {
      return 'Date and time to be confirmed';
    }
  };
  
  const getNoticeTypeMessage = (type) => {
    switch (type) {
      case 'scheduled':
        return 'Your mediation has been scheduled.';
      case 'rescheduled':
        return 'Your mediation has been rescheduled.';
      case 'cancelled':
        return 'Your mediation has been cancelled.';
      case 'reminder':
        return 'This is a reminder about your upcoming mediation.';
      default:
        return 'Mediation notice.';
    }
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mediation Notice</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .notice-info { background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
        .case-info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .important { background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ffc107; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        .attachment-notice { background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #28a745; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Official Mediation Notice</h1>
          <p>${getNoticeTypeMessage(notice.noticeType)}</p>
        </div>
        
        <div class="content">
          <div class="case-info">
            <h3>Case Information</h3>
            <p><strong>Case:</strong> ${notice.caseName || 'N/A'}</p>
            <p><strong>Case Number:</strong> ${notice.caseNumber || 'N/A'}</p>
            <p><strong>Mediator:</strong> ${notice.mediatorName || 'N/A'}</p>
          </div>
          
          ${notice.noticeType !== 'cancelled' ? `
          <div class="notice-info">
            <h3>Mediation Details</h3>
            <p><strong>Date & Time:</strong> ${formatDateTime(notice.mediationDate, notice.mediationTime)}</p>
            <p><strong>Location:</strong> ${notice.location || 'To be confirmed'}</p>
          </div>
          ` : `
          <div class="important">
            <h3>Cancellation Notice</h3>
            <p>This mediation has been cancelled. You will be contacted if it is rescheduled.</p>
          </div>
          `}
          
          ${notice.pdfFileName ? `
          <div class="attachment-notice">
            <h4>📎 Attachment</h4>
            <p>This email includes an official mediation notice document: <strong>${notice.pdfFileName}</strong></p>
            <p>Please review the attached document for complete details and instructions.</p>
          </div>
          ` : ''}
          
          <div class="important">
            <h4>Important Instructions</h4>
            <ul>
              <li>Please arrive 15 minutes before the scheduled time</li>
              <li>Bring a valid photo ID</li>
              <li>Bring any relevant documents related to your case</li>
              <li>Contact your mediator if you have any questions</li>
              ${notice.noticeType !== 'cancelled' ? '<li>If you cannot attend, notify your mediator immediately</li>' : ''}
            </ul>
          </div>
          
          ${notice.notes ? `
          <div class="case-info">
            <h4>Additional Notes</h4>
            <p>${notice.notes}</p>
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>This is an official notice from the Mediation Scheduling System.</p>
          <p>If you have questions, please contact your mediator directly.</p>
          <p><strong>Notice sent:</strong> ${new Date().toLocaleString()}</p>
          <img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="">
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send mediation notice emails
 */
const sendMediationNotices = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { noticeId, baseUrl } = req.body;
      
      if (!noticeId) {
        return res.status(400).json({ error: 'Notice ID is required' });
      }
      
      // Get notice data
      const noticeDoc = await db.collection('notices').doc(noticeId).get();
      if (!noticeDoc.exists) {
        return res.status(404).json({ error: 'Notice not found' });
      }
      
      const notice = { id: noticeDoc.id, ...noticeDoc.data() };
      
      if (!notice.participants || notice.participants.length === 0) {
        return res.status(400).json({ error: 'No participants found in notice' });
      }
      
      const transporter = createTransporter();
      const results = [];
      
      // Prepare attachment if PDF is available
      let attachments = [];
      if (notice.pdfUrl && notice.pdfFileName) {
        try {
          // Download PDF from Firebase Storage
          const bucket = admin.storage().bucket();
          const file = bucket.file(notice.pdfStoragePath);
          const [fileBuffer] = await file.download();
          
          attachments = [{
            filename: notice.pdfFileName,
            content: fileBuffer,
            contentType: 'application/pdf'
          }];
        } catch (error) {
          console.error('Error downloading PDF attachment:', error);
          // Continue without attachment but log the error
        }
      }
      
      // Send email to each participant
      for (const participant of notice.participants) {
        try {
          const emailHTML = generateMediationNoticeHTML(notice, participant, baseUrl || 'http://localhost:3000');
          
          const mailOptions = {
            from: functions.config().smtp2go?.from_email || 'noreply@mediation-scheduling.com',
            to: participant.email,
            subject: `Mediation Notice - ${notice.caseName || notice.caseNumber}`,
            html: emailHTML,
            attachments: attachments
          };
          
          const info = await transporter.sendMail(mailOptions);
          
          // Create email tracking record
          const trackingData = {
            type: 'mediation_notice',
            noticeId: noticeId,
            caseId: notice.caseId,
            participantEmail: participant.email,
            participantName: participant.name || '',
            emailId: info.messageId,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'sent',
            emailSubject: mailOptions.subject,
            hasAttachment: attachments.length > 0,
            attachmentName: notice.pdfFileName || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          await db.collection('emailTracking').add(trackingData);
          
          results.push({
            email: participant.email,
            status: 'sent',
            messageId: info.messageId,
            hasAttachment: attachments.length > 0
          });
          
        } catch (error) {
          console.error(`Error sending notice email to ${participant.email}:`, error);
          
          // Create failed tracking record
          const trackingData = {
            type: 'mediation_notice',
            noticeId: noticeId,
            caseId: notice.caseId,
            participantEmail: participant.email,
            participantName: participant.name || '',
            emailId: '',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'failed',
            emailSubject: `Mediation Notice - ${notice.caseName || notice.caseNumber}`,
            hasAttachment: attachments.length > 0,
            attachmentName: notice.pdfFileName || null,
            errorMessage: error.message,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          await db.collection('emailTracking').add(trackingData);
          
          results.push({
            email: participant.email,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      // Update notice with email statistics and status
      const sentCount = results.filter(r => r.status === 'sent').length;
      const failedCount = results.filter(r => r.status === 'failed').length;
      
      await db.collection('notices').doc(noticeId).update({
        emailsSent: sentCount,
        emailsDelivered: sentCount, // Will be updated by delivery webhooks
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: sentCount > 0 ? 'sent' : 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.status(200).json({
        success: true,
        totalParticipants: notice.participants.length,
        emailsSent: sentCount,
        emailsFailed: failedCount,
        hasAttachment: attachments.length > 0,
        attachmentName: notice.pdfFileName || null,
        results: results
      });
      
    } catch (error) {
      console.error('Error sending mediation notices:', error);
      return res.status(500).json({ error: 'Failed to send mediation notices' });
    }
  });
});

/**
 * Create a new notice
 */
const createNotice = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate Firebase Auth token
      if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const idToken = req.headers.authorization.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
      
      const noticeData = req.body;
      
      if (!noticeData) {
        return res.status(400).json({ error: 'Notice data is required' });
      }
      
      // Add timestamps and creator
      const newNotice = {
        ...noticeData,
        createdBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const noticeRef = await db.collection('notices').add(newNotice);
      
      return res.status(201).json({
        id: noticeRef.id,
        ...newNotice
      });
      
    } catch (error) {
      console.error('Error creating notice:', error);
      return res.status(500).json({ error: 'Failed to create notice' });
    }
  });
});

/**
 * Get notices for a case
 */
const getNoticesForCase = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const caseId = req.query.caseId;
      
      if (!caseId) {
        return res.status(400).json({ error: 'Case ID is required' });
      }
      
      const noticesSnapshot = await db.collection('notices')
        .where('caseId', '==', caseId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const notices = [];
      noticesSnapshot.forEach(doc => {
        notices.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return res.status(200).json(notices);
      
    } catch (error) {
      console.error('Error getting notices for case:', error);
      return res.status(500).json({ error: 'Failed to get notices' });
    }
  });
});

/**
 * Update a notice
 */
const updateNotice = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate Firebase Auth token
      if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const idToken = req.headers.authorization.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
      
      const noticeId = req.query.noticeId;
      const noticeData = req.body;
      
      if (!noticeId) {
        return res.status(400).json({ error: 'Notice ID is required' });
      }
      
      if (!noticeData) {
        return res.status(400).json({ error: 'Notice data is required' });
      }
      
      // Check if notice exists and user has permission
      const noticeDoc = await db.collection('notices').doc(noticeId).get();
      if (!noticeDoc.exists) {
        return res.status(404).json({ error: 'Notice not found' });
      }
      
      const existingNotice = noticeDoc.data();
      if (existingNotice.createdBy !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Update notice
      const updatedNotice = {
        ...noticeData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('notices').doc(noticeId).update(updatedNotice);
      
      return res.status(200).json({
        id: noticeId,
        ...updatedNotice
      });
      
    } catch (error) {
      console.error('Error updating notice:', error);
      return res.status(500).json({ error: 'Failed to update notice' });
    }
  });
});

/**
 * Delete a notice
 */
const deleteNotice = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Validate Firebase Auth token
      if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const idToken = req.headers.authorization.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
      
      const noticeId = req.query.noticeId;
      
      if (!noticeId) {
        return res.status(400).json({ error: 'Notice ID is required' });
      }
      
      // Check if notice exists and user has permission
      const noticeDoc = await db.collection('notices').doc(noticeId).get();
      if (!noticeDoc.exists) {
        return res.status(404).json({ error: 'Notice not found' });
      }
      
      const existingNotice = noticeDoc.data();
      if (existingNotice.createdBy !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Delete associated PDF file if exists
      if (existingNotice.pdfStoragePath) {
        try {
          const bucket = admin.storage().bucket();
          const file = bucket.file(existingNotice.pdfStoragePath);
          await file.delete();
        } catch (error) {
          console.error('Error deleting PDF file:', error);
          // Continue with notice deletion even if file deletion fails
        }
      }
      
      // Delete notice
      await db.collection('notices').doc(noticeId).delete();
      
      return res.status(200).json({ message: 'Notice deleted successfully' });
      
    } catch (error) {
      console.error('Error deleting notice:', error);
      return res.status(500).json({ error: 'Failed to delete notice' });
    }
  });
});

module.exports = {
  sendMediationNotices,
  createNotice,
  getNoticesForCase,
  updateNotice,
  deleteNotice
};