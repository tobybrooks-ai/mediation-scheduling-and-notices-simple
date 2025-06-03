/**
 * User Model - Simplified for 3 user types
 */

export const UserType = {
  ADMINISTRATOR: 'administrator',
  MEDIATOR: 'mediator'
  // Note: Public participants don't have accounts
};

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending'
};

/**
 * User data structure
 */
export const createUser = ({
  uid,
  email,
  displayName,
  userType = UserType.MEDIATOR,
  status = UserStatus.ACTIVE,
  profileData = {}
}) => ({
  uid,
  email,
  displayName,
  userType,
  status,
  ...profileData,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

/**
 * Participant data structure (for cases and polls)
 * These are not users - just contact information
 */
export const createParticipant = ({
  name,
  email,
  role = 'participant'
}) => ({
  name,
  email,
  role,
  id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
});

/**
 * User type validation
 */
export const isValidUserType = (userType) => {
  return Object.values(UserType).includes(userType);
};

/**
 * Check if user is administrator
 */
export const isAdministrator = (user) => {
  return user && user.userType === UserType.ADMINISTRATOR;
};

/**
 * Check if user is mediator
 */
export const isMediator = (user) => {
  return user && user.userType === UserType.MEDIATOR;
};

/**
 * Get user type display name
 */
export const getUserTypeDisplayName = (userType) => {
  switch (userType) {
    case UserType.ADMINISTRATOR:
      return 'Administrator';
    case UserType.MEDIATOR:
      return 'Mediator';
    default:
      return 'Unknown';
  }
};

/**
 * Get user type options for forms
 */
export const getUserTypeOptions = () => [
  { value: UserType.MEDIATOR, label: 'Mediator' },
  { value: UserType.ADMINISTRATOR, label: 'Administrator' }
];

export default {
  UserType,
  UserStatus,
  createUser,
  createParticipant,
  isValidUserType,
  isAdministrator,
  isMediator,
  getUserTypeDisplayName,
  getUserTypeOptions
};