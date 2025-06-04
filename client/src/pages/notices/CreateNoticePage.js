import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import NoticeForm from '../../components/notices/NoticeForm';
import { getCases } from '../../services/caseService';
import { getPollById } from '../../services/pollService';
import { createNoticeFromCaseAndPoll } from '../../models/NoticeModel';

const CreateNoticePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthContext();
  const [searchParams] = useSearchParams();
  const pollId = searchParams.get('pollId');
  const caseId = searchParams.get('caseId');

  const [cases, setCases] = useState([]);
  const [polls] = useState([]);
  const [initialNoticeData, setInitialNoticeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInitialData = useCallback(async () => {
    try {
      setCasesLoading(true);
      setError('');
      
      // Load cases
      const casesData = await getCases();
      setCases(casesData);
      
      // If pollId is provided, load poll data and pre-populate notice
      if (pollId) {
        try {
          const pollData = await getPollById(pollId);
          
          if (pollData.status === 'finalized' && pollData.finalizedOptionId) {
            // Find the case for this poll
            const pollCase = casesData.find(c => c.id === pollData.caseId);
            
            if (pollCase) {
              // Find the finalized option
              const finalizedOption = pollData.options?.find(opt => opt.id === pollData.finalizedOptionId);
              
              if (finalizedOption) {
                // Create initial notice data from poll
                const noticeData = createNoticeFromCaseAndPoll(
                  pollCase, 
                  pollData, 
                  finalizedOption, 
                  currentUser.uid
                );
                
                setInitialNoticeData(noticeData);
              }
            }
          }
        } catch (pollError) {
          console.error('Error loading poll data:', pollError);
          setError('Failed to load poll data. You can still create a notice manually.');
        }
      }
      
      // If caseId is provided, pre-select the case
      if (caseId && !pollId) {
        const selectedCase = casesData.find(c => c.id === caseId);
        if (selectedCase) {
          setInitialNoticeData({
            caseId: selectedCase.id,
            caseNumber: selectedCase.caseNumber || '',
            caseName: selectedCase.caseName || '',
            location: selectedCase.location || '',
            mediatorName: selectedCase.mediatorName || '',
            participants: selectedCase.participants || []
          });
        }
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setCasesLoading(false);
    }
  }, [pollId, caseId, currentUser.uid]);

  // Load cases and poll data on component mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSubmit = async (noticeData) => {
    try {
      setLoading(true);
      setError('');
      
      // TODO: Implement createNotice service function
      console.log('Creating notice:', noticeData);
      
      // For now, simulate success and navigate
      // const result = await createNotice(noticeData);
      // navigate(`/notices/${result.id}`);
      
      // Temporary navigation
      navigate('/notices');
      
    } catch (error) {
      console.error('Error creating notice:', error);
      setError('Failed to create notice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (pollId) {
      navigate(`/polls/${pollId}`);
    } else {
      navigate('/notices');
    }
  };

  if (casesLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading data...</span>
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
                  onClick={loadInitialData}
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
            You need to create at least one case before you can create a mediation notice.
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
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <button
              onClick={() => navigate('/notices')}
              className="hover:text-blue-600 transition-colors"
            >
              Notices
            </button>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Create Notice</li>
        </ol>
      </nav>

      {/* Poll Context Banner */}
      {pollId && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-xl mr-3">📊</div>
            <div>
              <h3 className="text-blue-900 font-medium">Creating Notice from Poll</h3>
              <p className="text-blue-800 text-sm">
                This notice is being created from a finalized scheduling poll. 
                The mediation details have been pre-populated based on the selected time slot.
              </p>
            </div>
          </div>
        </div>
      )}

      <NoticeForm
        initialData={initialNoticeData}
        cases={cases}
        polls={polls}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        mode="create"
      />
    </div>
  );
};

export default CreateNoticePage;