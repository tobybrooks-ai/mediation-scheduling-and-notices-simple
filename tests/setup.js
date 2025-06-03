/**
 * Test setup and configuration
 */

// Mock Firebase for testing
jest.mock('../client/src/config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    createUserWithEmailAndPassword: jest.fn()
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn()
  },
  storage: {
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
    deleteObject: jest.fn()
  },
  functions: {
    httpsCallable: jest.fn()
  }
}));

// Mock environment variables
process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project';
process.env.REACT_APP_API_BASE_URL = 'http://localhost:5001/test-project/us-central1';
process.env.REACT_APP_USE_FIREBASE_EMULATORS = 'true';

// Global test utilities
global.mockFirebaseUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

global.mockCaseData = {
  id: 'case-123',
  caseNumber: 'TEST-001',
  caseName: 'Test Case',
  caseType: 'family',
  mediatorId: 'test-user-123',
  mediatorName: 'Test Mediator',
  participants: [
    { id: 'p1', name: 'John Doe', email: 'john@example.com', role: 'participant' },
    { id: 'p2', name: 'Jane Smith', email: 'jane@example.com', role: 'participant' }
  ],
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

global.mockPollData = {
  id: 'poll-123',
  caseId: 'case-123',
  caseNumber: 'TEST-001',
  caseName: 'Test Case',
  title: 'Test Poll',
  description: 'Test poll description',
  location: 'Test Location',
  timeZone: 'America/New_York',
  options: [
    {
      id: 'option-1',
      date: '2024-01-15',
      time: '10:00',
      duration: 60,
      location: 'Conference Room A'
    },
    {
      id: 'option-2',
      date: '2024-01-16',
      time: '14:00',
      duration: 60,
      location: 'Conference Room B'
    }
  ],
  participants: [
    { id: 'p1', name: 'John Doe', email: 'john@example.com' },
    { id: 'p2', name: 'Jane Smith', email: 'jane@example.com' }
  ],
  status: 'draft',
  createdBy: 'test-user-123',
  emailsSent: 0,
  emailsDelivered: 0,
  votesReceived: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

global.mockNoticeData = {
  id: 'notice-123',
  caseId: 'case-123',
  caseNumber: 'TEST-001',
  caseName: 'Test Case',
  noticeType: 'scheduled',
  status: 'draft',
  mediationDate: '2024-01-15T10:00:00.000Z',
  mediationTime: '10:00',
  location: 'Conference Room A',
  mediatorName: 'Test Mediator',
  participants: [
    { id: 'p1', name: 'John Doe', email: 'john@example.com' },
    { id: 'p2', name: 'Jane Smith', email: 'jane@example.com' }
  ],
  pdfFileName: null,
  pdfUrl: null,
  pdfStoragePath: null,
  emailsSent: 0,
  emailsDelivered: 0,
  emailsOpened: 0,
  createdBy: 'test-user-123',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Test helper functions
global.createMockUser = (overrides = {}) => ({
  ...global.mockFirebaseUser,
  ...overrides
});

global.createMockCase = (overrides = {}) => ({
  ...global.mockCaseData,
  ...overrides
});

global.createMockPoll = (overrides = {}) => ({
  ...global.mockPollData,
  ...overrides
});

global.createMockNotice = (overrides = {}) => ({
  ...global.mockNoticeData,
  ...overrides
});

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Console error suppression for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});