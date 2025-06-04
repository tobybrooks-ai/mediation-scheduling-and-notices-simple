const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const db = admin.firestore();

// SMTP2Go API configuration
const SMTP2GO_API_URL = 'https://api.smtp2go.com/v3';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Get SMTP2Go API key from environment
 */
const getApiKey = () => {
  const apiKey = functions.config().smtp2go?.api_key || process.env.SMTP2GO_API_KEY;
  
  if (!apiKey) {
    console.warn('SMTP2Go API key is not configured. Please set SMTP2GO_API_KEY environment variable.');
    throw new Error('SMTP2Go API key is not configured');
  }
  
  return apiKey;
};

/**
 * Get sender email configuration
 */
const getSenderConfig = () => {
  return {
    name: functions.config().smtp2go?.sender_name || process.env.SMTP2GO_SENDER_NAME || 'Mediation Platform',
    email: functions.config().smtp2go?.sender_email || process.env.SMTP2GO_SENDER_EMAIL || 'noreply@mediationplatform.com'
  };
};

/**
 * Send email via SMTP2Go API with retry logic
 */
const sendEmailWithRetry = async (emailData, retryCount = 0) => {
  try {
    const apiKey = getApiKey();
    
    const response = await fetch(`${SMTP2GO_API_URL}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        ...emailData
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`SMTP2Go API error: ${response.status} - ${result.data?.error || response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Email send attempt ${retryCount + 1} failed:`, error.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return sendEmailWithRetry(emailData, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * Store email tracking information
 */
const storeEmailTracking = async (trackingData) => {
  try {
    const trackingId = uuidv4();
    await db.collection('emailTracking').doc(trackingId).set({
      ...trackingData,
      id: trackingId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return trackingId;
  } catch (error) {
    console.error('Error storing email tracking:', error);
    throw error;
  }
};

/**
 * Generate voting token for poll emails
 */
const generateVotingToken = () => {
  return uuidv4();
};

/**
 * Store voting token
 */
const storeVotingToken = async (pollId, participantEmail, token) => {
  try {
    const tokenId = `${pollId}_${participantEmail.replace(/[.@]/g, '_')}`;
    await db.collection('pollVotingTokens').doc(tokenId).set({
      pollId,
      participantEmail,
      token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      )
    });
  } catch (error) {
    console.error('Error storing voting token:', error);
    throw error;
  }
};

/**
 * Generate poll invitation email HTML
 */
const generatePollInvitationHTML = (poll, participant, votingToken, baseUrl) => {
  const participantName = participant.name || participant.email.split('@')[0];
  const senderConfig = getSenderConfig();
  
  // Generate voting options HTML
  const timeOptions = poll.timeOptions || poll.options || [];
  const optionsHtml = timeOptions.map((option, index) => {
    // Handle different date formats (Firestore timestamp or Date string)
    let startTime;
    if (option.startTime && typeof option.startTime.toDate === 'function') {
      startTime = option.startTime.toDate();
    } else if (option.startTime) {
      startTime = new Date(option.startTime);
    } else if (option.date && option.time) {
      startTime = new Date(`${option.date}T${option.time}`);
    } else {
      startTime = new Date();
    }
    
    const formattedDate = startTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = startTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
    
    const optionId = option.id || `option_${index}`;
    
    return `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin-top: 0; margin-bottom: 10px; color: #2d3748;">${formattedDate}</h3>
        <p style="margin-top: 0; margin-bottom: 15px; color: #4a5568;">${formattedTime}${option.duration ? ` - Duration: ${option.duration} minutes` : ''}</p>
        
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          <label style="display: inline-flex; align-items: center; padding: 8px 16px; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer;">
            <input type="radio" name="vote_${optionId}" value="yes" style="margin-right: 8px;">
            <span style="font-weight: 500; color: #2d3748;">Yes</span>
          </label>
          
          <label style="display: inline-flex; align-items: center; padding: 8px 16px; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer;">
            <input type="radio" name="vote_${optionId}" value="if_need_be" style="margin-right: 8px;">
            <span style="font-weight: 500; color: #2d3748;">If Need Be</span>
          </label>
          
          <label style="display: inline-flex; align-items: center; padding: 8px 16px; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer;">
            <input type="radio" name="vote_${optionId}" value="no" style="margin-right: 8px;">
            <span style="font-weight: 500; color: #2d3748;">No</span>
          </label>
        </div>
      </div>
    `;
  }).join('');
  
  const appLink = `${baseUrl}/poll/${poll.id}?email=${encodeURIComponent(participant.email)}&token=${votingToken}`;
  const trackingPixel = `<img src="${baseUrl}/api/track-email-open?pollId=${poll.id}&email=${encodeURIComponent(participant.email)}&token=${votingToken}" width="1" height="1" alt="" style="display:none;">`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vote on Scheduling Options</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h1 style="margin-top: 0; color: #2d3748; font-size: 24px;">Please Vote on Scheduling Options</h1>
        <p style="margin-bottom: 20px; color: #4a5568;">Hello ${participantName},</p>
        <p style="margin-bottom: 20px; color: #4a5568;">You've been invited to vote on scheduling options for:</p>
        <div style="background-color: #ebf4ff; border-left: 4px solid #4299e1; padding: 15px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; margin-bottom: 10px; color: #2b6cb0;">${poll.title}</h2>
          <p style="margin: 0; color: #4a5568;">${poll.description || ''}</p>
          ${poll.location ? `<p style="margin-top: 10px; margin-bottom: 0; color: #4a5568;"><strong>Location:</strong> ${poll.location}</p>` : ''}
        </div>
        
        <div style="margin-top: 30px;">
          <h2 style="color: #2d3748; font-size: 20px; margin-bottom: 15px;">Please indicate your availability for each option:</h2>
          
          <form action="${baseUrl}/api/submit-email-vote" method="post">
            <input type="hidden" name="pollId" value="${poll.id}">
            <input type="hidden" name="email" value="${participant.email}">
            <input type="hidden" name="token" value="${votingToken}">
            <input type="hidden" name="source" value="email_form">
            
            ${optionsHtml}
            
            <div style="margin-top: 30px; margin-bottom: 20px;">
              <button type="submit" style="padding: 12px 24px; background-color: #4299e1; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
                Submit My Votes
              </button>
            </div>
          </form>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="margin-bottom: 15px;">Prefer to vote in the app?</p>
            <a href="${appLink}" style="display: inline-block; padding: 10px 20px; background-color: #edf2f7; color: #4a5568; text-decoration: none; border-radius: 4px; font-weight: 500;">
              Open in App
            </a>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
        <p>This is an automated message from ${senderConfig.name}.</p>
      </div>
      
      ${trackingPixel}
    </body>
    </html>
  `;
};

/**
 * Send poll invitation email
 */
exports.sendPollInvitation = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { pollId, participantEmail, baseUrl } = data;
    
    if (!pollId || !participantEmail || !baseUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    // Get poll data
    const pollDoc = await db.collection('polls').doc(pollId).get();
    if (!pollDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Poll not found');
    }

    const poll = { id: pollDoc.id, ...pollDoc.data() };
    
    // Find participant
    const participant = poll.participants?.find(p => p.email === participantEmail);
    if (!participant) {
      throw new functions.https.HttpsError('not-found', 'Participant not found in poll');
    }

    // Generate voting token
    const votingToken = generateVotingToken();
    await storeVotingToken(pollId, participantEmail, votingToken);

    // Generate email content
    const htmlBody = generatePollInvitationHTML(poll, participant, votingToken, baseUrl);
    const senderConfig = getSenderConfig();

    // Prepare email data
    const emailData = {
      sender: `${senderConfig.name} <${senderConfig.email}>`,
      to: [`${participant.name || participant.email} <${participant.email}>`],
      subject: `Vote on Scheduling Options: ${poll.title}`,
      html_body: htmlBody,
      custom_headers: [
        {
          header: 'X-Poll-ID',
          value: pollId
        },
        {
          header: 'X-Participant-Email',
          value: participantEmail
        }
      ]
    };

    // Send email
    const response = await sendEmailWithRetry(emailData);

    // Store tracking information
    const trackingId = await storeEmailTracking({
      type: 'poll_invitation',
      pollId,
      participantEmail,
      emailId: response.data?.email_id,
      status: 'sent',
      sentBy: context.auth.uid
    });

    return {
      success: true,
      emailId: response.data?.email_id,
      trackingId,
      participant: participantEmail
    };
  } catch (error) {
    console.error('Error sending poll invitation:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Send poll invitations to all participants
 */
exports.sendPollInvitations = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { pollId, baseUrl } = data;
    
    if (!pollId || !baseUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    // Get poll data
    const pollDoc = await db.collection('polls').doc(pollId).get();
    if (!pollDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Poll not found');
    }

    const poll = { id: pollDoc.id, ...pollDoc.data() };
    
    if (!poll.participants || poll.participants.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'No participants found in poll');
    }

    const results = [];
    const errors = [];

    // Send emails to each participant
    for (const participant of poll.participants) {
      if (!participant.email) {
        errors.push({
          participant: participant.name || 'Unknown',
          error: 'No email address'
        });
        continue;
      }

      try {
        const result = await exports.sendPollInvitation.handler({
          pollId,
          participantEmail: participant.email,
          baseUrl
        }, context);
        
        results.push(result);
      } catch (error) {
        console.error(`Error sending email to ${participant.email}:`, error);
        errors.push({
          participant: participant.email,
          error: error.message
        });
      }
    }

    return {
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    };
  } catch (error) {
    console.error('Error sending poll invitations:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Send mediation notice email
 */
exports.sendMediationNotice = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { noticeId, participantEmail } = data;
    
    if (!noticeId || !participantEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    // Get notice data
    const noticeDoc = await db.collection('notices').doc(noticeId).get();
    if (!noticeDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Notice not found');
    }

    const notice = { id: noticeDoc.id, ...noticeDoc.data() };
    const senderConfig = getSenderConfig();

    // Prepare email data
    const emailData = {
      sender: `${senderConfig.name} <${senderConfig.email}>`,
      to: [participantEmail],
      subject: notice.subject,
      html_body: notice.content,
      attachments: notice.attachments || []
    };

    // Send email
    const response = await sendEmailWithRetry(emailData);

    // Store tracking information
    const trackingId = await storeEmailTracking({
      type: 'mediation_notice',
      noticeId,
      participantEmail,
      emailId: response.data?.email_id,
      status: 'sent',
      sentBy: context.auth.uid
    });

    return {
      success: true,
      emailId: response.data?.email_id,
      trackingId,
      participant: participantEmail
    };
  } catch (error) {
    console.error('Error sending mediation notice:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Test email configuration
 */
exports.testEmailConfig = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { testEmail } = data;
    
    if (!testEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'Test email address is required');
    }

    const senderConfig = getSenderConfig();

    // Prepare test email data
    const emailData = {
      sender: `${senderConfig.name} <${senderConfig.email}>`,
      to: [testEmail],
      subject: 'Email Configuration Test',
      html_body: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify that the email configuration is working correctly.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>From: ${senderConfig.name} &lt;${senderConfig.email}&gt;</p>
      `
    };

    // Send email
    const response = await sendEmailWithRetry(emailData);

    return {
      success: true,
      emailId: response.data?.email_id,
      message: 'Test email sent successfully'
    };
  } catch (error) {
    console.error('Error testing email configuration:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Send poll invitations to all participants (internal function for poll service)
 */
const sendPollInvitationsToParticipants = async (pollId, pollData) => {
  try {
    const baseUrl = functions.config().app?.base_url || process.env.APP_BASE_URL || 'http://localhost:3000';
    
    if (!pollData.participants || pollData.participants.length === 0) {
      throw new Error('No participants found in poll');
    }

    const results = [];
    const errors = [];

    // Send emails to each participant
    for (const participant of pollData.participants) {
      if (!participant.email) {
        errors.push({
          participant: participant.name || 'Unknown',
          error: 'No email address'
        });
        continue;
      }

      try {
        // Generate voting token
        const votingToken = generateVotingToken();
        await storeVotingToken(pollId, participant.email, votingToken);

        // Generate email content
        const htmlBody = generatePollInvitationHTML(
          { id: pollId, ...pollData }, 
          participant, 
          votingToken, 
          baseUrl
        );
        const senderConfig = getSenderConfig();

        // Prepare email data
        const emailData = {
          sender: `${senderConfig.name} <${senderConfig.email}>`,
          to: [`${participant.name || participant.email} <${participant.email}>`],
          subject: `Vote on Scheduling Options: ${pollData.title}`,
          html_body: htmlBody,
          custom_headers: [
            {
              header: 'X-Poll-ID',
              value: pollId
            },
            {
              header: 'X-Participant-Email',
              value: participant.email
            }
          ]
        };

        // Send email
        const response = await sendEmailWithRetry(emailData);

        // Store tracking information
        const trackingId = await storeEmailTracking({
          type: 'poll_invitation',
          pollId,
          participantEmail: participant.email,
          emailId: response.data?.email_id,
          status: 'sent',
          sentBy: pollData.createdBy
        });

        results.push({
          success: true,
          emailId: response.data?.email_id,
          trackingId,
          participant: participant.email
        });
      } catch (error) {
        console.error(`Error sending email to ${participant.email}:`, error);
        errors.push({
          participant: participant.email,
          error: error.message
        });
      }
    }

    return {
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    };
  } catch (error) {
    console.error('Error sending poll invitations to participants:', error);
    throw error;
  }
};

module.exports = {
  sendPollInvitationsToParticipants
};