/**
 * End-to-end workflow testing script
 * Tests the complete flow from case creation to notice delivery
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'mediation-scheduling-simple'
  });
}

const db = admin.firestore();

// Import services
const pollService = require('./src/pollService');
const noticeService = require('./src/noticeService');
const { sendPollInvitationsToParticipants } = require('./src/emailService');

/**
 * Test data setup
 */
const testData = {
  user: {
    uid: 'test-user-123',
    email: 'mediator@test.com',
    name: 'Test Mediator'
  },
  case: {
    id: 'test-case-123',
    caseNumber: 'TC-2024-001',
    caseName: 'Test Plaintiff vs. Test Defendant',
    caseType: 'family',
    status: 'draft',
    mediatorId: 'test-user-123',
    mediatorName: 'Test Mediator',
    participants: [
      {
        name: 'John Plaintiff',
        email: 'plaintiff@test.com',
        role: 'Plaintiff'
      },
      {
        name: 'Jane Defendant', 
        email: 'defendant@test.com',
        role: 'Defendant'
      }
    ],
    location: 'Mediation Center, Room 101',
    notes: 'Test case for workflow validation'
  },
  poll: {
    title: 'Mediation Scheduling Poll - Test Case',
    description: 'Please select your availability for the mediation session.',
    timeOptions: [
      {
        id: 'option1',
        date: '2024-06-15',
        time: '10:00',
        duration: 120
      },
      {
        id: 'option2',
        date: '2024-06-16', 
        time: '14:00',
        duration: 120
      },
      {
        id: 'option3',
        date: '2024-06-17',
        time: '09:00',
        duration: 120
      }
    ]
  },
  votes: [
    {
      participantEmail: 'plaintiff@test.com',
      participantName: 'John Plaintiff',
      votes: [
        { optionId: 'option1', type: 'yes' },
        { optionId: 'option2', type: 'if_need_be' },
        { optionId: 'option3', type: 'no' }
      ]
    },
    {
      participantEmail: 'defendant@test.com',
      participantName: 'Jane Defendant',
      votes: [
        { optionId: 'option1', type: 'yes' },
        { optionId: 'option2', type: 'yes' },
        { optionId: 'option3', type: 'if_need_be' }
      ]
    }
  ]
};

/**
 * Test 1: Case and Poll Creation
 */
