import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  NoticeStatus, 
  NoticeType,
  getNoticeStatusDisplayName,
  getNoticeTypeDisplayName,
  getNoticeDeliveryRate,
  getNoticeOpenRate,
  formatMediationDateTime,
  hasNoticeAttachment,
  isNoticeSent
} from '../../models/NoticeModel';

const NoticeStatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case NoticeStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case NoticeStatus.SENT:
        return 'bg-blue-100 text-blue-800';
      case NoticeStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case NoticeStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getNoticeStatusDisplayName(status)}
    </span>
  );
};

const NoticeTypeIcon = ({ type }) => {
  const getIcon = (type) => {
    switch (type) {
      case NoticeType.SCHEDULED:
        return '📅';
      case NoticeType.RESCHEDULED:
        return '🔄';
      case NoticeType.CANCELLED:
        return '❌';
      case NoticeType.REMINDER:
        return '⏰';
      default:
        return '📄';
    }
  };

  return <span className="text-lg mr-2">{getIcon(type)}</span>;
};

const NoticeList = ({ notices, loading, onCreateNotice, onDeleteNotice, showCaseFilter = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter and sort notices
  const filteredNotices = notices
    .filter(notice => {
      const matchesSearch = !searchTerm || 
        notice.caseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.mediatorName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || notice.status === statusFilter;
      const matchesType = typeFilter === 'all' || notice.noticeType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'caseName':
          aValue = a.caseName || a.caseNumber || '';
          bValue = b.caseName || b.caseNumber || '';
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          bValue = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          break;
        case 'mediationDate':
          aValue = a.mediationDate ? new Date(a.mediationDate) : new Date(0);
          bValue = b.mediationDate ? new Date(b.mediationDate) : new Date(0);
          break;
        case 'status':
          aValue = a.status || 'draft';
          bValue = b.status || 'draft';
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading notices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mediation Notices</h2>
          <p className="text-gray-600">Create and manage mediation notices with PDF attachments</p>
        </div>
        {onCreateNotice && (
          <button
            onClick={onCreateNotice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create New Notice
          </button>
        )}
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
              placeholder="Search notices..."
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
              <option value={NoticeStatus.DRAFT}>Draft</option>
              <option value={NoticeStatus.SENT}>Sent</option>
              <option value={NoticeStatus.DELIVERED}>Delivered</option>
              <option value={NoticeStatus.FAILED}>Failed</option>
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
              <option value={NoticeType.SCHEDULED}>Scheduled</option>
              <option value={NoticeType.RESCHEDULED}>Rescheduled</option>
              <option value={NoticeType.CANCELLED}>Cancelled</option>
              <option value={NoticeType.REMINDER}>Reminder</option>
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
              <option value="createdAt">Created Date</option>
              <option value="mediationDate">Mediation Date</option>
              <option value="caseName">Case Name</option>
              <option value="status">Status</option>
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

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {notices.length === 0 ? 'No notices yet' : 'No notices match your filters'}
          </h3>
          <p className="text-gray-600 mb-4">
            {notices.length === 0 
              ? 'Create your first mediation notice to get started.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {notices.length === 0 && onCreateNotice && (
            <button
              onClick={onCreateNotice}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Your First Notice
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredNotices.map((notice) => (
            <div key={notice.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <NoticeTypeIcon type={notice.noticeType} />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getNoticeTypeDisplayName(notice.noticeType)}
                    </h3>
                    <NoticeStatusBadge status={notice.status} />
                    {hasNoticeAttachment(notice) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        📎 PDF Attached
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Case:</span> {notice.caseName || notice.caseNumber || 'N/A'}</p>
                    {notice.mediationDate && notice.mediationTime && (
                      <p><span className="font-medium">Mediation:</span> {formatMediationDateTime(notice)}</p>
                    )}
                    {notice.location && (
                      <p><span className="font-medium">Location:</span> {notice.location}</p>
                    )}
                    <p><span className="font-medium">Created:</span> {formatDate(notice.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/notices/${notice.id}`}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                  
                  {notice.status === NoticeStatus.DRAFT && (
                    <Link
                      to={`/notices/${notice.id}/edit`}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Edit
                    </Link>
                  )}
                  
                  {(notice.status === NoticeStatus.DRAFT || notice.status === NoticeStatus.FAILED) && onDeleteNotice && (
                    <button
                      onClick={() => onDeleteNotice(notice.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Notice Statistics */}
              {isNoticeSent(notice) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {notice.participants ? notice.participants.length : 0}
                    </div>
                    <div className="text-xs text-gray-600">Recipients</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {notice.emailsSent || 0}
                    </div>
                    <div className="text-xs text-gray-600">Emails Sent</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {getNoticeDeliveryRate(notice)}%
                    </div>
                    <div className="text-xs text-gray-600">Delivery Rate</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {getNoticeOpenRate(notice)}%
                    </div>
                    <div className="text-xs text-gray-600">Open Rate</div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {notice.status === NoticeStatus.DRAFT && hasNoticeAttachment(notice) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Ready to send notice with PDF attachment
                    </span>
                    <Link
                      to={`/notices/${notice.id}/send`}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Send Notice
                    </Link>
                  </div>
                </div>
              )}

              {notice.status === NoticeStatus.DRAFT && !hasNoticeAttachment(notice) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-600">
                      ⚠️ PDF attachment required before sending
                    </span>
                    <Link
                      to={`/notices/${notice.id}/edit`}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Add PDF
                    </Link>
                  </div>
                </div>
              )}

              {notice.status === NoticeStatus.FAILED && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-600">
                      ❌ Notice delivery failed
                    </span>
                    <Link
                      to={`/notices/${notice.id}/retry`}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Retry Sending
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {filteredNotices.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredNotices.length} of {notices.length} notices
        </div>
      )}
    </div>
  );
};

export default NoticeList;