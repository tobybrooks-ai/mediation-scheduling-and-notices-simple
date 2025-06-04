/**
 * Simple test script to verify email functionality
 * Run with: node test-email.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up credentials)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'mediation-scheduling-simple'
  });
}

const { sendPollInvitationsToParticipants } = require('./src/emailService');

async function testEmailSystem() {
  console.log('🧪 Testing Email System...');
  
  // Mock poll data
  const mockPollData = {
    id: 'test-poll-123',
    title: 'Test Mediation Scheduling Poll',
    description: 'Please select your availability for the mediation session.',
    caseId: 'test-case-123',
    caseName: 'Test Case vs. Test Defendant',
    caseNumber: 'TC-2024-001',
    mediatorName: 'Test Mediator',
    timeOptions: [
      {
        id: 'option1',
        date: '2024-06-10',
        time: '10:00',
        duration: 120,
        startTime: new Date('2024-06-10T10:00:00')
      },
      {
        id: 'option2', 
        date: '2024-06-11',
        time: '14:00',
        duration: 120,
        startTime: new Date('2024-06-11T14:00:00')
      }
    ],
    participants: [
      {
        name: 'Test Participant',
        email: 'test@example.com',
        role: 'Plaintiff'
      }
    ],
    createdBy: 'test-user-123',
    status: 'active'
  };
  
  try {
    console.log('📧 Sending test poll invitations...');
    
    const result = await sendPollInvitationsToParticipants('test-poll-123', mockPollData);
    
    console.log('✅ Email test completed successfully!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));
    
    if (result.sent > 0) {
      console.log(`🎉 Successfully sent ${result.sent} email(s)`);
    }
    
    if (result.failed > 0) {
      console.log(`❌ Failed to send ${result.failed} email(s)`);
      console.log('Errors:', result.errors);
    }
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test notice email system
async function testNoticeEmailSystem() {
  console.log('🧪 Testing Notice Email System...');
  
  // Mock notice data
  const mockNoticeData = {
    id: 'test-notice-123',
    caseId: 'test-case-123',
    caseName: 'Test Case vs. Test Defendant',
    caseNumber: 'TC-2024-001',
    noticeType: 'scheduled',
    mediationDate: '2024-06-15',
    mediationTime: '10:00',
    location: 'Mediation Center, Room 101',
    mediatorName: 'Test Mediator',
    participants: [
      {
        name: 'Test Participant',
        email: 'test@example.com',
        role: 'Plaintiff'
      }
    ],
    pdfFileName: null, // No PDF for this test
    pdfUrl: null,
    pdfStoragePath: null,
    status: 'draft'
  };
  
  try {
    console.log('📧 Testing notice email generation...');
    
    // Import notice service functions
    const { generateMediationNoticeHTML } = require('./src/noticeService');
    
    // Test HTML generation
    const htmlContent = generateMediationNoticeHTML(
      mockNoticeData, 
      mockNoticeData.participants[0], 
      'http://localhost:3000'
    );
    
    console.log('✅ Notice email HTML generated successfully!');
    console.log('📄 HTML length:', htmlContent.length, 'characters');
    
    // You could save this to a file to inspect
    const fs = require('fs');
    fs.writeFileSync('/tmp/test-notice-email.html', htmlContent);
    console.log('💾 Test email saved to /tmp/test-notice-email.html');
    
  } catch (error) {
    console.error('❌ Notice email test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Email System Tests...\n');
  
  // Test 1: Poll invitation emails
  await testEmailSystem();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Notice emails
  await testNoticeEmailSystem();
  
  console.log('\n🏁 All tests completed!');
}

// Check if this script is being run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testEmailSystem,
  testNoticeEmailSystem,
  runAllTests
};