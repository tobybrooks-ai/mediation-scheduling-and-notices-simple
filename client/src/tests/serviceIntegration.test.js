/**
 * Frontend Service Integration Tests
 * Tests the frontend services without requiring a running backend
 */

// Mock Firebase auth
const mockAuth = {
  currentUser: {
    uid: 'test-user-123',
    email: 'test@example.com',
    getIdToken: jest.fn().mockResolvedValue('mock-token')
  }
};

// Mock fetch
global.fetch = jest.fn();

// Mock services
jest.mock('../config/firebase', () => ({
  auth: mockAuth,
  functions: {}
}));

jest.mock('../services/authService', () => ({
  getCurrentUserToken: jest.fn().mockResolvedValue('mock-token')
}));

// Import services to test
import * as pollService from '../services/pollService';
import * as noticeService from '../services/noticeService';
import * as fileService from '../services/fileService';

describe('Poll Service Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('createPoll should make authenticated request', async () => {
    const mockPollData = {
      title: 'Test Poll',
      caseId: 'test-case-123',
      timeOptions: [
        { date: '2024-06-15', time: '10:00', duration: 120 }
      ],
      participants: [
        { name: 'Test User', email: 'test@example.com' }
      ]
    };

    const mockResponse = { id: 'poll-123', ...mockPollData };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse)
    });

    const result = await pollService.createPoll(mockPollData);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/createPoll'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(mockPollData)
      })
    );

    expect(result).toEqual(mockResponse);
  });

  test('getPolls should fetch user polls', async () => {
    const mockPolls = [
      { id: 'poll-1', title: 'Poll 1' },
      { id: 'poll-2', title: 'Poll 2' }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockPolls)
    });

    const result = await pollService.getPolls();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/getPolls'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );

    expect(result).toEqual(mockPolls);
  });

  test('validatePollData should validate poll data correctly', () => {
    const validPollData = {
      title: 'Valid Poll',
      caseId: 'case-123',
      options: [
        { startTime: new Date(), duration: 60 }
      ],
      participants: [
        { email: 'test@example.com' }
      ]
    };

    const result = pollService.validatePollData(validPollData);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  test('validatePollData should catch validation errors', () => {
    const invalidPollData = {
      title: '', // Empty title
      caseId: '', // Empty case ID
      options: [], // No options
      participants: [
        { email: 'invalid-email' } // Invalid email
      ]
    };

    const result = pollService.validatePollData(invalidPollData);
    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.caseId).toBeDefined();
    expect(result.errors.options).toBeDefined();
  });
});

describe('Notice Service Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('createNotice should make authenticated request', async () => {
    const mockNoticeData = {
      caseId: 'case-123',
      caseName: 'Test Case',
      caseNumber: 'TC-001',
      noticeType: 'scheduled',
      mediationDate: '2024-06-15',
      mediationTime: '10:00',
      location: 'Test Location',
      participants: [
        { name: 'Test User', email: 'test@example.com' }
      ]
    };

    const mockResponse = { id: 'notice-123', ...mockNoticeData };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse)
    });

    const result = await noticeService.createNotice(mockNoticeData);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/createNotice'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        }),
        body: JSON.stringify(mockNoticeData)
      })
    );

    expect(result).toEqual(mockResponse);
  });

  test('validateNoticeData should validate notice data correctly', () => {
    const validNoticeData = {
      caseId: 'case-123',
      caseName: 'Valid Case',
      caseNumber: 'VC-001',
      noticeType: 'scheduled',
      mediationDate: '2024-06-15',
      mediationTime: '10:00',
      location: 'Valid Location',
      participants: [
        { email: 'test@example.com' }
      ]
    };

    const result = noticeService.validateNoticeData(validNoticeData);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  test('formatNoticeForDisplay should format notice correctly', () => {
    const mockNotice = {
      id: 'notice-123',
      caseName: 'Test Case',
      status: 'sent',
      noticeType: 'scheduled',
      participants: [
        { email: 'test1@example.com' },
        { email: 'test2@example.com' }
      ],
      pdfFileName: 'notice.pdf',
      pdfUrl: 'https://example.com/notice.pdf',
      createdAt: { seconds: 1640995200 }, // Mock Firestore timestamp
      mediationDate: '2024-06-15'
    };

    const result = noticeService.formatNoticeForDisplay(mockNotice);

    expect(result.statusDisplay).toBe('Sent');
    expect(result.noticeTypeDisplay).toBe('Scheduled');
    expect(result.participantCount).toBe(2);
    expect(result.hasAttachment).toBe(true);
    expect(result.createdAtFormatted).toBeDefined();
    expect(result.mediationDateFormatted).toBeDefined();
  });
});

