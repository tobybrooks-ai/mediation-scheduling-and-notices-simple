import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import PollForm from '../../components/polling/PollForm';
import { getCases } from '../../services/caseService';
import { createPoll } from '../../services/pollService';

const CreatePollPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthContext();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(true);
  const [error, setError] = useState('');

  // Load cases on component mount
  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setCasesLoading(true);
      setError('');
      
      const casesData = await getCases();
      setCases(casesData);
      
    } catch (error) {
      console.error('Error loading cases:', error);
      setError('Failed to load cases. Please try again.');
    } finally {
      setCasesLoading(false);
    }
  };

  const handleSubmit = async (pollData) => {
    try {
      setLoading(true);
      setError('');
      
      // Add creator information
      const pollToCreate = {
        ...pollData,
        createdBy: currentUser.uid,
        mediatorId: currentUser.uid
      };
      
      const result = await createPoll(pollToCreate);
      
      // Navigate to the created poll
      navigate(`/polls/${result.id}`);
      
    } catch (error) {
      console.error('Error creating poll:', error);
      setError('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/polls');
  };

  if (casesLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading cases...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <div className="mt-3 space-x-2">
                <button
                  onClick={loadCases}
                  className="text-red-600 hover:text-red-700 text-sm font-medium underline"
                >
                  Try Again
                </button>
                <button
                  onClick={handleCancel}
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

  if (cases.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cases available</h3>
          <p className="text-gray-600 mb-4">
            You need to create at least one case before you can create a scheduling poll.
          </p>
          <div className="space-x-3">
            <button
              onClick={() => navigate('/cases/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Case
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <PollForm
        cases={cases}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        mode="create"
      />
    </div>
  );
};

export default CreatePollPage;