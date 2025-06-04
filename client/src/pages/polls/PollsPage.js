import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PollList from '../../components/polling/PollList';
import { getPolls, deletePoll } from '../../services/pollService';

const PollsPage = () => {
  const navigate = useNavigate();
  // const { } = useAuth(); // Not currently needed
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load polls on component mount
  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      setLoading(true);
      setError('');
      
      const pollsData = await getPolls();
      setPolls(pollsData);
      
    } catch (error) {
      console.error('Error loading polls:', error);
      setError('Failed to load polls. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = () => {
    navigate('/polls/create');
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePoll(pollId);
      
      // Remove from local state
      setPolls(prev => prev.filter(poll => poll.id !== pollId));
      
    } catch (error) {
      console.error('Error deleting poll:', error);
      setError('Failed to delete poll. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Polls</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={loadPolls}
                className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <PollList
        polls={polls}
        loading={loading}
        onCreatePoll={handleCreatePoll}
        onDeletePoll={handleDeletePoll}
      />
    </div>
  );
};

export default PollsPage;