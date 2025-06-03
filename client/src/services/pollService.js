import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { getCurrentUserToken } from './authService';

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
 * Create a new poll
 */
export const createPoll = async (pollData) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/createPoll`, {
      method: 'POST',
      body: JSON.stringify(pollData)
    });
    return response;
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

/**
 * Get a poll by ID (public access for voting)
 */
export const getPollById = async (pollId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/getPollById?pollId=${pollId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting poll:', error);
    throw error;
  }
};

/**
 * Submit a vote (public access)
 */
export const submitVote = async (voteData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submitVote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(voteData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw error;
  }
};

/**
 * Send poll invitation to single participant
 */
export const sendPollInvitation = async (pollId, participantEmail, baseUrl) => {
  try {
    const sendPollInvitationFn = httpsCallable(functions, 'sendPollInvitation');
    const result = await sendPollInvitationFn({
      pollId,
      participantEmail,
      baseUrl: baseUrl || window.location.origin
    });
    
    return result.data;
  } catch (error) {
    console.error('Error sending poll invitation:', error);
    throw error;
  }
};

/**
 * Send poll invitations to all participants
 */
export const sendPollInvitations = async (pollId, baseUrl) => {
  try {
    const sendPollInvitationsFn = httpsCallable(functions, 'sendPollInvitations');
    const result = await sendPollInvitationsFn({
      pollId,
      baseUrl: baseUrl || window.location.origin
    });
    
    return result.data;
  } catch (error) {
    console.error('Error sending poll invitations:', error);
    throw error;
  }
};

/**
 * Test email configuration
 */
export const testEmailConfig = async (testEmail) => {
  try {
    const testEmailConfigFn = httpsCallable(functions, 'testEmailConfig');
    const result = await testEmailConfigFn({ testEmail });
    
    return result.data;
  } catch (error) {
    console.error('Error testing email config:', error);
    throw error;
  }
};

/**
 * Validate poll data
 */
export const validatePollData = (pollData) => {
  const errors = {};
  
  if (!pollData.title || pollData.title.trim() === '') {
    errors.title = 'Poll title is required';
  }
  
  if (!pollData.caseId) {
    errors.caseId = 'Case selection is required';
  }
  
  if (!pollData.options || pollData.options.length === 0) {
    errors.options = 'At least one time option is required';
  } else {
    // Validate each option
    pollData.options.forEach((option, index) => {
      if (!option.startTime) {
        errors[`option_${index}_startTime`] = 'Start time is required';
      }
      
      if (!option.duration || option.duration <= 0) {
        errors[`option_${index}_duration`] = 'Duration must be greater than 0';
      }
    });
  }
  
  if (!pollData.participants || pollData.participants.length === 0) {
    errors.participants = 'At least one participant is required';
  } else {
    // Validate each participant
    pollData.participants.forEach((participant, index) => {
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
 * Format poll data for display
 */
export const formatPollForDisplay = (pollData) => {
  return {
    ...pollData,
    createdAtFormatted: pollData.createdAt ? new Date(pollData.createdAt.seconds * 1000).toLocaleDateString() : '',
    updatedAtFormatted: pollData.updatedAt ? new Date(pollData.updatedAt.seconds * 1000).toLocaleDateString() : '',
    participantCount: pollData.participants ? pollData.participants.length : 0,
    optionCount: pollData.options ? pollData.options.length : 0,
    statusDisplay: pollData.status ? pollData.status.charAt(0).toUpperCase() + pollData.status.slice(1) : 'Active',
    optionsFormatted: pollData.options ? pollData.options.map(option => ({
      ...option,
      startTimeFormatted: option.startTime ? new Date(option.startTime.seconds * 1000).toLocaleString() : '',
      durationFormatted: `${option.duration} minutes`
    })) : []
  };
};

/**
 * Get poll statistics
 */
export const getPollStatistics = (polls) => {
  const stats = {
    total: polls.length,
    active: 0,
    completed: 0,
    cancelled: 0,
    totalParticipants: 0,
    totalOptions: 0
  };
  
  polls.forEach(poll => {
    switch (poll.status) {
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
    
    if (poll.participants) {
      stats.totalParticipants += poll.participants.length;
    }
    
    if (poll.options) {
      stats.totalOptions += poll.options.length;
    }
  });
  
  return stats;
};

/**
 * Calculate poll results
 */
export const calculatePollResults = (poll, votes) => {
  if (!poll.options || !votes) {
    return [];
  }
  
  const results = poll.options.map(option => {
    const optionVotes = votes.filter(vote => vote.optionId === option.id);
    
    const yesVotes = optionVotes.filter(vote => vote.type === 'yes').length;
    const ifNeedBeVotes = optionVotes.filter(vote => vote.type === 'if_need_be').length;
    const noVotes = optionVotes.filter(vote => vote.type === 'no').length;
    const totalVotes = optionVotes.length;
    
    return {
      ...option,
      votes: {
        yes: yesVotes,
        ifNeedBe: ifNeedBeVotes,
        no: noVotes,
        total: totalVotes
      },
      score: yesVotes * 2 + ifNeedBeVotes * 1, // Scoring system: Yes=2, If Need Be=1, No=0
      percentage: poll.participants ? Math.round((totalVotes / poll.participants.length) * 100) : 0
    };
  });
  
  // Sort by score (highest first)
  return results.sort((a, b) => b.score - a.score);
};

/**
 * Get participant voting status
 */
export const getParticipantVotingStatus = (poll, votes) => {
  if (!poll.participants || !votes) {
    return [];
  }
  
  return poll.participants.map(participant => {
    const participantVotes = votes.filter(vote => vote.participantEmail === participant.email);
    
    return {
      ...participant,
      hasVoted: participantVotes.length > 0,
      voteCount: participantVotes.length,
      lastVoted: participantVotes.length > 0 ? 
        Math.max(...participantVotes.map(vote => vote.votedAt?.seconds || 0)) : null
    };
  });
};

/**
 * Search polls
 */
export const searchPolls = (polls, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return polls;
  }
  
  const term = searchTerm.toLowerCase();
  
  return polls.filter(poll => {
    return (
      poll.title?.toLowerCase().includes(term) ||
      poll.description?.toLowerCase().includes(term) ||
      poll.caseNumber?.toLowerCase().includes(term) ||
      poll.participants?.some(participant => 
        participant.name?.toLowerCase().includes(term) ||
        participant.email?.toLowerCase().includes(term)
      )
    );
  });
};

/**
 * Sort polls
 */
export const sortPolls = (polls, sortBy, sortOrder = 'desc') => {
  return [...polls].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title || '';
        bValue = b.title || '';
        break;
      case 'createdAt':
        aValue = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        bValue = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        break;
      case 'status':
        aValue = a.status || 'active';
        bValue = b.status || 'active';
        break;
      case 'participantCount':
        aValue = a.participants ? a.participants.length : 0;
        bValue = b.participants ? b.participants.length : 0;
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