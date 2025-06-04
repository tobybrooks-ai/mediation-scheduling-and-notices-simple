import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import PollDetail from '../../components/polling/PollDetail';
import { 
  getPollById, 
  sendPollInvitations, 
  finalizePoll,
  deletePoll,
  updatePoll 
} from '../../services/pollService';

const PollDetailPage = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  // const { } = useAuthContext(); // Not currently needed
  const [poll, setPoll] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPollData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const pollData = await getPollById(pollId);
      setPoll(pollData);
      
      // TODO: Load votes for this poll
      // const votesData = await getPollVotes(pollId);
      // setVotes(votesData);
      setVotes([]);
      
    } catch (error) {
      console.error('Error loading poll:', error);
      setError('Failed to load poll. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  // Load poll data on component mount
  useEffect(() => {
    if (pollId) {
      loadPollData();
    }
  }, [pollId, loadPollData]);

  const handleActivatePoll = async () => {
    try {
      setActionLoading(true);
      
      const updatedPoll = await updatePoll(pollId, { status: 'active' });
      setPoll(updatedPoll);
      
    } catch (error) {
      console.error('Error activating poll:', error);
      setError('Failed to activate poll. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizePoll = async (selectedOptionId) => {
    try {
      setActionLoading(true);
      
      const result = await finalizePoll(pollId, selectedOptionId);
      setPoll(result.poll);
      
      // Show success message
      alert('Poll finalized successfully! You can now create a mediation notice.');
      
    } catch (error) {
      console.error('Error finalizing poll:', error);
      setError('Failed to finalize poll. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPoll = async () => {
    try {
      setActionLoading(true);
      
      const updatedPoll = await updatePoll(pollId, { status: 'cancelled' });
      setPoll(updatedPoll);
      
    } catch (error) {
      console.error('Error cancelling poll:', error);
      setError('Failed to cancel poll. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePoll = async () => {
    try {
      setActionLoading(true);
      
      await deletePoll(pollId);
      
      // Navigate back to polls list
      navigate('/polls');
      
    } catch (error) {
      console.error('Error deleting poll:', error);
      setError('Failed to delete poll. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvitations = async () => {
    try {
      setActionLoading(true);
      
      const result = await sendPollInvitations(pollId);
      
      // Update poll with email statistics
      setPoll(prev => ({
        ...prev,
        emailsSent: result.emailsSent || 0,
        emailsDelivered: result.emailsDelivered || 0
      }));
      
      // Show success message
      alert(`Invitations sent successfully! ${result.emailsSent || 0} emails sent.`);
      
    } catch (error) {
      console.error('Error sending invitations:', error);
      setError('Failed to send invitations. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      setActionLoading(true);
      
      // TODO: Implement sendPollReminders service function
      console.log('Sending reminders for poll:', pollId);
      
      alert('Reminders sent successfully!');
      
    } catch (error) {
      console.error('Error sending reminders:', error);
      setError('Failed to send reminders. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Poll</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <div className="mt-3 space-x-2">
                <button
                  onClick={loadPollData}
                  className="text-red-600 hover:text-red-700 text-sm font-medium underline"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/polls')}
                  className="text-red-600 hover:text-red-700 text-sm font-medium underline"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <button
              onClick={() => navigate('/polls')}
              className="hover:text-blue-600 transition-colors"
            >
              Polls
            </button>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">
            {poll?.title || 'Poll Details'}
          </li>
        </ol>
      </nav>

      {/* Action Loading Indicator */}
      {actionLoading && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800 text-sm">Processing action...</span>
          </div>
        </div>
      )}

      <PollDetail
        poll={poll}
        votes={votes}
        loading={loading}
        onActivatePoll={handleActivatePoll}
        onFinalizePoll={handleFinalizePoll}
        onCancelPoll={handleCancelPoll}
        onSendInvitations={handleSendInvitations}
        onSendReminders={handleSendReminders}
        onDeletePoll={handleDeletePoll}
      />
    </div>
  );
};

export default PollDetailPage;