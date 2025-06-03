/**
 * Notice Model - For mediation notices with PDF attachments
 */

export const NoticeType = {
  SCHEDULED: 'scheduled',
  RESCHEDULED: 'rescheduled',
  CANCELLED: 'cancelled',
  REMINDER: 'reminder'
};

export const NoticeStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed'
};

/**
 * Notice data structure
 */
export const createNotice = ({
  caseId,
  caseNumber,
  caseName,
  noticeType = NoticeType.SCHEDULED,
  status = NoticeStatus.DRAFT,
  mediationDate,
  mediationTime,
  location,
  mediatorName,
  participants = [],
  pdfFileName = null,
  pdfUrl = null,
  pdfStoragePath = null,
  pdfUploadedAt = null,
  sentAt = null,
  emailsSent = 0,
  emailsDelivered = 0,
  emailsOpened = 0,
  createdBy,
  notes = ''
}) => ({
  caseId,
  caseNumber,
  caseName,
  noticeType,
  status,
  mediationDate,
  mediationTime,
  location,
  mediatorName,
  participants,
  pdfFileName,
  pdfUrl,
  pdfStoragePath,
  pdfUploadedAt,
  sentAt,
  emailsSent,
  emailsDelivered,
  emailsOpened,
  createdBy,
  notes,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

/**
 * Notice type validation
 */
export const isValidNoticeType = (noticeType) => {
  return Object.values(NoticeType).includes(noticeType);
};

/**
 * Notice status validation
 */
export const isValidNoticeStatus = (status) => {
  return Object.values(NoticeStatus).includes(status);
};

/**
 * Get notice type display name
 */
export const getNoticeTypeDisplayName = (noticeType) => {
  switch (noticeType) {
    case NoticeType.SCHEDULED:
      return 'Mediation Scheduled';
    case NoticeType.RESCHEDULED:
      return 'Mediation Rescheduled';
    case NoticeType.CANCELLED:
      return 'Mediation Cancelled';
    case NoticeType.REMINDER:
      return 'Mediation Reminder';
    default:
      return 'Unknown';
  }
};

/**
 * Get notice status display name
 */
export const getNoticeStatusDisplayName = (status) => {
  switch (status) {
    case NoticeStatus.DRAFT:
      return 'Draft';
    case NoticeStatus.SENT:
      return 'Sent';
    case NoticeStatus.DELIVERED:
      return 'Delivered';
    case NoticeStatus.FAILED:
      return 'Failed';
    default:
      return 'Unknown';
  }
};

/**
 * Get notice type options for forms
 */
export const getNoticeTypeOptions = () => [
  { value: NoticeType.SCHEDULED, label: 'Mediation Scheduled' },
  { value: NoticeType.RESCHEDULED, label: 'Mediation Rescheduled' },
  { value: NoticeType.CANCELLED, label: 'Mediation Cancelled' },
  { value: NoticeType.REMINDER, label: 'Mediation Reminder' }
];

/**
 * Get notice status options for forms
 */
export const getNoticeStatusOptions = () => [
  { value: NoticeStatus.DRAFT, label: 'Draft' },
  { value: NoticeStatus.SENT, label: 'Sent' },
  { value: NoticeStatus.DELIVERED, label: 'Delivered' },
  { value: NoticeStatus.FAILED, label: 'Failed' }
];

/**
 * Check if notice can be sent
 */
export const canSendNotice = (notice) => {
  return notice && 
         notice.status === NoticeStatus.DRAFT &&
         notice.participants && 
         notice.participants.length > 0 &&
         notice.mediationDate &&
         notice.mediationTime &&
         notice.location &&
         notice.pdfUrl; // Must have PDF attached
};

/**
 * Check if notice has PDF attached
 */
export const hasNoticeAttachment = (notice) => {
  return notice && notice.pdfUrl && notice.pdfFileName;
};

/**
 * Check if notice is sent
 */
export const isNoticeSent = (notice) => {
  return notice && (
    notice.status === NoticeStatus.SENT || 
    notice.status === NoticeStatus.DELIVERED
  );
};

/**
 * Get notice delivery rate
 */
export const getNoticeDeliveryRate = (notice) => {
  if (!notice || !notice.emailsSent || notice.emailsSent === 0) {
    return 0;
  }
  
  return Math.round((notice.emailsDelivered / notice.emailsSent) * 100);
};

/**
 * Get notice open rate
 */
export const getNoticeOpenRate = (notice) => {
  if (!notice || !notice.emailsDelivered || notice.emailsDelivered === 0) {
    return 0;
  }
  
  return Math.round((notice.emailsOpened / notice.emailsDelivered) * 100);
};

/**
 * Format mediation date and time
 */
export const formatMediationDateTime = (notice) => {
  if (!notice || !notice.mediationDate || !notice.mediationTime) {
    return 'Date and time not set';
  }
  
  try {
    const date = new Date(notice.mediationDate);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Convert 24-hour time to 12-hour format
    const [hours, minutes] = notice.mediationTime.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const timeStr = `${hour12}:${minutes} ${ampm}`;
    
    return `${dateStr} at ${timeStr}`;
  } catch (error) {
    return 'Invalid date/time';
  }
};

/**
 * Generate notice subject line
 */
export const generateNoticeSubject = (notice) => {
  if (!notice) return 'Mediation Notice';
  
  const caseInfo = notice.caseNumber ? `Case ${notice.caseNumber}` : notice.caseName || 'Mediation';
  
  switch (notice.noticeType) {
    case NoticeType.SCHEDULED:
      return `Mediation Scheduled - ${caseInfo}`;
    case NoticeType.RESCHEDULED:
      return `Mediation Rescheduled - ${caseInfo}`;
    case NoticeType.CANCELLED:
      return `Mediation Cancelled - ${caseInfo}`;
    case NoticeType.REMINDER:
      return `Mediation Reminder - ${caseInfo}`;
    default:
      return `Mediation Notice - ${caseInfo}`;
  }
};

/**
 * Validate notice data
 */
export const validateNoticeData = (notice) => {
  const errors = {};
  
  if (!notice.caseId || notice.caseId.trim() === '') {
    errors.caseId = 'Case ID is required';
  }
  
  if (!notice.noticeType || !isValidNoticeType(notice.noticeType)) {
    errors.noticeType = 'Valid notice type is required';
  }
  
  if (!notice.mediationDate) {
    errors.mediationDate = 'Mediation date is required';
  }
  
  if (!notice.mediationTime || notice.mediationTime.trim() === '') {
    errors.mediationTime = 'Mediation time is required';
  }
  
  if (!notice.location || notice.location.trim() === '') {
    errors.location = 'Mediation location is required';
  }
  
  if (!notice.participants || notice.participants.length === 0) {
    errors.participants = 'At least one participant is required';
  }
  
  // Validate participants have email addresses
  if (notice.participants) {
    notice.participants.forEach((participant, index) => {
      if (!participant.email || participant.email.trim() === '') {
        errors[`participant_${index}_email`] = 'Participant email is required';
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Create notice from case and poll data
 */
export const createNoticeFromCaseAndPoll = (caseData, pollData, finalizedOption, createdBy) => {
  if (!caseData || !pollData || !finalizedOption) {
    throw new Error('Case data, poll data, and finalized option are required');
  }
  
  return createNotice({
    caseId: caseData.id,
    caseNumber: caseData.caseNumber,
    caseName: caseData.caseName,
    noticeType: NoticeType.SCHEDULED,
    mediationDate: new Date(`${finalizedOption.date}T${finalizedOption.time}`).toISOString(),
    mediationTime: finalizedOption.time,
    location: finalizedOption.location || pollData.location || caseData.location || '',
    mediatorName: caseData.mediatorName || '',
    participants: caseData.participants || [],
    createdBy
  });
};

export default {
  NoticeType,
  NoticeStatus,
  createNotice,
  isValidNoticeType,
  isValidNoticeStatus,
  getNoticeTypeDisplayName,
  getNoticeStatusDisplayName,
  getNoticeTypeOptions,
  getNoticeStatusOptions,
  canSendNotice,
  hasNoticeAttachment,
  isNoticeSent,
  getNoticeDeliveryRate,
  getNoticeOpenRate,
  formatMediationDateTime,
  generateNoticeSubject,
  validateNoticeData,
  createNoticeFromCaseAndPoll
};