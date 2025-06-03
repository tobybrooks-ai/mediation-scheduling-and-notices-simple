/**
 * Poll Model - For scheduling mediation sessions
 */

export const PollStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  FINALIZED: 'finalized',
  CANCELLED: 'cancelled'
};

export const VoteStatus = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  PREFERRED: 'preferred'
};

/**
 * Poll option structure
 */
export const createPollOption = ({
  id,
  date,
  time,
  duration = 60,
  location = ''
}) => ({
  id: id || `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  date,
  time,
  duration,
  location,
  votes: [],
  availableCount: 0,
  unavailableCount: 0,
  preferredCount: 0
});

/**
 * Poll data structure
 */
export const createPoll = ({
  caseId,
  caseNumber,
  caseName,
  title,
  description = '',
  location = '',
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  options = [],
  participants = [],
  status = PollStatus.DRAFT,
  createdBy,
  finalizedOptionId = null,
  emailsSent = 0,
  emailsDelivered = 0,
  votesReceived = 0
}) => ({
  caseId,
  caseNumber,
  caseName,
  title,
  description,
  location,
  timeZone,
  options,
  participants,
  status,
  createdBy,
  finalizedOptionId,
  emailsSent,
  emailsDelivered,
  votesReceived,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

/**
 * Vote data structure
 */
export const createVote = ({
  pollId,
  optionId,
  participantEmail,
  participantName,
  status = VoteStatus.AVAILABLE,
  notes = ''
}) => ({
  pollId,
  optionId,
  participantEmail,
  participantName,
  status,
  notes,
  votedAt: new Date().toISOString()
});

/**
 * Poll status validation
 */
export const isValidPollStatus = (status) => {
  return Object.values(PollStatus).includes(status);
};

/**
 * Vote status validation
 */
export const isValidVoteStatus = (status) => {
  return Object.values(VoteStatus).includes(status);
};

/**
 * Get poll status display name
 */
export const getPollStatusDisplayName = (status) => {
  switch (status) {
    case PollStatus.DRAFT:
      return 'Draft';
    case PollStatus.ACTIVE:
      return 'Active';
    case PollStatus.FINALIZED:
      return 'Finalized';
    case PollStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

/**
 * Get vote status display name
 */
export const getVoteStatusDisplayName = (status) => {
  switch (status) {
    case VoteStatus.AVAILABLE:
      return 'Available';
    case VoteStatus.UNAVAILABLE:
      return 'Unavailable';
    case VoteStatus.PREFERRED:
      return 'Preferred';
    default:
      return 'Unknown';
  }
};

/**
 * Get poll status options for forms
 */
export const getPollStatusOptions = () => [
  { value: PollStatus.DRAFT, label: 'Draft' },
  { value: PollStatus.ACTIVE, label: 'Active' },
  { value: PollStatus.FINALIZED, label: 'Finalized' },
  { value: PollStatus.CANCELLED, label: 'Cancelled' }
];

/**
 * Get vote status options for forms
 */
export const getVoteStatusOptions = () => [
  { value: VoteStatus.AVAILABLE, label: 'Available' },
  { value: VoteStatus.UNAVAILABLE, label: 'Unavailable' },
  { value: VoteStatus.PREFERRED, label: 'Preferred' }
];

/**
 * Check if poll can be activated
 */
export const canActivatePoll = (poll) => {
  return poll && 
         poll.status === PollStatus.DRAFT &&
         poll.options && 
         poll.options.length > 0 &&
         poll.participants && 
         poll.participants.length > 0;
};

/**
 * Check if poll can be finalized
 */
export const canFinalizePoll = (poll) => {
  return poll && 
         poll.status === PollStatus.ACTIVE &&
         poll.votesReceived > 0;
};

/**
 * Check if poll is active for voting
 */
export const isPollActiveForVoting = (poll) => {
  return poll && poll.status === PollStatus.ACTIVE;
};

/**
 * Get poll participation rate
 */
export const getPollParticipationRate = (poll) => {
  if (!poll || !poll.participants || poll.participants.length === 0) {
    return 0;
  }
  
  return Math.round((poll.votesReceived / poll.participants.length) * 100);
};

/**
 * Calculate option vote counts
 */
export const calculateOptionVoteCounts = (option, votes) => {
  const optionVotes = votes.filter(vote => vote.optionId === option.id);
  
  return {
    availableCount: optionVotes.filter(vote => vote.status === VoteStatus.AVAILABLE).length,
    unavailableCount: optionVotes.filter(vote => vote.status === VoteStatus.UNAVAILABLE).length,
    preferredCount: optionVotes.filter(vote => vote.status === VoteStatus.PREFERRED).length,
    totalVotes: optionVotes.length
  };
};

/**
 * Get best poll option based on votes
 */
export const getBestPollOption = (poll, votes) => {
  if (!poll || !poll.options || poll.options.length === 0) {
    return null;
  }
  
  let bestOption = null;
  let bestScore = -1;
  
  poll.options.forEach(option => {
    const counts = calculateOptionVoteCounts(option, votes);
    // Score: preferred votes * 3 + available votes * 1 - unavailable votes * 2
    const score = (counts.preferredCount * 3) + (counts.availableCount * 1) - (counts.unavailableCount * 2);
    
    if (score > bestScore) {
      bestScore = score;
      bestOption = { ...option, ...counts, score };
    }
  });
  
  return bestOption;
};

/**
 * Validate poll data
 */
export const validatePollData = (poll) => {
  const errors = {};
  
  if (!poll.title || poll.title.trim() === '') {
    errors.title = 'Poll title is required';
  }
  
  if (!poll.caseId || poll.caseId.trim() === '') {
    errors.caseId = 'Case ID is required';
  }
  
  if (!poll.options || poll.options.length === 0) {
    errors.options = 'At least one time option is required';
  }
  
  if (!poll.participants || poll.participants.length === 0) {
    errors.participants = 'At least one participant is required';
  }
  
  // Validate each option
  if (poll.options) {
    poll.options.forEach((option, index) => {
      if (!option.date || !option.time) {
        errors[`option_${index}`] = 'Date and time are required for all options';
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  PollStatus,
  VoteStatus,
  createPollOption,
  createPoll,
  createVote,
  isValidPollStatus,
  isValidVoteStatus,
  getPollStatusDisplayName,
  getVoteStatusDisplayName,
  getPollStatusOptions,
  getVoteStatusOptions,
  canActivatePoll,
  canFinalizePoll,
  isPollActiveForVoting,
  getPollParticipationRate,
  calculateOptionVoteCounts,
  getBestPollOption,
  validatePollData
};