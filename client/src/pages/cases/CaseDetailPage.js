import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CaseDetail from '../../components/cases/CaseDetail';
import { getCase, updateCase, deleteCase } from '../../services/caseService';
import { getPollsByCase } from '../../services/pollService';
import { getNoticesByCase } from '../../services/noticeService';
import { useAuth } from '../../contexts/AuthContext';

const CaseDetailPage = () => {
  const { id } = useParams();
  const [case_, setCase] = useState(null);
  const [polls, setPolls] = useState([]);
  const [notices, setNotices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      loadCaseData();
    }
  }, [id]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load case data
      const caseData = await getCase(id);
      setCase(caseData);

      // Load related polls
      const pollsData = await getPollsByCase(id);
      setPolls(pollsData);

      // Load related notices
      const noticesData = await getNoticesByCase(id);
      setNotices(noticesData);

      // Generate activities from case, polls, and notices
      const allActivities = [];

      // Add case activities
      if (caseData) {
        allActivities.push({
          id: `case-created-${caseData.id}`,
          type: 'case_created',
          caseId: caseData.id,
          caseName: caseData.caseName,
          caseNumber: caseData.caseNumber,
          createdAt: caseData.createdAt,
          createdBy: caseData.createdBy
        });

        if (caseData.updatedAt && caseData.updatedAt !== caseData.createdAt) {
          allActivities.push({
            id: `case-updated-${caseData.id}`,
            type: 'case_updated',
            caseId: caseData.id,
            createdAt: caseData.updatedAt,
            createdBy: caseData.updatedBy || caseData.createdBy
          });
        }

        if (caseData.status === 'scheduled' && caseData.scheduledDate) {
          allActivities.push({
            id: `case-scheduled-${caseData.id}`,
            type: 'case_scheduled',
            caseId: caseData.id,
            scheduledDate: caseData.scheduledDate,
            createdAt: caseData.updatedAt || caseData.createdAt,
            createdBy: caseData.updatedBy || caseData.createdBy
          });
        }

        if (caseData.status === 'completed') {
          allActivities.push({
            id: `case-completed-${caseData.id}`,
            type: 'case_completed',
            caseId: caseData.id,
            createdAt: caseData.updatedAt || caseData.createdAt,
            createdBy: caseData.updatedBy || caseData.createdBy
          });
        }

        if (caseData.status === 'cancelled') {
          allActivities.push({
            id: `case-cancelled-${caseData.id}`,
            type: 'case_cancelled',
            caseId: caseData.id,
            createdAt: caseData.updatedAt || caseData.createdAt,
            createdBy: caseData.updatedBy || caseData.createdBy
          });
        }
      }

      // Add poll activities
      pollsData.forEach(poll => {
        allActivities.push({
          id: `poll-created-${poll.id}`,
          type: 'poll_created',
          pollId: poll.id,
          pollTitle: poll.title,
          caseId: poll.caseId,
          createdAt: poll.createdAt,
          createdBy: poll.createdBy
        });

        if (poll.status === 'active') {
          allActivities.push({
            id: `poll-activated-${poll.id}`,
            type: 'poll_activated',
            pollId: poll.id,
            pollTitle: poll.title,
            caseId: poll.caseId,
            createdAt: poll.activatedAt || poll.updatedAt,
            createdBy: poll.updatedBy || poll.createdBy
          });
        }

        if (poll.status === 'finalized') {
          allActivities.push({
            id: `poll-finalized-${poll.id}`,
            type: 'poll_finalized',
            pollId: poll.id,
            pollTitle: poll.title,
            caseId: poll.caseId,
            createdAt: poll.finalizedAt || poll.updatedAt,
            createdBy: poll.updatedBy || poll.createdBy
          });
        }
      });

      // Add notice activities
      noticesData.forEach(notice => {
        allActivities.push({
          id: `notice-created-${notice.id}`,
          type: 'notice_created',
          noticeId: notice.id,
          noticeType: notice.noticeType,
          caseId: notice.caseId,
          createdAt: notice.createdAt,
          createdBy: notice.createdBy
        });

        if (notice.status === 'sent' || notice.status === 'delivered') {
          allActivities.push({
            id: `notice-sent-${notice.id}`,
            type: 'notice_sent',
            noticeId: notice.id,
            noticeType: notice.noticeType,
            caseId: notice.caseId,
            recipientCount: notice.participants?.length || 0,
            createdAt: notice.sentAt || notice.updatedAt,
            createdBy: notice.updatedBy || notice.createdBy
          });
        }
      });

      setActivities(allActivities);

    } catch (error) {
      console.error('Error loading case data:', error);
      setError('Failed to load case details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCase = async (updateData) => {
    try {
      const updatedCase = await updateCase(id, {
        ...updateData,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      setCase(updatedCase);
      
      // Reload activities to reflect the update
      await loadCaseData();
    } catch (error) {
      console.error('Error updating case:', error);
      setError('Failed to update case. Please try again.');
    }
  };

  const handleDeleteCase = async () => {
    try {
      await deleteCase(id);
      navigate('/cases');
    } catch (error) {
      console.error('Error deleting case:', error);
      setError('Failed to delete case. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to view case details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-400 text-sm mr-2">⚠️</div>
              <div>
                <h4 className="text-red-800 font-medium text-sm">Error</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <CaseDetail
          case_={case_}
          polls={polls}
          notices={notices}
          activities={activities}
          loading={loading}
          onUpdateCase={handleUpdateCase}
          onDeleteCase={handleDeleteCase}
        />
      </div>
    </div>
  );
};

export default CaseDetailPage;