import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ActivityTimeline = ({ activities = [], loading = false, showFilters = true }) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

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
      case 'case_scheduled':
        return '📅';
      case 'case_completed':
        return '🎉';
      case 'case_cancelled':
        return '❌';
      case 'poll_created':
        return '📊';
      case 'poll_activated':
        return '🟢';
      case 'poll_finalized':
        return '✅';
      case 'poll_expired':
        return '⏰';
      case 'notice_created':
        return '📄';
      case 'notice_sent':
        return '📧';
      case 'notice_delivered':
        return '✉️';
      case 'notice_failed':
        return '❌';
      case 'email_sent':
        return '📤';
      case 'email_delivered':
        return '📥';
      case 'email_opened':
        return '👁️';
      case 'email_failed':
        return '⚠️';
      case 'participant_voted':
        return '🗳️';
      case 'pdf_uploaded':
        return '📎';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'case_created':
      case 'poll_created':
      case 'notice_created':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'poll_activated':
      case 'notice_sent':
      case 'email_sent':
      case 'email_delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'poll_finalized':
      case 'case_scheduled':
      case 'case_completed':
      case 'notice_delivered':
      case 'email_opened':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'case_cancelled':
      case 'poll_expired':
      case 'notice_failed':
      case 'email_failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'case_updated':
      case 'participant_voted':
      case 'pdf_uploaded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityTitle = (activity) => {
    switch (activity.type) {
      case 'case_created':
        return 'Case Created';
      case 'case_updated':
        return 'Case Updated';
      case 'case_scheduled':
        return 'Case Scheduled';
      case 'case_completed':
        return 'Case Completed';
      case 'case_cancelled':
        return 'Case Cancelled';
      case 'poll_created':
        return 'Poll Created';
      case 'poll_activated':
        return 'Poll Activated';
      case 'poll_finalized':
        return 'Poll Finalized';
      case 'poll_expired':
        return 'Poll Expired';
      case 'notice_created':
        return 'Notice Created';
      case 'notice_sent':
        return 'Notice Sent';
      case 'notice_delivered':
        return 'Notice Delivered';
      case 'notice_failed':
        return 'Notice Failed';
      case 'email_sent':
        return 'Email Sent';
      case 'email_delivered':
        return 'Email Delivered';
      case 'email_opened':
        return 'Email Opened';
      case 'email_failed':
        return 'Email Failed';
      case 'participant_voted':
        return 'Participant Voted';
      case 'pdf_uploaded':
        return 'PDF Uploaded';
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
        return `Case "${activity.caseName || activity.caseNumber}" was created`;
      case 'case_updated':
        return `Case details were updated`;
      case 'case_scheduled':
        return `Case scheduled for ${activity.scheduledDate || 'mediation'}`;
      case 'case_completed':
        return 'Mediation completed successfully';
      case 'case_cancelled':
        return 'Case was cancelled';
      case 'poll_created':
        return `Poll "${activity.pollTitle}" was created`;
      case 'poll_activated':
        return 'Poll activated and invitations sent';
      case 'poll_finalized':
        return 'Poll finalized and time selected';
      case 'poll_expired':
        return 'Poll expired without finalization';
      case 'notice_created':
        return `${activity.noticeType || 'Mediation'} notice created`;
      case 'notice_sent':
        return `Notice sent to ${activity.recipientCount || 0} participants`;
      case 'notice_delivered':
        return 'Notice successfully delivered';
      case 'notice_failed':
        return 'Notice delivery failed';
      case 'email_sent':
        return `Email sent to ${activity.participantEmail || 'participant'}`;
      case 'email_delivered':
        return `Email delivered to ${activity.participantEmail || 'participant'}`;
      case 'email_opened':
        return `Email opened by ${activity.participantEmail || 'participant'}`;
      case 'email_failed':
        return `Email failed to ${activity.participantEmail || 'participant'}`;
      case 'participant_voted':
        return `${activity.participantName || 'Participant'} voted in poll`;
      case 'pdf_uploaded':
        return `PDF "${activity.fileName}" uploaded`;
      default:
        return 'Activity occurred';
    }
  };

  const getActivityLink = (activity) => {
    switch (activity.type) {
      case 'case_created':
      case 'case_updated':
      case 'case_scheduled':
      case 'case_completed':
      case 'case_cancelled':
        return activity.caseId ? `/cases/${activity.caseId}` : null;
      case 'poll_created':
      case 'poll_activated':
      case 'poll_finalized':
      case 'poll_expired':
      case 'participant_voted':
        return activity.pollId ? `/polls/${activity.pollId}` : null;
      case 'notice_created':
      case 'notice_sent':
      case 'notice_delivered':
      case 'notice_failed':
      case 'pdf_uploaded':
        return activity.noticeId ? `/notices/${activity.noticeId}` : null;
      case 'email_sent':
      case 'email_delivered':
      case 'email_opened':
      case 'email_failed':
        return '/email-tracking';
      default:
        return null;
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesType = typeFilter === 'all' || activity.type.includes(typeFilter);
    
    let matchesDate = true;
    if (dateFilter !== 'all' && activity.createdAt) {
      const activityDate = new Date(activity.createdAt.seconds * 1000);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = activityDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = activityDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = activityDate >= monthAgo;
          break;
        default:
          matchesDate = true;
      }
    }
    
    return matchesType && matchesDate;
  });

  // Sort activities by date (newest first)
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading activity timeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Timeline</h2>
        <p className="text-gray-600">
          Track all activities across cases, polls, notices, and email delivery
        </p>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Activities</option>
                <option value="case">Case Activities</option>
                <option value="poll">Poll Activities</option>
                <option value="notice">Notice Activities</option>
                <option value="email">Email Activities</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {sortedActivities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activities.length === 0 ? 'No activities yet' : 'No activities match your filters'}
          </h3>
          <p className="text-gray-600">
            {activities.length === 0 
              ? 'Activities will appear here as you work with cases, polls, and notices.'
              : 'Try adjusting your filter criteria.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flow-root p-6">
            <ul className="-mb-8">
              {sortedActivities.map((activity, index) => {
                const link = getActivityLink(activity);
                const ActivityWrapper = link ? Link : 'div';
                const wrapperProps = link ? { to: link } : {};

                return (
                  <li key={activity.id || index}>
                    <div className="relative pb-8">
                      {index !== sortedActivities.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      
                      <ActivityWrapper
                        {...wrapperProps}
                        className={`relative flex space-x-3 ${link ? 'hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors' : ''}`}
                      >
                        {/* Activity Icon */}
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white border-2 ${getActivityColor(activity.type)}`}>
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
                      </ActivityWrapper>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          
          {/* Timeline Summary */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600 text-center">
              Showing {sortedActivities.length} of {activities.length} activities
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;