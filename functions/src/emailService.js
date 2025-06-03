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
 * Generate poll invitation email HTML
 */
const generatePollInvitationHTML = (poll, participant, baseUrl) => {
  const pollUrl = `${baseUrl}/poll/${poll.id}?email=${encodeURIComponent(participant.email)}`;
  const trackingUrl = `${baseUrl}/api/track-email-open?type=poll_invitation&pollId=${poll.id}&email=${encodeURIComponent(participant.email)}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mediation Scheduling Poll</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .case-info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Mediation Scheduling Poll</h1>
          <p>You have been invited to participate in scheduling a mediation session.</p>
        </div>
        
        <div class="content">
          <div class="case-info">
            <h3>Case Information</h3>
            <p><strong>Case:</strong> ${poll.caseName || 'N/A'}</p>
            <p><strong>Case Number:</strong> ${poll.caseNumber || 'N/A'}</p>
            <p><strong>Mediator:</strong> ${poll.mediatorName || 'N/A'}</p>
            ${poll.location ? `<p><strong>Location:</strong> ${poll.location}</p>` : ''}
          </div>
          
          <h3>Poll Details</h3>
          <p><strong>Title:</strong> ${poll.title}</p>
          ${poll.description ? `<p><strong>Description:</strong> ${poll.description}</p>` : ''}
          
          <p>Please click the button below to view the available time options and submit your availability:</p>
          
          <a href="${pollUrl}" class="button">Vote on Scheduling Options</a>
          
          <p><strong>Available Time Options:</strong></p>
          <ul>
            ${poll.options.map(option => `
              <li>${new Date(option.date).toLocaleDateString()} at ${option.time} (${option.duration} minutes)</li>
            `).join('')}
          </ul>
          
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>Click the link above to access the voting form</li>
            <li>For each time option, indicate if you are Available, Unavailable, or if it's your Preferred time</li>
            <li>You can add notes to explain your availability</li>
            <li>Submit your response as soon as possible</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>This is an automated message from the Mediation Scheduling System.</p>
          <p>If you have questions, please contact your mediator directly.</p>
          <img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="">
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send poll invitation emails
 */
const sendPollInvitations = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { pollId, baseUrl } = req.body;
      
      if (!pollId) {
        return res.status(400).json({ error: 'Poll ID is required' });
      }
      
      // Get poll data
      const pollDoc = await db.collection('polls').doc(pollId).get();
      if (!pollDoc.exists) {
        return res.status(404).json({ error: 'Poll not found' });
      }
      
      const poll = { id: pollDoc.id, ...pollDoc.data() };
      
      if (!poll.participants || poll.participants.length === 0) {
        return res.status(400).json({ error: 'No participants found in poll' });
      }
      
      const transporter = createTransporter();
      const results = [];
      
      // Send email to each participant
      for (const participant of poll.participants) {
        try {
          const emailHTML = generatePollInvitationHTML(poll, participant, baseUrl || 'http://localhost:3000');
          
          const mailOptions = {
            from: functions.config().smtp2go?.from_email || 'noreply@mediation-scheduling.com',
            to: participant.email,
            subject: `Mediation Scheduling Poll - ${poll.caseName || poll.caseNumber}`,
            html: emailHTML
          };
          
          const info = await transporter.sendMail(mailOptions);
          
          // Create email tracking record
          const trackingData = {
            type: 'poll_invitation',
            pollId: pollId,
            caseId: poll.caseId,
            participantEmail: participant.email,
            participantName: participant.name || '',
            emailId: info.messageId,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'sent',
            emailSubject: mailOptions.subject,
            hasAttachment: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          await db.collection('emailTracking').add(trackingData);
          
          results.push({
            email: participant.email,
            status: 'sent',
            messageId: info.messageId
          });
          
        } catch (error) {
          console.error(`Error sending email to ${participant.email}:`, error);
          
          // Create failed tracking record
          const trackingData = {
            type: 'poll_invitation',
            pollId: pollId,
            caseId: poll.caseId,
            participantEmail: participant.email,
            participantName: participant.name || '',
            emailId: '',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'failed',
            emailSubject: `Mediation Scheduling Poll - ${poll.caseName || poll.caseNumber}`,
            hasAttachment: false,
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
      
      // Update poll with email statistics
      const sentCount = results.filter(r => r.status === 'sent').length;
      const failedCount = results.filter(r => r.status === 'failed').length;
      
      await db.collection('polls').doc(pollId).update({
        emailsSent: sentCount,
        emailsDelivered: sentCount, // Will be updated by delivery webhooks
        lastEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.status(200).json({
        success: true,
        totalParticipants: poll.participants.length,
        emailsSent: sentCount,
        emailsFailed: failedCount,
        results: results
      });
      
    } catch (error) {
      console.error('Error sending poll invitations:', error);
      return res.status(500).json({ error: 'Failed to send poll invitations' });
    }
  });
});

/**
 * Test email configuration
 */
const testEmailConfig = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ error: 'Test email address is required' });
      }
      
      const transporter = createTransporter();
      
      const mailOptions = {
        from: functions.config().smtp2go?.from_email || 'noreply@mediation-scheduling.com',
        to: testEmail,
        subject: 'Email Configuration Test',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify that the email configuration is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      return res.status(200).json({
        success: true,
        messageId: info.messageId,
        message: 'Test email sent successfully'
      });
      
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return res.status(500).json({ 
        error: 'Email configuration test failed',
        details: error.message 
      });
    }
  });
});

module.exports = {
  sendPollInvitations,
  testEmailConfig
};