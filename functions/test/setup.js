/**
 * Test setup for Cloud Functions
 */

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    batch: jest.fn(),
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date()),
      arrayUnion: jest.fn(),
      arrayRemove: jest.fn(),
      increment: jest.fn(),
      delete: jest.fn()
    }
  })),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        exists: jest.fn(() => Promise.resolve([true])),
        getMetadata: jest.fn(() => Promise.resolve([{ size: 1024, contentType: 'application/pdf' }])),
        getSignedUrl: jest.fn(() => Promise.resolve(['https://example.com/signed-url'])),
        delete: jest.fn(() => Promise.resolve()),
        download: jest.fn(() => Promise.resolve([Buffer.from('test pdf content')]))
      }))
    }))
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(() => Promise.resolve({
      uid: 'test-user-123',
      email: 'test@example.com'
    })),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
  }))
}));

// Mock Firebase Functions
jest.mock('firebase-functions/v1', () => ({
  config: jest.fn(() => ({
    smtp2go: {
      username: 'test-username',
      password: 'test-password',
      from_email: 'test@example.com'
    }
  })),
  https: {
    onRequest: jest.fn((handler) => handler)
  },
  firestore: {
    document: jest.fn(() => ({
      onCreate: jest.fn(),
      onUpdate: jest.fn(),
      onDelete: jest.fn()
    }))
  }
}));

// Mock Nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({
      messageId: 'test-message-id-123',
      accepted: ['test@example.com'],
      rejected: []
    }))
  }))
}));

// Mock CORS
jest.mock('cors', () => {
  return jest.fn(() => (req, res, next) => {
    if (typeof next === 'function') {
      next();
    }
  });
});

// Global test data
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
    }
  ],
  participants: [
    { id: 'p1', name: 'John Doe', email: 'john@example.com' },
    { id: 'p2', name: 'Jane Smith', email: 'jane@example.com' }
  ],
  status: 'active',
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
  pdfFileName: 'test-notice.pdf',
  pdfUrl: 'https://example.com/test-notice.pdf',
  pdfStoragePath: 'notices/case-123/test-notice.pdf',
  emailsSent: 0,
  emailsDelivered: 0,
  emailsOpened: 0,
  createdBy: 'test-user-123',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock request and response objects
global.createMockRequest = (overrides = {}) => ({
  headers: {
    authorization: 'Bearer test-token',
    'content-type': 'application/json'
  },
  body: {},
  query: {},
  params: {},
  method: 'GET',
  url: '/',
  ...overrides
});

global.createMockResponse = () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    set: jest.fn(() => res),
    end: jest.fn(() => res)
  };
  return res;
};

// Helper functions
global.createMockFirestoreDoc = (data = {}) => ({
  id: 'test-doc-id',
  exists: true,
  data: () => data,
  ref: {
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve())
  }
});

global.createMockFirestoreCollection = (docs = []) => ({
  add: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
  doc: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve(global.createMockFirestoreDoc())),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve())
  })),
  where: jest.fn(() => ({
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          empty: docs.length === 0,
          docs: docs.map(doc => global.createMockFirestoreDoc(doc))
        }))
      })),
      get: jest.fn(() => Promise.resolve({
        empty: docs.length === 0,
        docs: docs.map(doc => global.createMockFirestoreDoc(doc)),
        forEach: jest.fn(callback => docs.forEach((doc, index) => 
          callback(global.createMockFirestoreDoc(doc), index)
        ))
      }))
    })),
    get: jest.fn(() => Promise.resolve({
      empty: docs.length === 0,
      docs: docs.map(doc => global.createMockFirestoreDoc(doc))
    }))
  })),
  orderBy: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({
      empty: docs.length === 0,
      docs: docs.map(doc => global.createMockFirestoreDoc(doc)),
      forEach: jest.fn(callback => docs.forEach((doc, index) => 
        callback(global.createMockFirestoreDoc(doc), index)
      ))
    }))
  })),
  get: jest.fn(() => Promise.resolve({
    empty: docs.length === 0,
    docs: docs.map(doc => global.createMockFirestoreDoc(doc)),
    forEach: jest.fn(callback => docs.forEach((doc, index) => 
      callback(global.createMockFirestoreDoc(doc), index)
    ))
  }))
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});