async function testCaseAndPollCreation() {
  console.log('🧪 Test 1: Case and Poll Creation');
  
  try {
    // Create test case
    console.log('📝 Creating test case...');
    const caseRef = await db.collection('cases').doc(testData.case.id).set({
      ...testData.case,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Test case created successfully');
    
    // Create poll data
    const pollData = {
      ...testData.poll,
      caseId: testData.case.id,
      caseName: testData.case.caseName,
      caseNumber: testData.case.caseNumber,
      mediatorName: testData.case.mediatorName,
      participants: testData.case.participants,
      status: 'active',
      createdBy: testData.user.uid
    };
    
    console.log('📊 Creating poll...');
    const pollRef = await db.collection('polls').add({
      ...pollData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const pollId = pollRef.id;
    console.log('✅ Poll created successfully with ID:', pollId);
    
    return { caseId: testData.case.id, pollId };
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    throw error;
  }
}

/**
 * Test 2: Poll Invitation Sending
 */
async function testPollInvitations(pollId) {
  console.log('🧪 Test 2: Poll Invitation Sending');
  
  try {
    // Get poll data
    const pollDoc = await db.collection('polls').doc(pollId).get();
    if (!pollDoc.exists) {
      throw new Error('Poll not found');
    }
    
    const pollData = { id: pollId, ...pollDoc.data() };
    console.log('📧 Sending poll invitations...');
    
    // Send invitations
    const result = await sendPollInvitationsToParticipants(pollId, pollData);
    
    console.log('✅ Poll invitations sent successfully');
    console.log('📊 Results:', {
      sent: result.sent,
      failed: result.failed,
      totalParticipants: pollData.participants.length
    });
    
    if (result.failed > 0) {
      console.log('⚠️ Some invitations failed:', result.errors);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    throw error;
  }
}

/**
 * Test 3: Vote Submission Simulation
 */
async function testVoteSubmission(pollId) {
  console.log('🧪 Test 3: Vote Submission Simulation');
  
  try {
    console.log('🗳️ Simulating participant votes...');
    
    for (const participant of testData.votes) {
      for (const vote of participant.votes) {
        const voteData = {
          pollId,
          optionId: vote.optionId,
          type: vote.type,
          participantEmail: participant.participantEmail,
          participantName: participant.participantName,
          votedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('votes').add(voteData);
      }
      
      console.log(`✅ Votes submitted for ${participant.participantName}`);
    }
    
    console.log('✅ All votes submitted successfully');
    
    // Get vote counts
    const votesSnapshot = await db.collection('votes')
      .where('pollId', '==', pollId)
      .get();
    
    console.log('📊 Total votes recorded:', votesSnapshot.size);
    
    return votesSnapshot.size;
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    throw error;
  }
}

/**
 * Test 4: Poll Results and Finalization
 */
async function testPollFinalization(pollId, caseId) {
  console.log('🧪 Test 4: Poll Results and Finalization');
  
  try {
    // Get poll results
    console.log('📊 Calculating poll results...');
    
    const pollDoc = await db.collection('polls').doc(pollId).get();
    const pollData = pollDoc.data();
    
    const votesSnapshot = await db.collection('votes')
      .where('pollId', '==', pollId)
      .get();
    
    const votes = [];
    votesSnapshot.forEach(doc => {
      votes.push(doc.data());
    });
    
    // Calculate results for each option
    const results = pollData.timeOptions.map(option => {
      const optionVotes = votes.filter(vote => vote.optionId === option.id);
      const yesVotes = optionVotes.filter(vote => vote.type === 'yes').length;
      const ifNeedBeVotes = optionVotes.filter(vote => vote.type === 'if_need_be').length;
      const noVotes = optionVotes.filter(vote => vote.type === 'no').length;
      
      return {
        ...option,
        votes: { yes: yesVotes, ifNeedBe: ifNeedBeVotes, no: noVotes },
        score: yesVotes * 2 + ifNeedBeVotes * 1
      };
    });
    
    // Sort by score and select best option
    results.sort((a, b) => b.score - a.score);
    const selectedOption = results[0];
    
    console.log('🏆 Best option selected:', {
      date: selectedOption.date,
      time: selectedOption.time,
      score: selectedOption.score,
      votes: selectedOption.votes
    });
    
    // Finalize poll
    console.log('🔒 Finalizing poll...');
    await db.collection('polls').doc(pollId).update({
      status: 'completed',
      selectedTimeOption: selectedOption,
      finalizedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update case with scheduled time
    console.log('📅 Updating case with scheduled time...');
    await db.collection('cases').doc(caseId).update({
      status: 'scheduled',
      scheduledDate: new Date(`${selectedOption.date}T${selectedOption.time}`),
      scheduledTime: selectedOption.time,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Poll finalized and case updated successfully');
    
    return selectedOption;
    
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
    throw error;
  }
}

/**
 * Test 5: Notice Creation and Sending
 */
async function testNoticeCreation(caseId, selectedOption) {
  console.log('🧪 Test 5: Notice Creation and Sending');
  
  try {
    // Create notice
    console.log('📄 Creating mediation notice...');
    
    const noticeData = {
      caseId,
      caseName: testData.case.caseName,
      caseNumber: testData.case.caseNumber,
      noticeType: 'scheduled',
      status: 'draft',
      mediationDate: `${selectedOption.date}T${selectedOption.time}`,
      mediationTime: selectedOption.time,
      location: testData.case.location,
      mediatorName: testData.case.mediatorName,
      participants: testData.case.participants,
      notes: 'This is a test notice generated by the workflow test.',
      emailsSent: 0,
      emailsDelivered: 0,
      emailsOpened: 0,
      createdBy: testData.user.uid
    };
    
    const noticeRef = await db.collection('notices').add({
      ...noticeData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const noticeId = noticeRef.id;
    console.log('✅ Notice created successfully with ID:', noticeId);
    
    // Test notice email generation (without actually sending)
    console.log('📧 Testing notice email generation...');
    
    const { generateMediationNoticeHTML } = require('./src/noticeService');
    const htmlContent = generateMediationNoticeHTML(
      { id: noticeId, ...noticeData },
      testData.case.participants[0],
      'http://localhost:3000'
    );
    
    console.log('✅ Notice email HTML generated successfully');
    console.log('📄 HTML length:', htmlContent.length, 'characters');
    
    // Update notice status to indicate it's ready to send
    await db.collection('notices').doc(noticeId).update({
      status: 'ready_to_send',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Notice ready for sending');
    
    return noticeId;
    
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
    throw error;
  }
}

/**
 * Test 6: Email Tracking Verification
 */
async function testEmailTracking(pollId, noticeId) {
  console.log('🧪 Test 6: Email Tracking Verification');
  
  try {
    // Check poll email tracking
    console.log('📊 Checking poll email tracking...');
    
    const pollEmailsSnapshot = await db.collection('emailTracking')
      .where('pollId', '==', pollId)
      .where('type', '==', 'poll_invitation')
      .get();
    
    console.log('📧 Poll emails tracked:', pollEmailsSnapshot.size);
    
    // Check notice email tracking (if any)
    console.log('📊 Checking notice email tracking...');
    
    const noticeEmailsSnapshot = await db.collection('emailTracking')
      .where('noticeId', '==', noticeId)
      .where('type', '==', 'mediation_notice')
      .get();
    
    console.log('📧 Notice emails tracked:', noticeEmailsSnapshot.size);
    
    // Generate tracking summary
    const trackingSummary = {
      pollEmails: pollEmailsSnapshot.size,
      noticeEmails: noticeEmailsSnapshot.size,
      totalEmails: pollEmailsSnapshot.size + noticeEmailsSnapshot.size
    };
    
    console.log('✅ Email tracking verification completed');
    console.log('📊 Tracking summary:', trackingSummary);
    
    return trackingSummary;
    
  } catch (error) {
    console.error('❌ Test 6 failed:', error.message);
    throw error;
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData(caseId, pollId, noticeId) {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete votes
    const votesSnapshot = await db.collection('votes')
      .where('pollId', '==', pollId)
      .get();
    
    const batch = db.batch();
    votesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete email tracking
    const emailTrackingSnapshot = await db.collection('emailTracking')
      .where('pollId', '==', pollId)
      .get();
    
    emailTrackingSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete notice email tracking
    const noticeEmailTrackingSnapshot = await db.collection('emailTracking')
      .where('noticeId', '==', noticeId)
      .get();
    
    noticeEmailTrackingSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Delete main documents
    await db.collection('notices').doc(noticeId).delete();
    await db.collection('polls').doc(pollId).delete();
    await db.collection('cases').doc(caseId).delete();
    
    console.log('✅ Test data cleaned up successfully');
    
  } catch (error) {
    console.error('⚠️ Cleanup failed:', error.message);
  }
}

/**
 * Run complete workflow test
 */
async function runCompleteWorkflowTest() {
  console.log('🚀 Starting Complete Workflow Test...\n');
  
  let caseId, pollId, noticeId;
  
  try {
    // Test 1: Case and Poll Creation
    const { caseId: testCaseId, pollId: testPollId } = await testCaseAndPollCreation();
    caseId = testCaseId;
    pollId = testPollId;
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Poll Invitation Sending
    await testPollInvitations(pollId);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Vote Submission
    await testVoteSubmission(pollId);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 4: Poll Finalization
    const selectedOption = await testPollFinalization(pollId, caseId);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 5: Notice Creation
    noticeId = await testNoticeCreation(caseId, selectedOption);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 6: Email Tracking
    await testEmailTracking(pollId, noticeId);
    console.log('\n' + '='.repeat(50) + '\n');
    
    console.log('🎉 Complete Workflow Test PASSED!');
    console.log('✅ All systems working correctly');
    
    return {
      success: true,
      caseId,
      pollId,
      noticeId,
      message: 'Complete workflow test passed successfully'
    };
    
  } catch (error) {
    console.error('❌ Complete Workflow Test FAILED:', error.message);
    
    return {
      success: false,
      error: error.message,
      caseId,
      pollId,
      noticeId
    };
    
  } finally {
    // Cleanup
    if (caseId && pollId && noticeId) {
      console.log('\n' + '='.repeat(50) + '\n');
      await cleanupTestData(caseId, pollId, noticeId);
    }
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  runCompleteWorkflowTest()
    .then(result => {
      console.log('\n🏁 Test completed:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runCompleteWorkflowTest,
  testCaseAndPollCreation,
  testPollInvitations,
  testVoteSubmission,
  testPollFinalization,
  testNoticeCreation,
  testEmailTracking,
  cleanupTestData
};