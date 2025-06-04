import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CaseStatus, 
  CaseType,
  getCaseStatusDisplayName,
  getCaseTypeDisplayName,
  isCaseScheduled,
  getCaseParticipantCount,
  formatCaseDateTime,
  canEditCase,
  canDeleteCase
} from '../../models/CaseModel';
import CaseTimeline from './CaseTimeline';

const CaseStatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case CaseStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case CaseStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case CaseStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case CaseStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
      {getCaseStatusDisplayName(status)}
    </span>
  );
};

const CaseTypeIcon = ({ type }) => {
  const getIcon = (type) => {
    switch (type) {
      case CaseType.COUNTY:
        return '🏛️';
      case CaseType.FAMILY:
        return '👨‍👩‍👧‍👦';
      case CaseType.CIRCUIT:
        return '⚖️';
      case CaseType.DEPENDENCY:
        return '👶';
      default:
        return '📁';
    }
  };

  return <span className="text-2xl mr-3">{getIcon(type)}</span>;
};

const CaseDetail = ({ 
  case_, 
  polls = [], 
  notices = [], 
  activities = [], 
  loading = false, 
  onUpdateCase, 
  onDeleteCase 
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleAction = (action) => {
    switch (action) {
      case 'delete':
        setShowConfirmDialog('delete');
        break;
      case 'complete':
        setShowConfirmDialog('complete');
        break;
      case 'cancel':
        setShowConfirmDialog('cancel');
        break;
      default:
        break;
    }
  };

  const confirmAction = async () => {
    try {
      setActionLoading(true);
      
      switch (showConfirmDialog) {
        case 'delete':
          await onDeleteCase();
          break;
        case 'complete':
          await onUpdateCase({ status: CaseStatus.COMPLETED });
          break;
        case 'cancel':
          await onUpdateCase({ status: CaseStatus.CANCELLED });
          break;
        default:
          break;
      }
      
      setShowConfirmDialog(null);
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Get latest poll and notice
  const latestPoll = polls.sort((a, b) => 
    new Date(b.createdAt?.seconds * 1000) - new Date(a.createdAt?.seconds * 1000)
  )[0];

  const latestNotice = notices.sort((a, b) => 
    new Date(b.createdAt?.seconds * 1000) - new Date(a.createdAt?.seconds * 1000)
  )[0];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading case details...</span>
      </div>
    );
  }

  if (!case_) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📁</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Case not found</h3>
        <p className="text-gray-600">The case you're looking for doesn't exist or has been deleted.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <CaseTypeIcon type={case_.caseType} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {case_.caseName || case_.caseNumber || 'Untitled Case'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <CaseStatusBadge status={case_.status} />
                  <span className="text-sm text-gray-600">
                    {getCaseTypeDisplayName(case_.caseType)} Case
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-gray-600 space-y-1">
              <p><span className="font-medium">Case Number:</span> {case_.caseNumber || 'N/A'}</p>
              {case_.mediatorName && (
                <p><span className="font-medium">Mediator:</span> {case_.mediatorName}</p>
              )}
              <p><span className="font-medium">Created:</span> {formatDate(case_.createdAt)}</p>
              <p><span className="font-medium">Last Updated:</span> {formatDate(case_.updatedAt)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            {canEditCase(case_) && (
              <Link
                to={`/cases/${case_.id}/edit`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Edit Case
              </Link>
            )}

            {case_.status === CaseStatus.SCHEDULED && (
              <button
                onClick={() => handleAction('complete')}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Mark Complete
              </button>
            )}

            {(case_.status === CaseStatus.DRAFT || case_.status === CaseStatus.SCHEDULED) && (
              <button
                onClick={() => handleAction('cancel')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Cancel Case
              </button>
            )}

            {canDeleteCase(case_) && (
              <button
                onClick={() => handleAction('delete')}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Case Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {getCaseParticipantCount(case_)}
            </div>
            <div className="text-sm text-gray-600">Participants</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {polls.length}
            </div>
            <div className="text-sm text-gray-600">Polls</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {notices.length}
            </div>
            <div className="text-sm text-gray-600">Notices</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {activities.length}
            </div>
            <div className="text-sm text-gray-600">Activities</div>
          </div>
        </div>
      </div>

      {/* Case Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Case Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Location</h3>
            <p className="text-gray-900">{case_.location || 'Not specified'}</p>
          </div>
          
          {isCaseScheduled(case_) && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</h3>
              <p className="text-gray-900">{formatCaseDateTime(case_)}</p>
            </div>
          )}
          
          {case_.notes && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
              <p className="text-gray-900">{case_.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Participants</h2>
        
        {case_.participants && case_.participants.length > 0 ? (
          <div className="space-y-3">
            {case_.participants.map((participant, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {participant.name || participant.email}
                  </div>
                  {participant.name && (
                    <div className="text-sm text-gray-600">{participant.email}</div>
                  )}
                  {participant.role && (
                    <div className="text-sm text-gray-500">{participant.role}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>No participants added</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {case_.status === CaseStatus.DRAFT && (
            <Link
              to={`/polls/create?caseId=${case_.id}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="font-medium text-gray-900">Create Scheduling Poll</h3>
                <p className="text-sm text-gray-600">Find the best time for mediation</p>
              </div>
              <span className="text-blue-600">→</span>
            </Link>
          )}

          {isCaseScheduled(case_) && (
            <Link
              to={`/notices/create?caseId=${case_.id}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="font-medium text-gray-900">Create Mediation Notice</h3>
                <p className="text-sm text-gray-600">Send notice with PDF attachment</p>
              </div>
              <span className="text-blue-600">→</span>
            </Link>
          )}

          {polls.length > 0 && (
            <Link
              to={`/polls?caseId=${case_.id}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="font-medium text-gray-900">View All Polls</h3>
                <p className="text-sm text-gray-600">{polls.length} poll(s) for this case</p>
              </div>
              <span className="text-blue-600">→</span>
            </Link>
          )}

          {notices.length > 0 && (
            <Link
              to={`/notices?caseId=${case_.id}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="font-medium text-gray-900">View All Notices</h3>
                <p className="text-sm text-gray-600">{notices.length} notice(s) for this case</p>
              </div>
              <span className="text-blue-600">→</span>
            </Link>
          )}
        </div>
      </div>

      {/* Latest Activity */}
      {(latestPoll || latestNotice) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Activity</h2>
          
          <div className="space-y-4">
            {latestPoll && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-blue-900">Latest Poll</h3>
                  <p className="text-sm text-blue-800">{latestPoll.title}</p>
                  <p className="text-xs text-blue-600">Created {formatDate(latestPoll.createdAt)}</p>
                </div>
                <Link
                  to={`/polls/${latestPoll.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  View Poll
                </Link>
              </div>
            )}

            {latestNotice && (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-green-900">Latest Notice</h3>
                  <p className="text-sm text-green-800">{latestNotice.noticeType} Notice</p>
                  <p className="text-xs text-green-600">Created {formatDate(latestNotice.createdAt)}</p>
                </div>
                <Link
                  to={`/notices/${latestNotice.id}`}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  View Notice
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Case Timeline */}
      <CaseTimeline activities={activities} />

      {/* Confirmation Dialogs */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showConfirmDialog === 'delete' && 'Delete Case'}
              {showConfirmDialog === 'complete' && 'Mark Case Complete'}
              {showConfirmDialog === 'cancel' && 'Cancel Case'}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {showConfirmDialog === 'delete' && 'Are you sure you want to delete this case? This action cannot be undone and will also delete all associated polls and notices.'}
              {showConfirmDialog === 'complete' && 'Are you sure you want to mark this case as complete? This indicates the mediation has been successfully concluded.'}
              {showConfirmDialog === 'cancel' && 'Are you sure you want to cancel this case? This will notify all participants that the mediation has been cancelled.'}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={actionLoading}
                className={`px-4 py-2 rounded text-white font-medium transition-colors disabled:opacity-50 ${
                  showConfirmDialog === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : showConfirmDialog === 'complete'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {actionLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  <>
                    {showConfirmDialog === 'delete' && 'Delete'}
                    {showConfirmDialog === 'complete' && 'Mark Complete'}
                    {showConfirmDialog === 'cancel' && 'Cancel Case'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;