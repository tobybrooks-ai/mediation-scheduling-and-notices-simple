import React from 'react';

const CaseTimeline = ({ activities = [] }) => {
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'case_created':
        return '📁';
      case 'case_updated':
        return '✏️';
      case 'poll_created':
        return '📊';
      case 'poll_activated':
        return '🟢';
      case 'poll_finalized':
        return '✅';
      case 'notice_created':
        return '📄';
      case 'notice_sent':
        return '📧';
      case 'email_delivered':
        return '✉️';
      case 'email_opened':
        return '👁️';
      case 'case_scheduled':
        return '📅';
      case 'case_completed':
        return '🎉';
      case 'case_cancelled':
        return '❌';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'case_created':
      case 'poll_created':
      case 'notice_created':
        return 'bg-blue-100 text-blue-800';
      case 'poll_activated':
      case 'notice_sent':
      case 'email_delivered':
        return 'bg-green-100 text-green-800';
      case 'poll_finalized':
      case 'case_scheduled':
      case 'case_completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'case_cancelled':
        return 'bg-red-100 text-red-800';
      case 'case_updated':
      case 'email_opened':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityTitle = (activity) => {
    switch (activity.type) {
      case 'case_created':
        return 'Case Created';
      case 'case_updated':
        return 'Case Updated';
      case 'poll_created':
        return 'Poll Created';
      case 'poll_activated':
        return 'Poll Activated';
      case 'poll_finalized':
        return 'Poll Finalized';
      case 'notice_created':
        return 'Notice Created';
      case 'notice_sent':
        return 'Notice Sent';
      case 'email_delivered':
        return 'Email Delivered';
      case 'email_opened':
        return 'Email Opened';
      case 'case_scheduled':
        return 'Case Scheduled';
      case 'case_completed':
        return 'Case Completed';
      case 'case_cancelled':
        return 'Case Cancelled';
      default:
        return activity.title || 'Activity';
    }
  };

  const getActivityDescription = (activity) => {
    if (activity.description) {
      return activity.description;
    }

    switch (activity.type) {
      case 'case_created':
        return 'Case was created and is ready for scheduling';
      case 'case_updated':
        return 'Case details were updated';
      case 'poll_created':
        return `Scheduling poll "${activity.pollTitle || 'Untitled'}" was created`;
      case 'poll_activated':
        return 'Poll was activated and invitations sent to participants';
      case 'poll_finalized':
        return 'Poll was finalized and mediation time selected';
      case 'notice_created':
        return `${activity.noticeType || 'Mediation'} notice was created`;
      case 'notice_sent':
        return `Notice sent to ${activity.recipientCount || 0} participants`;
      case 'email_delivered':
        return `Email delivered to ${activity.participantEmail || 'participant'}`;
      case 'email_opened':
        return `Email opened by ${activity.participantEmail || 'participant'}`;
      case 'case_scheduled':
        return 'Case has been scheduled for mediation';
      case 'case_completed':
        return 'Mediation completed successfully';
      case 'case_cancelled':
        return 'Case was cancelled';
      default:
        return 'Activity occurred';
    }
  };

  // Sort activities by date (newest first)
  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
    return dateB - dateA;
  });

  if (activities.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Case Timeline</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📅</div>
          <p>No activities yet</p>
          <p className="text-sm">Case activities will appear here as they occur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Case Timeline</h2>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {sortedActivities.map((activity, index) => (
            <li key={activity.id || index}>
              <div className="relative pb-8">
                {index !== sortedActivities.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                
                <div className="relative flex space-x-3">
                  {/* Activity Icon */}
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(activity.type)}`}>
                      <span className="text-sm">
                        {getActivityIcon(activity.type)}
                      </span>
                    </span>
                  </div>
                  
                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {getActivityTitle(activity)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {getActivityDescription(activity)}
                        </p>
                        
                        {/* Additional Details */}
                        {activity.details && (
                          <div className="mt-2 text-xs text-gray-500">
                            {Object.entries(activity.details).map(([key, value]) => (
                              <div key={key} className="inline-block mr-4">
                                <span className="font-medium">{key}:</span> {value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <time className="text-sm text-gray-500">
                          {formatDate(activity.createdAt)}
                        </time>
                        {activity.createdBy && (
                          <p className="text-xs text-gray-400 mt-1">
                            by {activity.createdBy}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Timeline Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {activities.length}
            </div>
            <div className="text-xs text-gray-600">Total Activities</div>
          </div>
          
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {activities.filter(a => a.type?.includes('poll')).length}
            </div>
            <div className="text-xs text-gray-600">Poll Activities</div>
          </div>
          
          <div>
            <div className="text-lg font-semibold text-green-600">
              {activities.filter(a => a.type?.includes('notice') || a.type?.includes('email')).length}
            </div>
            <div className="text-xs text-gray-600">Notice Activities</div>
          </div>
          
          <div>
            <div className="text-lg font-semibold text-purple-600">
              {activities.filter(a => a.type?.includes('case')).length}
            </div>
            <div className="text-xs text-gray-600">Case Activities</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseTimeline;