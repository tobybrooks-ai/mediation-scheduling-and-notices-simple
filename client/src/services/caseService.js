import { getCurrentUserToken } from './authService';
import { getMockCases, getMockCase } from './mockDataService';

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
 * Get all cases for the current user
 */
export const getCases = async () => {
  // Use mock data in development mode
  if (process.env.REACT_APP_USE_MOCK_AUTH === 'true') {
    return await getMockCases();
  }
  
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/getCases`);
    return response;
  } catch (error) {
    console.error('Error getting cases:', error);
    throw error;
  }
};

/**
 * Get a case by ID
 */
export const getCaseById = async (caseId) => {
  // Use mock data in development mode
  if (process.env.REACT_APP_USE_MOCK_AUTH === 'true') {
    return await getMockCase(caseId);
  }
  
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/getCaseById?caseId=${caseId}`);
    return response;
  } catch (error) {
    console.error('Error getting case:', error);
    throw error;
  }
};

/**
 * Create a new case
 */
export const createCase = async (caseData) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/createCase`, {
      method: 'POST',
      body: JSON.stringify(caseData)
    });
    return response;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

/**
 * Update an existing case
 */
export const updateCase = async (caseId, caseData) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/updateCase?caseId=${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(caseData)
    });
    return response;
  } catch (error) {
    console.error('Error updating case:', error);
    throw error;
  }
};

/**
 * Delete a case
 */
export const deleteCase = async (caseId) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/deleteCase?caseId=${caseId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Error deleting case:', error);
    throw error;
  }
};

/**
 * Validate case data
 */
export const validateCaseData = (caseData) => {
  const errors = {};
  
  if (!caseData.caseNumber || caseData.caseNumber.trim() === '') {
    errors.caseNumber = 'Case number is required';
  }
  
  if (!caseData.caseName || caseData.caseName.trim() === '') {
    errors.caseName = 'Case name is required';
  }
  
  if (!caseData.participants || caseData.participants.length === 0) {
    errors.participants = 'At least one participant is required';
  } else {
    // Validate each participant
    caseData.participants.forEach((participant, index) => {
      if (!participant.name || participant.name.trim() === '') {
        errors[`participant_${index}_name`] = 'Participant name is required';
      }
      
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
 * Format case data for display
 */
export const formatCaseForDisplay = (caseData) => {
  return {
    ...caseData,
    createdAtFormatted: caseData.createdAt ? new Date(caseData.createdAt.seconds * 1000).toLocaleDateString() : '',
    updatedAtFormatted: caseData.updatedAt ? new Date(caseData.updatedAt.seconds * 1000).toLocaleDateString() : '',
    participantCount: caseData.participants ? caseData.participants.length : 0,
    statusDisplay: caseData.status ? caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1) : 'Active'
  };
};

/**
 * Get case statistics
 */
export const getCaseStatistics = (cases) => {
  const stats = {
    total: cases.length,
    active: 0,
    completed: 0,
    cancelled: 0,
    totalParticipants: 0
  };
  
  cases.forEach(caseItem => {
    switch (caseItem.status) {
      case 'active':
        stats.active++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'cancelled':
        stats.cancelled++;
        break;
      default:
        stats.active++;
    }
    
    if (caseItem.participants) {
      stats.totalParticipants += caseItem.participants.length;
    }
  });
  
  return stats;
};

/**
 * Search cases
 */
export const searchCases = (cases, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return cases;
  }
  
  const term = searchTerm.toLowerCase();
  
  return cases.filter(caseItem => {
    return (
      caseItem.caseNumber?.toLowerCase().includes(term) ||
      caseItem.caseName?.toLowerCase().includes(term) ||
      caseItem.description?.toLowerCase().includes(term) ||
      caseItem.participants?.some(participant => 
        participant.name?.toLowerCase().includes(term) ||
        participant.email?.toLowerCase().includes(term)
      )
    );
  });
};

/**
 * Sort cases
 */
export const sortCases = (cases, sortBy, sortOrder = 'desc') => {
  return [...cases].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'caseNumber':
        aValue = a.caseNumber || '';
        bValue = b.caseNumber || '';
        break;
      case 'caseName':
        aValue = a.caseName || '';
        bValue = b.caseName || '';
        break;
      case 'createdAt':
        aValue = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        bValue = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        break;
      case 'updatedAt':
        aValue = a.updatedAt ? new Date(a.updatedAt.seconds * 1000) : new Date(0);
        bValue = b.updatedAt ? new Date(b.updatedAt.seconds * 1000) : new Date(0);
        break;
      case 'status':
        aValue = a.status || 'active';
        bValue = b.status || 'active';
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