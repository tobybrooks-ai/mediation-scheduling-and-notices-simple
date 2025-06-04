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
  canSendNotice,
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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
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

  return <span className="text-2xl mr-3">{getIcon(type)}</span>;
};

const NoticeDetail = ({ 
  notice, 
  emailTracking = [], 
  loading = false, 
  onSendNotice, 
  onDeleteNotice,
  onResendNotice 
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
      case 'send':
        setShowConfirmDialog('send');
        break;
      case 'delete':
        setShowConfirmDialog('delete');
        break;
      case 'resend':
        setShowConfirmDialog('resend');
        break;
      default:
        break;
    }
  };

  const confirmAction = async () => {
    try {
      setActionLoading(true);
      
      switch (showConfirmDialog) {
        case 'send':
          await onSendNotice();
          break;
        case 'delete':
          await onDeleteNotice();
          break;
        case 'resend':
          await onResendNotice();
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

  // Group email tracking by participant
  const participantEmailStatus = notice?.participants?.map(participant => {
    const participantEmails = emailTracking.filter(
      email => email.participantEmail === participant.email
    );
    
    const latestEmail = participantEmails.sort((a, b) => 
      new Date(b.sentAt?.seconds * 1000) - new Date(a.sentAt?.seconds * 1000)
    )[0];

    return {
      ...participant,
      emailStatus: latestEmail?.status || 'not_sent',
      emailSentAt: latestEmail?.sentAt,
      emailOpenedAt: latestEmail?.openedAt,
      hasAttachment: latestEmail?.hasAttachment || false
    };
  }) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading notice details...</span>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Notice not found</h3>
        <p className="text-gray-600">The notice you're looking for doesn't exist or has been deleted.</p>
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
              <NoticeTypeIcon type={notice.noticeType} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getNoticeTypeDisplayName(notice.noticeType)}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <NoticeStatusBadge status={notice.status} />
                  {hasNoticeAttachment(notice) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      📎 PDF Attached
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-gray-600 space-y-1">
              <p><span className="font-medium">Case:</span> {notice.caseName || notice.caseNumber || 'N/A'}</p>
              {notice.mediatorName && (
                <p><span className="font-medium">Mediator:</span> {notice.mediatorName}</p>
              )}
              <p><span className="font-medium">Created:</span> {formatDate(notice.createdAt)}</p>
              {notice.sentAt && (
                <p><span className="font-medium">Sent:</span> {formatDate(notice.sentAt)}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            {notice.status === NoticeStatus.DRAFT && (
              <>
                <Link
                  to={`/notices/${notice.id}/edit`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Edit Notice
                </Link>
                
                {canSendNotice(notice) && (
                  <button
                    onClick={() => handleAction('send')}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Send Notice
                  </button>
                )}
                
                <button
                  onClick={() => handleAction('delete')}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </>
            )}

            {notice.status === NoticeStatus.FAILED && (
              <button
                onClick={() => handleAction('resend')}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Retry Sending
              </button>
            )}

            {hasNoticeAttachment(notice) && notice.pdfUrl && (
              <a
                href={notice.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                View PDF
              </a>
            )}
          </div>
        </div>

        {/* Notice Statistics */}
        {isNoticeSent(notice) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {notice.participants ? notice.participants.length : 0}
              </div>
              <div className="text-sm text-gray-600">Recipients</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {notice.emailsSent || 0}
              </div>
              <div className="text-sm text-gray-600">Emails Sent</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {getNoticeDeliveryRate(notice)}%
              </div>
              <div className="text-sm text-gray-600">Delivery Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {getNoticeOpenRate(notice)}%
              </div>
              <div className="text-sm text-gray-600">Open Rate</div>
            </div>
          </div>
        )}
      </div>

      {/* Mediation Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mediation Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Date & Time</h3>
            <p className="text-gray-900">
              {notice.mediationDate && notice.mediationTime 
                ? formatMediationDateTime(notice)
                : 'Not specified'
              }
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Location</h3>
            <p className="text-gray-900">{notice.location || 'Not specified'}</p>
          </div>
          
          {notice.notes && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Additional Notes</h3>
              <p className="text-gray-900">{notice.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* PDF Attachment */}
      {hasNoticeAttachment(notice) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">PDF Attachment</h2>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="text-red-500 text-2xl">📄</div>
              <div>
                <h3 className="font-medium text-gray-900">{notice.pdfFileName}</h3>
                <p className="text-sm text-gray-600">
                  PDF Document
                  {notice.pdfUploadedAt && (
                    <span> • Uploaded {formatDate(notice.pdfUploadedAt)}</span>
                  )}
                </p>
              </div>
            </div>
            
            {notice.pdfUrl && (
              <a
                href={notice.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                View PDF
              </a>
            )}
          </div>
        </div>
      )}

      {/* Participants and Email Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Participants & Email Status</h2>
        
        {participantEmailStatus.length > 0 ? (
          <div className="space-y-3">
            {participantEmailStatus.map((participant, index) => (
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
                
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    participant.emailStatus === 'sent' || participant.emailStatus === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : participant.emailStatus === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {participant.emailStatus === 'sent' && '✓ Sent'}
                    {participant.emailStatus === 'delivered' && '✓ Delivered'}
                    {participant.emailStatus === 'opened' && '✓ Opened'}
                    {participant.emailStatus === 'failed' && '❌ Failed'}
                    {participant.emailStatus === 'not_sent' && '⏳ Not Sent'}
                  </div>
                  
                  {participant.emailSentAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(participant.emailSentAt)}
                    </div>
                  )}
                  
                  {participant.hasAttachment && (
                    <div className="text-xs text-green-600 mt-1">
                      📎 With PDF
                    </div>
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

      {/* Email Tracking Details */}
      {emailTracking.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Tracking Details</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emailTracking.map((email, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {email.participantName || email.participantEmail}
                      </div>
                      {email.participantName && (
                        <div className="text-sm text-gray-500">{email.participantEmail}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        email.status === 'sent' || email.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : email.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
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
                        <span className="text-green-600">📎 {email.attachmentName}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showConfirmDialog === 'send' && 'Send Notice'}
              {showConfirmDialog === 'delete' && 'Delete Notice'}
              {showConfirmDialog === 'resend' && 'Resend Notice'}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {showConfirmDialog === 'send' && 'Are you sure you want to send this notice to all participants? This action cannot be undone.'}
              {showConfirmDialog === 'delete' && 'Are you sure you want to delete this notice? This action cannot be undone.'}
              {showConfirmDialog === 'resend' && 'Are you sure you want to resend this notice to all participants?'}
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
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {actionLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  <>
                    {showConfirmDialog === 'send' && 'Send Notice'}
                    {showConfirmDialog === 'delete' && 'Delete'}
                    {showConfirmDialog === 'resend' && 'Resend'}
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

export default NoticeDetail;