import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PollVoting from '../../components/polling/PollVoting';
import { getPollById, submitVote } from '../../services/pollService';

const VotePage = () => {
  const { pollId } = useParams();
  const [searchParams] = useSearchParams();
  const participantEmail = searchParams.get('email');
  const votingToken = searchParams.get('token');

  const [poll, setPoll] = useState(null);
  const [existingVotes, setExistingVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Load poll data on component mount
  useEffect(() => {
    if (pollId) {
      loadPollData();
    }
  }, [pollId]);

  const loadPollData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!participantEmail) {
        setError('Invalid voting link. Participant email is required.');
        return;
      }
      
      const pollData = await getPollById(pollId);
      setPoll(pollData);
      
      // Check if participant is in the poll
      const isParticipant = pollData.participants?.some(
        p => p.email.toLowerCase() === participantEmail.toLowerCase()
      );
      
      if (!isParticipant) {
        setError('You are not authorized to vote in this poll.');
        return;
      }
      
      // TODO: Load existing votes for this participant
      // const existingVotesData = await getPollVotesForParticipant(pollId, participantEmail);
      // setExistingVotes(existingVotesData);
      setExistingVotes([]);
      
    } catch (error) {
      console.error('Error loading poll:', error);
      setError('Failed to load poll. Please try again or contact the mediator.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVotes = async (voteData) => {
    try {
      setSubmitting(true);
      setError('');
      
      // Submit each vote
      const submitPromises = voteData.votes.map(vote => 
        submitVote({
          pollId,
          ...vote,
          votingToken
        })
      );
      
      await Promise.all(submitPromises);
      
      setSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting votes:', error);
      setError('Failed to submit votes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!participantEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Voting Link</h2>
          <p className="text-gray-600">
            This voting link is invalid or incomplete. Please use the link provided in your email invitation.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadPollData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Poll</h2>
          <p className="text-gray-600">Please wait while we load the voting information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mediation Scheduling Poll</h1>
          <p className="text-gray-600">
            Please vote on your availability for the proposed mediation times
          </p>
        </div>

        <PollVoting
          poll={poll}
          participantEmail={participantEmail}
          existingVotes={existingVotes}
          onSubmitVotes={handleSubmitVotes}
          loading={submitting}
          submitted={submitted}
        />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This is an official mediation scheduling poll. 
            If you have questions, please contact your mediator directly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VotePage;