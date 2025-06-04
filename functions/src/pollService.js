const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Get all polls for a user (mediator)
 */
const getPolls = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const pollsSnapshot = await db.collection('polls')
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const polls = [];
    for (const doc of pollsSnapshot.docs) {
      const pollData = doc.data();
      
      // Get vote count for each poll
      const votesSnapshot = await db.collection('polls').doc(doc.id).collection('votes').get();
      const voteCount = votesSnapshot.size;
      
      polls.push({
        id: doc.id,
        ...pollData,
        voteCount
      });
    }

    return res.status(200).json(polls);
  } catch (error) {
    console.error('Error getting polls:', error);
    return res.status(500).json({ error: 'Failed to get polls' });
  }
};

/**
 * Get polls for a specific case
 */
const getPollsForCase = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const caseId = req.query.caseId;

    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }

    const pollsSnapshot = await db.collection('polls')
      .where('caseId', '==', caseId)
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const polls = [];
    for (const doc of pollsSnapshot.docs) {
      const pollData = doc.data();
      
      // Get vote count and results
      const votesSnapshot = await db.collection('polls').doc(doc.id).collection('votes').get();
      const votes = [];
      votesSnapshot.forEach(voteDoc => {
        votes.push({
          id: voteDoc.id,
          ...voteDoc.data()
        });
      });

      polls.push({
        id: doc.id,
        ...pollData,
        voteCount: votes.length,
        votes
      });
    }

    return res.status(200).json(polls);
  } catch (error) {
    console.error('Error getting polls for case:', error);
    return res.status(500).json({ error: 'Failed to get polls for case' });
  }
};

/**
 * Update poll status and details
 */
const updatePoll = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pollId = req.query.pollId;
    const pollData = req.body;

    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }

    if (!pollData) {
      return res.status(400).json({ error: 'Poll data is required' });
    }

    const pollDoc = await db.collection('polls').doc(pollId).get();

    if (!pollDoc.exists) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const existingPoll = pollDoc.data();

    // Check if user is the creator
    if (existingPoll.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add updated timestamp
    const updatedPoll = {
      ...pollData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('polls').doc(pollId).update(updatedPoll);

    return res.status(200).json({
      id: pollId,
      ...updatedPoll
    });
  } catch (error) {
    console.error('Error updating poll:', error);
    return res.status(500).json({ error: 'Failed to update poll' });
  }
};

/**
 * Delete a poll
 */
const deletePoll = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pollId = req.query.pollId;

    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }

    const pollDoc = await db.collection('polls').doc(pollId).get();

    if (!pollDoc.exists) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const pollData = pollDoc.data();

    // Check if user is the creator
    if (pollData.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete all votes first
    const votesSnapshot = await db.collection('polls').doc(pollId).collection('votes').get();
    const batch = db.batch();
    
    votesSnapshot.forEach(voteDoc => {
      batch.delete(voteDoc.ref);
    });

    // Delete the poll
    batch.delete(db.collection('polls').doc(pollId));

    await batch.commit();

    return res.status(200).json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    return res.status(500).json({ error: 'Failed to delete poll' });
  }
};

/**
 * Finalize poll and update case with selected time
 */
const finalizePoll = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pollId = req.query.pollId;
    const { selectedTimeOption } = req.body;

    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }

    if (!selectedTimeOption) {
      return res.status(400).json({ error: 'Selected time option is required' });
    }

    const pollDoc = await db.collection('polls').doc(pollId).get();

    if (!pollDoc.exists) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const pollData = pollDoc.data();

    // Check if user is the creator
    if (pollData.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update poll status to finalized
    const updatedPoll = {
      status: 'finalized',
      selectedTimeOption,
      finalizedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('polls').doc(pollId).update(updatedPoll);

    // Update the associated case if it exists
    if (pollData.caseId) {
      const caseUpdate = {
        status: 'scheduled',
        scheduledDate: selectedTimeOption.date,
        scheduledTime: selectedTimeOption.time,
        location: selectedTimeOption.location || pollData.location,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('cases').doc(pollData.caseId).update(caseUpdate);
    }

    return res.status(200).json({
      id: pollId,
      ...pollData,
      ...updatedPoll
    });
  } catch (error) {
    console.error('Error finalizing poll:', error);
    return res.status(500).json({ error: 'Failed to finalize poll' });
  }
};

/**
 * Get poll results with vote analysis
 */
const getPollResults = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pollId = req.query.pollId;

    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }

    const pollDoc = await db.collection('polls').doc(pollId).get();

    if (!pollDoc.exists) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const pollData = pollDoc.data();

    // Check if user is the creator
    if (pollData.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all votes
    const votesSnapshot = await db.collection('polls').doc(pollId).collection('votes').get();
    const votes = [];
    const votesByOption = {};
    const votesByParticipant = {};

    votesSnapshot.forEach(voteDoc => {
      const vote = {
        id: voteDoc.id,
        ...voteDoc.data()
      };
      votes.push(vote);

      // Count votes by option
      vote.selectedOptions.forEach(optionId => {
        if (!votesByOption[optionId]) {
          votesByOption[optionId] = 0;
        }
        votesByOption[optionId]++;
      });

      // Track votes by participant
      votesByParticipant[vote.participantEmail] = vote;
    });

    // Calculate results for each time option
    const results = pollData.timeOptions.map(option => ({
      ...option,
      voteCount: votesByOption[option.id] || 0,
      percentage: votes.length > 0 ? Math.round(((votesByOption[option.id] || 0) / votes.length) * 100) : 0
    }));

    // Sort by vote count
    results.sort((a, b) => b.voteCount - a.voteCount);

    return res.status(200).json({
      poll: {
        id: pollId,
        ...pollData
      },
      results,
      votes,
      summary: {
        totalVotes: votes.length,
        totalParticipants: pollData.participants.length,
        responseRate: pollData.participants.length > 0 ? 
          Math.round((votes.length / pollData.participants.length) * 100) : 0,
        topChoice: results[0] || null
      }
    });
  } catch (error) {
    console.error('Error getting poll results:', error);
    return res.status(500).json({ error: 'Failed to get poll results' });
  }
};

/**
 * Send poll invitations to all participants
 */
const sendPollInvitations = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pollId = req.query.pollId;

    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }

    const pollDoc = await db.collection('polls').doc(pollId).get();

    if (!pollDoc.exists) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const pollData = pollDoc.data();

    // Check if user is the creator
    if (pollData.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Import email service
    const emailService = require('./emailService');
    
    // Send invitations to all participants
    const results = await emailService.sendPollInvitationsToParticipants(pollId, pollData);

    // Update poll status to active
    await db.collection('polls').doc(pollId).update({
      status: 'active',
      invitationsSentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({
      message: 'Poll invitations sent successfully',
      results
    });
  } catch (error) {
    console.error('Error sending poll invitations:', error);
    return res.status(500).json({ error: 'Failed to send poll invitations' });
  }
};

module.exports = {
  getPolls,
  getPollsForCase,
  updatePoll,
  deletePoll,
  finalizePoll,
  getPollResults,
  sendPollInvitations
};