describe('File Service Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('validatePDFFile should validate PDF files correctly', () => {
    const validPDFFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const result = fileService.validatePDFFile(validPDFFile);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validatePDFFile should reject non-PDF files', () => {
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const result = fileService.validatePDFFile(invalidFile);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Only PDF files are allowed');
  });

  test('validatePDFFile should reject oversized files', () => {
    // Create a mock file that's too large (over 10MB)
    const oversizedFile = {
      name: 'large.pdf',
      type: 'application/pdf',
      size: 11 * 1024 * 1024 // 11MB
    };
    
    const result = fileService.validatePDFFile(oversizedFile);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('File size must be less than'))).toBe(true);
  });

  test('formatFileSize should format bytes correctly', () => {
    expect(fileService.formatFileSize(0)).toBe('0 Bytes');
    expect(fileService.formatFileSize(1024)).toBe('1 KB');
    expect(fileService.formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(fileService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  test('generateSafeFilename should sanitize filenames', () => {
    expect(fileService.generateSafeFilename('test file.pdf')).toBe('test_file.pdf');
    expect(fileService.generateSafeFilename('test@#$%file.pdf')).toBe('test____file.pdf');
    expect(fileService.generateSafeFilename('___test___file___.pdf')).toBe('test___file.pdf');
  });

  test('getUploadUrl should make authenticated request', async () => {
    const mockResponse = {
      signedUrl: 'https://storage.googleapis.com/signed-url',
      filePath: 'notices/case-123/file.pdf',
      fileName: 'file.pdf'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse)
    });

    const result = await fileService.getUploadUrl('case-123', 'test.pdf', 'application/pdf');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/getUploadUrl'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );

    expect(result).toEqual(mockResponse);
  });
});

describe('Service Error Handling', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('services should handle network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(pollService.getPolls()).rejects.toThrow('Network error');
  });

  test('services should handle HTTP errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: jest.fn().mockResolvedValue({ error: 'Resource not found' })
    });

    await expect(pollService.getPolls()).rejects.toThrow('Resource not found');
  });

  test('services should handle authentication errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: jest.fn().mockResolvedValue({ error: 'Unauthorized' })
    });

    await expect(noticeService.getNoticesForCase('case-123')).rejects.toThrow('Unauthorized');
  });
});

