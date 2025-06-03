/**
 * Case Model - Simplified for essential mediation case management
 */

export const CaseType = {
  COUNTY: 'county',
  FAMILY: 'family',
  CIRCUIT: 'circuit',
  DEPENDENCY: 'dependency'
};

export const CaseStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Case data structure
 */
export const createCase = ({
  caseNumber,
  caseName,
  caseType,
  mediatorId,
  mediatorName,
  participants = [],
  location = '',
  scheduledDate = null,
  scheduledTime = '',
  notes = '',
  status = CaseStatus.DRAFT
}) => ({
  caseNumber,
  caseName,
  caseType,
  mediatorId,
  mediatorName,
  participants,
  location,
  scheduledDate,
  scheduledTime,
  notes,
  status,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

/**
 * Case type validation
 */
export const isValidCaseType = (caseType) => {
  return Object.values(CaseType).includes(caseType);
};

/**
 * Case status validation
 */
export const isValidCaseStatus = (status) => {
  return Object.values(CaseStatus).includes(status);
};

/**
 * Get case type display name
 */
export const getCaseTypeDisplayName = (caseType) => {
  switch (caseType) {
    case CaseType.COUNTY:
      return 'County Court';
    case CaseType.FAMILY:
      return 'Family Court';
    case CaseType.CIRCUIT:
      return 'Circuit Court';
    case CaseType.DEPENDENCY:
      return 'Dependency Court';
    default:
      return 'Unknown';
  }
};

/**
 * Get case status display name
 */
export const getCaseStatusDisplayName = (status) => {
  switch (status) {
    case CaseStatus.DRAFT:
      return 'Draft';
    case CaseStatus.SCHEDULED:
      return 'Scheduled';
    case CaseStatus.COMPLETED:
      return 'Completed';
    case CaseStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

/**
 * Get case type options for forms
 */
export const getCaseTypeOptions = () => [
  { value: CaseType.COUNTY, label: 'County Court' },
  { value: CaseType.FAMILY, label: 'Family Court' },
  { value: CaseType.CIRCUIT, label: 'Circuit Court' },
  { value: CaseType.DEPENDENCY, label: 'Dependency Court' }
];

/**
 * Get case status options for forms
 */
export const getCaseStatusOptions = () => [
  { value: CaseStatus.DRAFT, label: 'Draft' },
  { value: CaseStatus.SCHEDULED, label: 'Scheduled' },
  { value: CaseStatus.COMPLETED, label: 'Completed' },
  { value: CaseStatus.CANCELLED, label: 'Cancelled' }
];

/**
 * Check if case is scheduled
 */
export const isCaseScheduled = (caseData) => {
  return caseData && 
         caseData.status === CaseStatus.SCHEDULED && 
         caseData.scheduledDate && 
         caseData.scheduledTime;
};

/**
 * Check if case can be scheduled
 */
export const canScheduleCase = (caseData) => {
  return caseData && 
         caseData.status === CaseStatus.DRAFT &&
         caseData.participants && 
         caseData.participants.length > 0;
};

/**
 * Get case participants count
 */
export const getParticipantsCount = (caseData) => {
  return caseData && caseData.participants ? caseData.participants.length : 0;
};

/**
 * Format case display name
 */
export const formatCaseDisplayName = (caseData) => {
  if (!caseData) return 'Unknown Case';
  
  const name = caseData.caseName || 'Unnamed Case';
  const number = caseData.caseNumber || 'No Number';
  
  return `${name} (${number})`;
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
  
  if (!caseData.caseType || !isValidCaseType(caseData.caseType)) {
    errors.caseType = 'Valid case type is required';
  }
  
  if (!caseData.mediatorId || caseData.mediatorId.trim() === '') {
    errors.mediatorId = 'Mediator is required';
  }
  
  if (!caseData.participants || caseData.participants.length === 0) {
    errors.participants = 'At least one participant is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  CaseType,
  CaseStatus,
  createCase,
  isValidCaseType,
  isValidCaseStatus,
  getCaseTypeDisplayName,
  getCaseStatusDisplayName,
  getCaseTypeOptions,
  getCaseStatusOptions,
  isCaseScheduled,
  canScheduleCase,
  getParticipantsCount,
  formatCaseDisplayName,
  validateCaseData
};