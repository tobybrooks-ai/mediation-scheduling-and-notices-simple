// Mock data for testing UI components
export const mockCases = [
  {
    id: 'case-1',
    caseNumber: 'FAM-2024-001',
    caseName: 'Smith vs. Johnson',
    caseType: 'family',
    status: 'scheduled',
    mediatorId: 'mock-user-123',
    mediatorName: 'Test Mediator',
    participants: [
      { name: 'John Smith', email: 'john.smith@email.com', role: 'Petitioner' },
      { name: 'Jane Johnson', email: 'jane.johnson@email.com', role: 'Respondent' }
    ],
    location: 'Conference Room A',
    scheduledDate: new Date('2024-06-15T10:00:00'),
    scheduledTime: '10:00 AM',
    notes: 'Child custody mediation',
    createdAt: new Date('2024-06-01T09:00:00'),
    updatedAt: new Date('2024-06-01T09:00:00')
  },
  {
    id: 'case-2',
    caseNumber: 'CIV-2024-002',
    caseName: 'ABC Corp vs. XYZ Inc',
    caseType: 'circuit',
    status: 'draft',
    mediatorId: 'mock-user-123',
    mediatorName: 'Test Mediator',
    participants: [
      { name: 'Robert Wilson', email: 'r.wilson@abccorp.com', role: 'Plaintiff Attorney' },
      { name: 'Sarah Davis', email: 's.davis@xyzinc.com', role: 'Defendant Attorney' }
    ],
    notes: 'Contract dispute mediation',
    createdAt: new Date('2024-06-02T14:30:00'),
    updatedAt: new Date('2024-06-02T14:30:00')
  }
];

export const mockPolls = [
  {
    id: 'poll-1',
    caseId: 'case-1',
    caseNumber: 'FAM-2024-001',
    caseName: 'Smith vs. Johnson',
    title: 'Mediation Scheduling Poll',
    description: 'Please select your preferred times for the mediation session',
    status: 'active',
    timeSlots: [
      {
        id: 'slot-1',
        date: '2024-06-15',
        time: '10:00 AM',
        votes: [
          { participantEmail: 'john.smith@email.com', available: true },
          { participantEmail: 'jane.johnson@email.com', available: true }
        ]
      },
      {
        id: 'slot-2',
        date: '2024-06-15',
        time: '2:00 PM',
        votes: [
          { participantEmail: 'john.smith@email.com', available: false },
          { participantEmail: 'jane.johnson@email.com', available: true }
        ]
      }
    ],
    participants: [
      { name: 'John Smith', email: 'john.smith@email.com' },
      { name: 'Jane Johnson', email: 'jane.johnson@email.com' }
    ],
    createdBy: 'mock-user-123',
    createdAt: new Date('2024-06-01T09:30:00'),
    updatedAt: new Date('2024-06-01T09:30:00'),
    expiresAt: new Date('2024-06-10T23:59:59')
  }
];

export const mockNotices = [
  {
    id: 'notice-1',
    caseId: 'case-1',
    caseNumber: 'FAM-2024-001',
    caseName: 'Smith vs. Johnson',
    noticeType: 'scheduled',
    status: 'sent',
    mediationDate: new Date('2024-06-15T10:00:00'),
    mediationTime: '10:00 AM',
    location: 'Conference Room A',
    mediatorName: 'Test Mediator',
    participants: [
      { name: 'John Smith', email: 'john.smith@email.com', role: 'Petitioner' },
      { name: 'Jane Johnson', email: 'jane.johnson@email.com', role: 'Respondent' }
    ],
    pdfFileName: 'mediation-notice-FAM-2024-001.pdf',
    pdfUrl: '/mock-files/mediation-notice-FAM-2024-001.pdf',
    pdfStoragePath: 'notices/case-1/mediation-notice-FAM-2024-001.pdf',
    pdfUploadedAt: new Date('2024-06-01T10:00:00'),
    sentAt: new Date('2024-06-01T10:30:00'),
    emailsSent: 2,
    emailsDelivered: 2,
    emailsOpened: 1,
    createdBy: 'mock-user-123',
    createdAt: new Date('2024-06-01T10:00:00'),
    updatedAt: new Date('2024-06-01T10:30:00')
  }
];

export const mockEmailTracking = [
  {
    id: 'email-1',
    type: 'poll_invitation',
    pollId: 'poll-1',
    caseId: 'case-1',
    participantEmail: 'john.smith@email.com',
    emailId: 'smtp-123456',
    sentAt: new Date('2024-06-01T09:45:00'),
    openedAt: new Date('2024-06-01T11:20:00'),
    status: 'opened',
    emailSubject: 'Mediation Scheduling Poll - FAM-2024-001',
    hasAttachment: false,
    createdAt: new Date('2024-06-01T09:45:00'),
    updatedAt: new Date('2024-06-01T11:20:00')
  },
  {
    id: 'email-2',
    type: 'mediation_notice',
    noticeId: 'notice-1',
    caseId: 'case-1',
    participantEmail: 'john.smith@email.com',
    emailId: 'smtp-789012',
    sentAt: new Date('2024-06-01T10:30:00'),
    openedAt: new Date('2024-06-01T14:15:00'),
    status: 'opened',
    emailSubject: 'Mediation Notice - FAM-2024-001',
    hasAttachment: true,
    attachmentName: 'mediation-notice-FAM-2024-001.pdf',
    createdAt: new Date('2024-06-01T10:30:00'),
    updatedAt: new Date('2024-06-01T14:15:00')
  }
];

export const mockActivityTimeline = [
  {
    id: 'activity-1',
    type: 'case_created',
    caseId: 'case-1',
    title: 'Case Created',
    description: 'Case FAM-2024-001 "Smith vs. Johnson" was created',
    createdAt: new Date('2024-06-01T09:00:00'),
    createdBy: 'Test Mediator'
  },
  {
    id: 'activity-2',
    type: 'poll_created',
    caseId: 'case-1',
    pollId: 'poll-1',
    title: 'Scheduling Poll Created',
    description: 'Scheduling poll sent to participants',
    createdAt: new Date('2024-06-01T09:30:00'),
    createdBy: 'Test Mediator'
  },
  {
    id: 'activity-3',
    type: 'poll_vote',
    caseId: 'case-1',
    pollId: 'poll-1',
    title: 'Poll Vote Received',
    description: 'John Smith voted on scheduling poll',
    createdAt: new Date('2024-06-01T11:20:00'),
    createdBy: 'John Smith'
  },
  {
    id: 'activity-4',
    type: 'notice_sent',
    caseId: 'case-1',
    noticeId: 'notice-1',
    title: 'Mediation Notice Sent',
    description: 'Mediation notice sent to all participants',
    createdAt: new Date('2024-06-01T10:30:00'),
    createdBy: 'Test Mediator'
  }
];

// Mock service functions that return promises to simulate async operations
export const getMockCases = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockCases), 500);
  });
};

export const getMockCase = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const caseData = mockCases.find(c => c.id === id);
      resolve(caseData);
    }, 300);
  });
};

export const getMockPolls = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockPolls), 500);
  });
};

export const getMockPollsForCase = (caseId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const polls = mockPolls.filter(p => p.caseId === caseId);
      resolve(polls);
    }, 300);
  });
};

export const getMockNotices = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockNotices), 500);
  });
};

export const getMockNoticesForCase = (caseId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const notices = mockNotices.filter(n => n.caseId === caseId);
      resolve(notices);
    }, 300);
  });
};

export const getMockEmailTracking = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockEmailTracking), 500);
  });
};

export const getMockActivityTimeline = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockActivityTimeline), 500);
  });
};