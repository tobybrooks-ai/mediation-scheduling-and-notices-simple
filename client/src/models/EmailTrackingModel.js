/**
 * Email Tracking Model - For tracking poll invitations and notice emails
 */

export const EmailType = {
  POLL_INVITATION: 'poll_invitation',
  MEDIATION_NOTICE: 'mediation_notice',
  REMINDER: 'reminder'
};

export const EmailStatus = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  FAILED: 'failed',
  BOUNCED: 'bounced'
};

/**
 * Email tracking data structure
 */
export const createEmailTracking = ({
  type,
  pollId = null,
  noticeId = null,
  caseId,
  participantEmail,
  participantName = '',
  emailId = '', // SMTP provider ID
  sentAt = new Date().toISOString(),
  openedAt = null,
  status = EmailStatus.SENT,
  emailSubject = '',
  hasAttachment = false,
  attachmentName = null,
  errorMessage = null,
  retryCount = 0
}) => ({
  type,
  pollId,
  noticeId,
  caseId,
  participantEmail,
  participantName,
  emailId,
  sentAt,
  openedAt,
  status,
  emailSubject,
  hasAttachment,
  attachmentName,
  errorMessage,
  retryCount,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

/**
 * Email type validation
 */
export const isValidEmailType = (type) => {
  return Object.values(EmailType).includes(type);
};

/**
 * Email status validation
 */
export const isValidEmailStatus = (status) => {
  return Object.values(EmailStatus).includes(status);
};

/**
 * Get email type display name
 */
export const getEmailTypeDisplayName = (type) => {
  switch (type) {
    case EmailType.POLL_INVITATION:
      return 'Poll Invitation';
    case EmailType.MEDIATION_NOTICE:
      return 'Mediation Notice';
    case EmailType.REMINDER:
      return 'Reminder';
    default:
      return 'Unknown';
  }
};

/**
 * Get email status display name
 */
export const getEmailStatusDisplayName = (status) => {
  switch (status) {
    case EmailStatus.SENT:
      return 'Sent';
    case EmailStatus.DELIVERED:
      return 'Delivered';
    case EmailStatus.OPENED:
      return 'Opened';
    case EmailStatus.FAILED:
      return 'Failed';
    case EmailStatus.BOUNCED:
      return 'Bounced';
    default:
      return 'Unknown';
  }
};

/**
 * Get email type options for forms
 */
export const getEmailTypeOptions = () => [
  { value: EmailType.POLL_INVITATION, label: 'Poll Invitation' },
  { value: EmailType.MEDIATION_NOTICE, label: 'Mediation Notice' },
  { value: EmailType.REMINDER, label: 'Reminder' }
];

/**
 * Get email status options for forms
 */
export const getEmailStatusOptions = () => [
  { value: EmailStatus.SENT, label: 'Sent' },
  { value: EmailStatus.DELIVERED, label: 'Delivered' },
  { value: EmailStatus.OPENED, label: 'Opened' },
  { value: EmailStatus.FAILED, label: 'Failed' },
  { value: EmailStatus.BOUNCED, label: 'Bounced' }
];

/**
 * Check if email was successfully delivered
 */
export const isEmailDelivered = (tracking) => {
  return tracking && (
    tracking.status === EmailStatus.DELIVERED || 
    tracking.status === EmailStatus.OPENED
  );
};

/**
 * Check if email was opened
 */
export const isEmailOpened = (tracking) => {
  return tracking && tracking.status === EmailStatus.OPENED;
};

/**
 * Check if email failed
 */
export const isEmailFailed = (tracking) => {
  return tracking && (
    tracking.status === EmailStatus.FAILED || 
    tracking.status === EmailStatus.BOUNCED
  );
};

/**
 * Check if email can be retried
 */
export const canRetryEmail = (tracking) => {
  return tracking && 
         isEmailFailed(tracking) && 
         tracking.retryCount < 3; // Max 3 retries
};

/**
 * Calculate time since sent
 */
export const getTimeSinceSent = (tracking) => {
  if (!tracking || !tracking.sentAt) {
    return 'Unknown';
  }
  
  try {
    const sentDate = new Date(tracking.sentAt);
    const now = new Date();
    const diffMs = now - sentDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    return 'Unknown';
  }
};

/**
 * Calculate time to open (if opened)
 */
export const getTimeToOpen = (tracking) => {
  if (!tracking || !tracking.sentAt || !tracking.openedAt) {
    return null;
  }
  
  try {
    const sentDate = new Date(tracking.sentAt);
    const openedDate = new Date(tracking.openedAt);
    const diffMs = openedDate - sentDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    return null;
  }
};

/**
 * Get email status color for UI
 */
export const getEmailStatusColor = (status) => {
  switch (status) {
    case EmailStatus.SENT:
      return 'blue';
    case EmailStatus.DELIVERED:
      return 'green';
    case EmailStatus.OPENED:
      return 'purple';
    case EmailStatus.FAILED:
    case EmailStatus.BOUNCED:
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Calculate email statistics for a collection
 */
export const calculateEmailStats = (trackingRecords) => {
  if (!trackingRecords || trackingRecords.length === 0) {
    return {
      total: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      failed: 0,
      deliveryRate: 0,
      openRate: 0
    };
  }
  
  const total = trackingRecords.length;
  const sent = trackingRecords.filter(t => t.status === EmailStatus.SENT).length;
  const delivered = trackingRecords.filter(t => isEmailDelivered(t)).length;
  const opened = trackingRecords.filter(t => isEmailOpened(t)).length;
  const failed = trackingRecords.filter(t => isEmailFailed(t)).length;
  
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
  
  return {
    total,
    sent,
    delivered,
    opened,
    failed,
    deliveryRate,
    openRate
  };
};

/**
 * Group tracking records by participant
 */
export const groupTrackingByParticipant = (trackingRecords) => {
  if (!trackingRecords || trackingRecords.length === 0) {
    return {};
  }
  
  return trackingRecords.reduce((groups, tracking) => {
    const email = tracking.participantEmail;
    if (!groups[email]) {
      groups[email] = [];
    }
    groups[email].push(tracking);
    return groups;
  }, {});
};

/**
 * Validate email tracking data
 */
export const validateEmailTrackingData = (tracking) => {
  const errors = {};
  
  if (!tracking.type || !isValidEmailType(tracking.type)) {
    errors.type = 'Valid email type is required';
  }
  
  if (!tracking.caseId || tracking.caseId.trim() === '') {
    errors.caseId = 'Case ID is required';
  }
  
  if (!tracking.participantEmail || tracking.participantEmail.trim() === '') {
    errors.participantEmail = 'Participant email is required';
  }
  
  if (!tracking.emailSubject || tracking.emailSubject.trim() === '') {
    errors.emailSubject = 'Email subject is required';
  }
  
  if (!tracking.status || !isValidEmailStatus(tracking.status)) {
    errors.status = 'Valid email status is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  EmailType,
  EmailStatus,
  createEmailTracking,
  isValidEmailType,
  isValidEmailStatus,
  getEmailTypeDisplayName,
  getEmailStatusDisplayName,
  getEmailTypeOptions,
  getEmailStatusOptions,
  isEmailDelivered,
  isEmailOpened,
  isEmailFailed,
  canRetryEmail,
  getTimeSinceSent,
  getTimeToOpen,
  getEmailStatusColor,
  calculateEmailStats,
  groupTrackingByParticipant,
  validateEmailTrackingData
};