import { getCurrentUserToken } from './authService';
import { getMockNotices, getMockNoticesForCase, getMockEmailTracking } from './mockDataService';

const API_BASE_URL = process.env.REACT_APP_FUNCTIONS_URL || 'http://localhost:5001/mediation-scheduling-simple/us-central1';

/**
 * Make authenticated API request
 */
const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    const token = await getCurrentUserToken();
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Create a new notice
 */
export const createNotice = async (noticeData) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/createNotice`, {
      method: 'POST',
      body: JSON.stringify(noticeData)
    });
    return response;
  } catch (error) {
    console.error('Error creating notice:', error);
    throw error;
  }
};

/**
 * Get notices for a case
 */
export const getNoticesForCase = async (caseId) => {
  // Use mock data in development mode
  if (process.env.REACT_APP_USE_MOCK_AUTH === 'true') {
    return await getMockNoticesForCase(caseId);
  }
  
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/getNoticesForCase?caseId=${caseId}`);
    return response;
  } catch (error) {
    console.error('Error getting notices for case:', error);
    throw error;
  }
};

/**
 * Update a notice
 */
export const updateNotice = async (noticeId, noticeData) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/updateNotice?noticeId=${noticeId}`, {
      method: 'POST',
      body: JSON.stringify(noticeData)
    });
    return response;
  } catch (error) {
    console.error('Error updating notice:', error);
    throw error;
  }
};

/**
 * Delete a notice
 */
export const deleteNotice = async (noticeId) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/deleteNotice?noticeId=${noticeId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Error deleting notice:', error);
    throw error;
  }
};

/**
 * Send mediation notice emails
 */
export const sendMediationNotices = async (noticeId, baseUrl) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/sendMediationNotices`, {
      method: 'POST',
      body: JSON.stringify({
        noticeId,
        baseUrl: baseUrl || window.location.origin
      })
    });
    return response;
  } catch (error) {
    console.error('Error sending mediation notices:', error);
    throw error;
  }
};

/**
 * Validate notice data
 */
