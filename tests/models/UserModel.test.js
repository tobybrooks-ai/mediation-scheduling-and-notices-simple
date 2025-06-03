/**
 * Tests for UserModel
 */

import UserModel, {
  UserType,
  UserStatus,
  createUser,
  createParticipant,
  isValidUserType,
  isAdministrator,
  isMediator,
  getUserTypeDisplayName,
  getUserTypeOptions
} from '../../client/src/models/UserModel';

describe('UserModel', () => {
  describe('UserType constants', () => {
    test('should have correct user types', () => {
      expect(UserType.ADMINISTRATOR).toBe('administrator');
      expect(UserType.MEDIATOR).toBe('mediator');
    });
  });

  describe('UserStatus constants', () => {
    test('should have correct user statuses', () => {
      expect(UserStatus.ACTIVE).toBe('active');
      expect(UserStatus.INACTIVE).toBe('inactive');
      expect(UserStatus.PENDING).toBe('pending');
    });
  });

  describe('createUser', () => {
    test('should create user with required fields', () => {
      const userData = {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      const user = createUser(userData);

      expect(user.uid).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.displayName).toBe('Test User');
      expect(user.userType).toBe(UserType.MEDIATOR); // default
      expect(user.status).toBe(UserStatus.ACTIVE); // default
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('should create user with custom fields', () => {
      const userData = {
        uid: 'admin-123',
        email: 'admin@example.com',
        displayName: 'Admin User',
        userType: UserType.ADMINISTRATOR,
        status: UserStatus.PENDING,
        profileData: {
          phone: '555-1234',
          organization: 'Test Org'
        }
      };

      const user = createUser(userData);

      expect(user.userType).toBe(UserType.ADMINISTRATOR);
      expect(user.status).toBe(UserStatus.PENDING);
      expect(user.phone).toBe('555-1234');
      expect(user.organization).toBe('Test Org');
    });
  });

  describe('createParticipant', () => {
    test('should create participant with required fields', () => {
      const participantData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const participant = createParticipant(participantData);

      expect(participant.name).toBe('John Doe');
      expect(participant.email).toBe('john@example.com');
      expect(participant.role).toBe('participant'); // default
      expect(participant.id).toBeDefined();
      expect(participant.id).toMatch(/^participant_/);
    });

    test('should create participant with custom role', () => {
      const participantData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'attorney'
      };

      const participant = createParticipant(participantData);

      expect(participant.role).toBe('attorney');
    });
  });

  describe('isValidUserType', () => {
    test('should validate correct user types', () => {
      expect(isValidUserType(UserType.ADMINISTRATOR)).toBe(true);
      expect(isValidUserType(UserType.MEDIATOR)).toBe(true);
    });

    test('should reject invalid user types', () => {
      expect(isValidUserType('invalid')).toBe(false);
      expect(isValidUserType('')).toBe(false);
      expect(isValidUserType(null)).toBe(false);
      expect(isValidUserType(undefined)).toBe(false);
    });
  });

  describe('isAdministrator', () => {
    test('should identify administrator users', () => {
      const adminUser = { userType: UserType.ADMINISTRATOR };
      const mediatorUser = { userType: UserType.MEDIATOR };

      expect(isAdministrator(adminUser)).toBe(true);
      expect(isAdministrator(mediatorUser)).toBe(false);
      expect(isAdministrator(null)).toBe(false);
      expect(isAdministrator({})).toBe(false);
    });
  });

  describe('isMediator', () => {
    test('should identify mediator users', () => {
      const adminUser = { userType: UserType.ADMINISTRATOR };
      const mediatorUser = { userType: UserType.MEDIATOR };

      expect(isMediator(adminUser)).toBe(false);
      expect(isMediator(mediatorUser)).toBe(true);
      expect(isMediator(null)).toBe(false);
      expect(isMediator({})).toBe(false);
    });
  });

  describe('getUserTypeDisplayName', () => {
    test('should return correct display names', () => {
      expect(getUserTypeDisplayName(UserType.ADMINISTRATOR)).toBe('Administrator');
      expect(getUserTypeDisplayName(UserType.MEDIATOR)).toBe('Mediator');
      expect(getUserTypeDisplayName('invalid')).toBe('Unknown');
    });
  });

  describe('getUserTypeOptions', () => {
    test('should return form options array', () => {
      const options = getUserTypeOptions();

      expect(Array.isArray(options)).toBe(true);
      expect(options).toHaveLength(2);
      
      expect(options[0]).toEqual({
        value: UserType.MEDIATOR,
        label: 'Mediator'
      });
      
      expect(options[1]).toEqual({
        value: UserType.ADMINISTRATOR,
        label: 'Administrator'
      });
    });
  });

  describe('default export', () => {
    test('should export all functions and constants', () => {
      expect(UserModel.UserType).toBeDefined();
      expect(UserModel.UserStatus).toBeDefined();
      expect(UserModel.createUser).toBeDefined();
      expect(UserModel.createParticipant).toBeDefined();
      expect(UserModel.isValidUserType).toBeDefined();
      expect(UserModel.isAdministrator).toBeDefined();
      expect(UserModel.isMediator).toBeDefined();
      expect(UserModel.getUserTypeDisplayName).toBeDefined();
      expect(UserModel.getUserTypeOptions).toBeDefined();
    });
  });
});