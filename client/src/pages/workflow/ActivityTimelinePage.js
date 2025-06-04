import React, { useState, useEffect } from 'react';
import ActivityTimeline from '../../components/workflow/ActivityTimeline';
import { getCases } from '../../services/caseService';
import { getPolls } from '../../services/pollService';
import { getNotices } from '../../services/noticeService';
import { useAuth } from '../../contexts/AuthContext';

const ActivityTimelinePage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError('');

      // Load all data
      const [casesData, pollsData, noticesData] = await Promise.all([
        getCases(),
        getPolls(),
        getNotices()
      ]);

      // Generate activities from all data
      const allActivities = [];

      // Add case activities
      casesData.forEach(case_ => {
        allActivities.push({
          id: `case-created-${case_.id}`,
          type: 'case_created',
          caseId: case_.id,
          caseName: case_.caseName,
          caseNumber: case_.caseNumber,
          createdAt: case_.createdAt,
          createdBy: case_.createdBy
        });

        if (case_.updatedAt && case_.updatedAt !== case_.createdAt) {
          allActivities.push({
            id: `case-updated-${case_.id}`,
            type: 'case_updated',
            caseId: case_.id,
            createdAt: case_.updatedAt,
            createdBy: case_.updatedBy || case_.createdBy
          });
        }

        if (case_.status === 'scheduled' && case_.scheduledDate) {
          allActivities.push({
            id: `case-scheduled-${case_.id}`,
            type: 'case_scheduled',
            caseId: case_.id,
            scheduledDate: case_.scheduledDate,
            createdAt: case_.updatedAt || case_.createdAt,
            createdBy: case_.updatedBy || case_.createdBy
          });
        }

        if (case_.status === 'completed') {
          allActivities.push({
            id: `case-completed-${case_.id}`,
            type: 'case_completed',
            caseId: case_.id,
            createdAt: case_.updatedAt || case_.createdAt,
            createdBy: case_.updatedBy || case_.createdBy
          });
        }

        if (case_.status === 'cancelled') {
          allActivities.push({
            id: `case-cancelled-${case_.id}`,
            type: 'case_cancelled',
            caseId: case_.id,
            createdAt: case_.updatedAt || case_.createdAt,
            createdBy: case_.updatedBy || case_.createdBy
          });
        }
      });

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

        if (poll.status === 'expired') {
          allActivities.push({
            id: `poll-expired-${poll.id}`,
            type: 'poll_expired',
            pollId: poll.id,
            pollTitle: poll.title,
            caseId: poll.caseId,
            createdAt: poll.expiredAt || poll.updatedAt,
            createdBy: poll.updatedBy || poll.createdBy
          });
        }

        // Add voting activities
        if (poll.votes && poll.votes.length > 0) {
          poll.votes.forEach((vote, index) => {
            allActivities.push({
              id: `vote-${poll.id}-${index}`,
              type: 'participant_voted',
              pollId: poll.id,
              pollTitle: poll.title,
              caseId: poll.caseId,
              participantName: vote.participantName,
              participantEmail: vote.participantEmail,
              createdAt: vote.votedAt || poll.createdAt,
              createdBy: vote.participantEmail
            });
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

        if (notice.status === 'delivered') {
          allActivities.push({
            id: `notice-delivered-${notice.id}`,
            type: 'notice_delivered',
            noticeId: notice.id,
            noticeType: notice.noticeType,
            caseId: notice.caseId,
            createdAt: notice.deliveredAt || notice.updatedAt,
            createdBy: notice.updatedBy || notice.createdBy
          });
        }

        if (notice.status === 'failed') {
          allActivities.push({
            id: `notice-failed-${notice.id}`,
            type: 'notice_failed',
            noticeId: notice.id,
            noticeType: notice.noticeType,
            caseId: notice.caseId,
            createdAt: notice.failedAt || notice.updatedAt,
            createdBy: notice.updatedBy || notice.createdBy
          });
        }

        if (notice.pdfFileName) {
          allActivities.push({
            id: `pdf-uploaded-${notice.id}`,
            type: 'pdf_uploaded',
            noticeId: notice.id,
            fileName: notice.pdfFileName,
            caseId: notice.caseId,
            createdAt: notice.pdfUploadedAt || notice.createdAt,
            createdBy: notice.createdBy
          });
        }
      });

      setActivities(allActivities);

    } catch (error) {
      console.error('Error loading activities:', error);
      setError('Failed to load activity timeline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to view the activity timeline.</p>
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

        <ActivityTimeline
          activities={activities}
          loading={loading}
          showFilters={true}
        />
      </div>
    </div>
  );
};

export default ActivityTimelinePage;