export const validateNoticeData = (noticeData) => {
  const errors = {};
  
  if (!noticeData.caseId) {
    errors.caseId = 'Case selection is required';
  }
  
  if (!noticeData.caseName || noticeData.caseName.trim() === '') {
    errors.caseName = 'Case name is required';
  }
  
  if (!noticeData.caseNumber || noticeData.caseNumber.trim() === '') {
    errors.caseNumber = 'Case number is required';
  }
  
  if (!noticeData.noticeType) {
    errors.noticeType = 'Notice type is required';
  }
  
  if (!noticeData.mediationDate) {
    errors.mediationDate = 'Mediation date is required';
  }
  
  if (!noticeData.mediationTime || noticeData.mediationTime.trim() === '') {
    errors.mediationTime = 'Mediation time is required';
  }
  
  if (!noticeData.location || noticeData.location.trim() === '') {
    errors.location = 'Location is required';
  }
  
  if (!noticeData.participants || noticeData.participants.length === 0) {
    errors.participants = 'At least one participant is required';
  } else {
    // Validate each participant
    noticeData.participants.forEach((participant, index) => {
      if (!participant.email || participant.email.trim() === '') {
        errors[`participant_${index}_email`] = 'Participant email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email)) {
        errors[`participant_${index}_email`] = 'Invalid email format';
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Format notice data for display
 */
export const formatNoticeForDisplay = (noticeData) => {
  return {
    ...noticeData,
    createdAtFormatted: noticeData.createdAt ? new Date(noticeData.createdAt.seconds * 1000).toLocaleDateString() : '',
    updatedAtFormatted: noticeData.updatedAt ? new Date(noticeData.updatedAt.seconds * 1000).toLocaleDateString() : '',
    sentAtFormatted: noticeData.sentAt ? new Date(noticeData.sentAt.seconds * 1000).toLocaleString() : '',
    mediationDateFormatted: noticeData.mediationDate ? new Date(noticeData.mediationDate).toLocaleDateString() : '',
    participantCount: noticeData.participants ? noticeData.participants.length : 0,
    statusDisplay: noticeData.status ? noticeData.status.charAt(0).toUpperCase() + noticeData.status.slice(1) : 'Draft',
    noticeTypeDisplay: noticeData.noticeType ? noticeData.noticeType.charAt(0).toUpperCase() + noticeData.noticeType.slice(1) : '',
    hasAttachment: !!(noticeData.pdfFileName && noticeData.pdfUrl)
  };
};

/**
 * Get notice statistics
 */
export const getNoticeStatistics = (notices) => {
  const stats = {
    total: notices.length,
    draft: 0,
    sent: 0,
    delivered: 0,
    withAttachments: 0,
    totalEmailsSent: 0,
    totalEmailsDelivered: 0
  };
  
  notices.forEach(notice => {
    switch (notice.status) {
      case 'draft':
        stats.draft++;
        break;
      case 'sent':
        stats.sent++;
        break;
      case 'delivered':
        stats.delivered++;
        break;
      default:
        stats.draft++;
    }
    
    if (notice.pdfFileName && notice.pdfUrl) {
      stats.withAttachments++;
    }
    
    if (notice.emailsSent) {
      stats.totalEmailsSent += notice.emailsSent;
    }
    
    if (notice.emailsDelivered) {
      stats.totalEmailsDelivered += notice.emailsDelivered;
    }
  });
  
  return stats;
};

/**
 * Search notices
 */
export const searchNotices = (notices, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return notices;
  }
  
  const term = searchTerm.toLowerCase();
  
  return notices.filter(notice => {
    return (
      notice.caseName?.toLowerCase().includes(term) ||
      notice.caseNumber?.toLowerCase().includes(term) ||
      notice.location?.toLowerCase().includes(term) ||
      notice.mediatorName?.toLowerCase().includes(term) ||
      notice.participants?.some(participant => 
        participant.name?.toLowerCase().includes(term) ||
        participant.email?.toLowerCase().includes(term)
      )
    );
  });
};

/**
 * Sort notices
 */
export const sortNotices = (notices, sortBy, sortOrder = 'desc') => {
  return [...notices].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'caseName':
        aValue = a.caseName || '';
        bValue = b.caseName || '';
        break;
      case 'caseNumber':
        aValue = a.caseNumber || '';
        bValue = b.caseNumber || '';
        break;
      case 'createdAt':
        aValue = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        bValue = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        break;
      case 'mediationDate':
        aValue = a.mediationDate ? new Date(a.mediationDate) : new Date(0);
        bValue = b.mediationDate ? new Date(b.mediationDate) : new Date(0);
        break;
      case 'status':
        aValue = a.status || 'draft';
        bValue = b.status || 'draft';
        break;
      case 'noticeType':
        aValue = a.noticeType || '';
        bValue = b.noticeType || '';
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Filter notices by status
 */
export const filterNoticesByStatus = (notices, status) => {
  if (!status || status === 'all') {
    return notices;
  }
  
  return notices.filter(notice => notice.status === status);
};

/**
 * Filter notices by notice type
 */
export const filterNoticesByType = (notices, noticeType) => {
  if (!noticeType || noticeType === 'all') {
    return notices;
  }
  
  return notices.filter(notice => notice.noticeType === noticeType);
};

/**
 * Get notices for date range
 */
export const getNoticesForDateRange = (notices, startDate, endDate) => {
  if (!startDate && !endDate) {
    return notices;
  }
  
  return notices.filter(notice => {
    if (!notice.mediationDate) {
      return false;
    }
    
    const noticeDate = new Date(notice.mediationDate);
    
    if (startDate && noticeDate < new Date(startDate)) {
      return false;
    }
    
    if (endDate && noticeDate > new Date(endDate)) {
      return false;
    }
    
    return true;
  });
};

/**
 * Generate notice summary
 */
export const generateNoticeSummary = (notice) => {
  const mediationDate = notice.mediationDate ? new Date(notice.mediationDate).toLocaleDateString() : 'TBD';
  const participantCount = notice.participants ? notice.participants.length : 0;
  const hasAttachment = !!(notice.pdfFileName && notice.pdfUrl);
  
  return {
    title: `${notice.noticeType?.charAt(0).toUpperCase() + notice.noticeType?.slice(1)} Notice - ${notice.caseName}`,
    subtitle: `${notice.caseNumber} | ${mediationDate} at ${notice.mediationTime}`,
    details: [
      `${participantCount} participant${participantCount !== 1 ? 's' : ''}`,
      `Location: ${notice.location}`,
      hasAttachment ? 'Has PDF attachment' : 'No attachment',
      `Status: ${notice.status?.charAt(0).toUpperCase() + notice.status?.slice(1)}`
    ]
  };
};

/**
 * Get all notices (alias for getNoticesForCase with no case filter)
 */
export const getNotices = async () => {
  // Use mock data in development mode
  if (process.env.REACT_APP_USE_MOCK_AUTH === 'true') {
    return await getMockNotices();
  }
  
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/getNotices`);
    return response;
  } catch (error) {
    console.error('Error getting notices:', error);
    throw error;
  }
};

/**
 * Get email tracking data
 */
export const getEmailTracking = async () => {
  // Use mock data in development mode
  if (process.env.REACT_APP_USE_MOCK_AUTH === 'true') {
    return await getMockEmailTracking();
  }
  
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/getEmailTracking`);
    return response;
  } catch (error) {
    console.error('Error getting email tracking:', error);
    throw error;
  }
};