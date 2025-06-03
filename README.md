# Mediation Scheduling and Notices - Simplified

A simplified mediation scheduling and notice management platform built with Firebase and React.

## Overview

This platform enables mediators to:
- Create and manage mediation cases
- Schedule mediations via polling system
- Upload and send mediation notices with PDF attachments
- Track email delivery and engagement

## User Types

1. **Administrators** - Platform-level configuration
2. **Mediators** - Sign up, create cases, manage scheduling and notices
3. **Public Participants** - Vote on polls and receive notices via email (no signup required)

## Core Features

### Case Management
- Create cases with essential fields (name, number, type, participants)
- Manage case status and details
- Link cases to polls and notices

### Scheduling Polls
- Create scheduling polls from cases
- Public voting interface (no login required)
- Email invitations with direct voting links
- Poll finalization and mediation scheduling

### Mediation Notices
- Upload mediation notice PDFs
- Send notice emails with PDF attachments
- Track email delivery and opens
- Notice status management

### Email System
- Fixed and reliable email delivery
- HTML email templates
- Email tracking and analytics
- Attachment support for PDFs

## Technology Stack

- **Frontend**: React 18, Tailwind CSS, Firebase SDK v9
- **Backend**: Firebase (Auth, Firestore, Functions, Hosting, Storage)
- **Email**: SMTP2Go
- **Testing**: Jest, React Testing Library

## Project Structure

```
mediation-scheduling-and-notices-simple/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── cases/      # Case management components
│   │   │   ├── polling/    # Scheduling poll components
│   │   │   ├── notices/    # Notice management components
│   │   │   ├── ui/         # Shared UI components
│   │   │   └── forms/      # Form components
│   │   ├── pages/          # Page components
│   │   ├── services/       # Firebase and API services
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
├── functions/             # Cloud Functions
│   └── src/
│       ├── emailService.js    # Email system
│       ├── noticeService.js   # Notice management
│       ├── fileService.js     # PDF upload/storage
│       └── trackingService.js # Email tracking
├── tests/                 # Test files
└── firebase.json          # Firebase configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI
- SMTP2Go account for email delivery

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Firebase: `firebase init`
4. Set up environment variables
5. Deploy functions: `firebase deploy --only functions`
6. Start development server: `npm start`

## Development Workflow

1. **Case Creation**: Mediator creates case with participant emails
2. **Poll Creation**: Mediator creates scheduling poll from case
3. **Public Voting**: Participants vote via email links
4. **Poll Finalization**: Mediator selects final date/time
5. **Notice Upload**: Mediator uploads mediation notice PDF
6. **Notice Delivery**: System sends emails with PDF attachments
7. **Tracking**: Monitor email delivery and engagement

## Development Status

✅ **Phase 1: Foundation & Data Models** (Completed)
- [x] Repository structure and configuration
- [x] Enhanced data models for Cases, Polls, Notices, Email Tracking
- [x] Firebase configuration (Firestore, Storage, Functions, Hosting)
- [x] Cloud Functions backend services
- [x] Testing infrastructure setup
- [x] Security rules and access controls
- [x] Email service with SMTP2Go integration
- [x] File upload system for PDFs

🚧 **Phase 2: Core Functionality** (Ready to Start)
- [ ] Fix broken email invitation system
- [ ] Migrate core components from original repository
- [ ] Implement authentication and user management
- [ ] Build case management interface
- [ ] Create polling system UI

📋 **Phase 3: Notice Management** (Planned)
- [ ] PDF upload functionality for mediation notices
- [ ] Notice creation and management interface
- [ ] Email delivery system integration

📧 **Phase 4: Email & Notifications** (Planned)
- [ ] Notice email system with PDF attachments
- [ ] Email tracking and delivery confirmation
- [ ] Retry mechanisms for failed emails

✅ **Phase 5: Testing & Integration** (Planned)
- [ ] Comprehensive testing suite
- [ ] End-to-end workflow validation
- [ ] Performance optimization

## Testing

- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e`

## Deployment

- Development: `firebase serve`
- Production: `firebase deploy`

## License

MIT License