describe('Data Transformation and Utilities', () => {
  test('poll statistics calculation', () => {
    const mockPolls = [
      { status: 'active', participants: [1, 2], options: [1, 2, 3] },
      { status: 'completed', participants: [1], options: [1, 2] },
      { status: 'cancelled', participants: [1, 2, 3], options: [1] }
    ];

    const stats = pollService.getPollStatistics(mockPolls);

    expect(stats.total).toBe(3);
    expect(stats.active).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.cancelled).toBe(1);
    expect(stats.totalParticipants).toBe(6);
    expect(stats.totalOptions).toBe(6);
  });

  test('notice statistics calculation', () => {
    const mockNotices = [
      { 
        status: 'draft', 
        pdfFileName: null, 
        emailsSent: 0, 
        emailsDelivered: 0 
      },
      { 
        status: 'sent', 
        pdfFileName: 'notice.pdf', 
        pdfUrl: 'url', 
        emailsSent: 2, 
        emailsDelivered: 2 
      },
      { 
        status: 'delivered', 
        pdfFileName: 'notice2.pdf', 
        pdfUrl: 'url2', 
        emailsSent: 3, 
        emailsDelivered: 3 
      }
    ];

    const stats = noticeService.getNoticeStatistics(mockNotices);

    expect(stats.total).toBe(3);
    expect(stats.draft).toBe(1);
    expect(stats.sent).toBe(1);
    expect(stats.delivered).toBe(1);
    expect(stats.withAttachments).toBe(2);
    expect(stats.totalEmailsSent).toBe(5);
    expect(stats.totalEmailsDelivered).toBe(5);
  });

  test('search functionality', () => {
    const mockPolls = [
      { title: 'Family Mediation', caseNumber: 'FM-001' },
      { title: 'Business Dispute', caseNumber: 'BD-002' },
      { title: 'Property Settlement', caseNumber: 'PS-003' }
    ];

    const familyResults = pollService.searchPolls(mockPolls, 'family');
    expect(familyResults).toHaveLength(1);
    expect(familyResults[0].title).toBe('Family Mediation');

    const caseResults = pollService.searchPolls(mockPolls, 'BD-002');
    expect(caseResults).toHaveLength(1);
    expect(caseResults[0].caseNumber).toBe('BD-002');

    const emptyResults = pollService.searchPolls(mockPolls, '');
    expect(emptyResults).toHaveLength(3);
  });

  test('sorting functionality', () => {
    const mockNotices = [
      { caseName: 'Charlie Case', createdAt: { seconds: 1640995200 } },
      { caseName: 'Alpha Case', createdAt: { seconds: 1640995300 } },
      { caseName: 'Beta Case', createdAt: { seconds: 1640995100 } }
    ];

    const sortedByName = noticeService.sortNotices(mockNotices, 'caseName', 'asc');
    expect(sortedByName[0].caseName).toBe('Alpha Case');
    expect(sortedByName[2].caseName).toBe('Charlie Case');

    const sortedByDate = noticeService.sortNotices(mockNotices, 'createdAt', 'desc');
    expect(sortedByDate[0].createdAt.seconds).toBe(1640995300);
    expect(sortedByDate[2].createdAt.seconds).toBe(1640995100);
  });
});

describe('File Upload Progress and Error Handling', () => {
  test('upload progress messages', () => {
    expect(fileService.getUploadProgressMessage(10)).toBe('Starting upload...');
    expect(fileService.getUploadProgressMessage(30)).toBe('Uploading...');
    expect(fileService.getUploadProgressMessage(60)).toBe('Almost there...');
    expect(fileService.getUploadProgressMessage(90)).toBe('Finalizing...');
    expect(fileService.getUploadProgressMessage(100)).toBe('Upload complete!');
  });

  test('file upload error handling', () => {
    expect(fileService.handleFileUploadError(new Error('Unauthorized')))
      .toContain('not authorized');
    
    expect(fileService.handleFileUploadError(new Error('File too large')))
      .toContain('too large');
    
    expect(fileService.handleFileUploadError(new Error('Invalid file type')))
      .toContain('Only PDF files');
    
    expect(fileService.handleFileUploadError(new Error('Network error')))
      .toContain('Network error');
    
    expect(fileService.handleFileUploadError(new Error('Unknown error')))
      .toContain('Unknown error');
  });

  test('file preview creation', () => {
    const mockFile = new File(['test content'], 'test.pdf', { 
      type: 'application/pdf',
      lastModified: 1640995200000
    });

    const preview = fileService.createFilePreview(mockFile);

    expect(preview.name).toBe('test.pdf');
    expect(preview.type).toBe('application/pdf');
    expect(preview.isPDF).toBe(true);
    expect(preview.isValid).toBe(true);
    expect(preview.sizeFormatted).toBeDefined();
    expect(preview.lastModifiedFormatted).toBeDefined();
  });
});