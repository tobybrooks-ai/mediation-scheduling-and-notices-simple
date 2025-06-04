import React, { useState } from 'react';
import { formatDate, toDate, sortByTimestamp } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

const EmailTracking = ({ emailTracking = [], loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sentAt');
  const [sortOrder, setSortOrder] = useState('desc');



  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return '📤';
      case 'delivered':
        return '📥';
      case 'opened':
        return '👁️';
      case 'failed':
        return '❌';
      case 'bounced':
        return '↩️';
      case 'spam':
        return '🚫';
      default:
        return '📧';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'opened':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
      case 'bounced':
      case 'spam':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'poll_invitation':
        return '📊';
      case 'mediation_notice':
        return '📄';
      case 'reminder':
        return '⏰';
      case 'confirmation':
        return '✅';
      default:
        return '📧';
    }
  };

  // Filter and sort emails
  const filteredEmails = emailTracking
    .filter(email => {
      const matchesSearch = !searchTerm || 
        email.participantEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.emailSubject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.participantName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
      const matchesType = typeFilter === 'all' || email.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'participantEmail':
          aValue = a.participantEmail || '';
          bValue = b.participantEmail || '';
          break;
        case 'sentAt':
          aValue = toDate(a.sentAt) || new Date(0);
          bValue = toDate(b.sentAt) || new Date(0);
          break;
        case 'openedAt':
          aValue = toDate(a.openedAt) || new Date(0);
          bValue = toDate(b.openedAt) || new Date(0);
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

  // Calculate statistics
  const stats = {
    total: emailTracking.length,
    sent: emailTracking.filter(e => e.status === 'sent').length,
    delivered: emailTracking.filter(e => e.status === 'delivered').length,
    opened: emailTracking.filter(e => e.status === 'opened').length,
    failed: emailTracking.filter(e => ['failed', 'bounced', 'spam'].includes(e.status)).length
  };

  const deliveryRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
  const openRate = stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading email tracking...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Tracking</h2>
        <p className="text-gray-600">
          Monitor email delivery status and engagement for polls and notices
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Emails</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          <div className="text-sm text-gray-600">Sent</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.opened}</div>
          <div className="text-sm text-gray-600">Opened</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Rate</h3>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${deliveryRate}%` }}
                ></div>
              </div>
            </div>
            <div className="ml-4 text-2xl font-bold text-green-600">
              {deliveryRate}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {stats.delivered} of {stats.total} emails delivered successfully
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Open Rate</h3>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${openRate}%` }}
                ></div>
              </div>
            </div>
            <div className="ml-4 text-2xl font-bold text-purple-600">
              {openRate}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {stats.opened} of {stats.delivered} delivered emails opened
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="opened">Opened</option>
              <option value="failed">Failed</option>
              <option value="bounced">Bounced</option>
              <option value="spam">Spam</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="poll_invitation">Poll Invitations</option>
              <option value="mediation_notice">Mediation Notices</option>
              <option value="reminder">Reminders</option>
              <option value="confirmation">Confirmations</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sentAt">Sent Date</option>
              <option value="participantEmail">Recipient</option>
              <option value="openedAt">Opened Date</option>
              <option value="status">Status</option>
              <option value="type">Type</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email List */}
      {filteredEmails.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📧</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emailTracking.length === 0 ? 'No emails tracked yet' : 'No emails match your filters'}
          </h3>
          <p className="text-gray-600">
            {emailTracking.length === 0 
              ? 'Email tracking data will appear here when you send polls and notices.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opened At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attachment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmails.map((email, index) => (
                  <tr key={email.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {email.participantName || email.participantEmail}
                      </div>
                      {email.participantName && (
                        <div className="text-sm text-gray-500">{email.participantEmail}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTypeIcon(email.type)}</span>
                        <span className="text-sm text-gray-900 capitalize">
                          {email.type?.replace('_', ' ') || 'Email'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {email.emailSubject || 'No subject'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                        <span className="mr-1">{getStatusIcon(email.status)}</span>
                        {email.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(email.sentAt)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {email.openedAt ? formatDate(email.openedAt) : '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {email.hasAttachment ? (
                        <span className="text-green-600">
                          📎 {email.attachmentName || 'PDF'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {email.pollId && (
                          <Link
                            to={`/polls/${email.pollId}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Poll
                          </Link>
                        )}
                        {email.noticeId && (
                          <Link
                            to={`/notices/${email.noticeId}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Notice
                          </Link>
                        )}
                        {email.caseId && (
                          <Link
                            to={`/cases/${email.caseId}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Case
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Results Summary */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-600 text-center">
              Showing {filteredEmails.length} of {emailTracking.length} emails
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTracking;