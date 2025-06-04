import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NoticeDetail from '../../components/notices/NoticeDetail';

const NoticeDetailPage = () => {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notice, setNotice] = useState(null);
  const [emailTracking, setEmailTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load notice data on component mount
  useEffect(() => {
    if (noticeId) {
      loadNoticeData();
    }
  }, [noticeId]);

  const loadNoticeData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // TODO: Implement getNoticeById service function
      console.log('Loading notice:', noticeId);
      
      // For now, use placeholder data
      setNotice(null);
      setEmailTracking([]);
      
    } catch (error) {
      console.error('Error loading notice:', error);
      setError('Failed to load notice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotice = async () => {
    try {
      // TODO: Implement sendNotice service function
      console.log('Sending notice:', noticeId);
      
      // Update notice status
      setNotice(prev => ({ ...prev, status: 'sent' }));
      
      alert('Notice sent successfully!');
      
    } catch (error) {
      console.error('Error sending notice:', error);
      setError('Failed to send notice. Please try again.');
    }
  };

  const handleDeleteNotice = async () => {
    try {
      // TODO: Implement deleteNotice service function
      console.log('Deleting notice:', noticeId);
      
      // Navigate back to notices list
      navigate('/notices');
      
    } catch (error) {
      console.error('Error deleting notice:', error);
      setError('Failed to delete notice. Please try again.');
    }
  };

  const handleResendNotice = async () => {
    try {
      // TODO: Implement resendNotice service function
      console.log('Resending notice:', noticeId);
      
      // Update notice status
      setNotice(prev => ({ ...prev, status: 'sent' }));
      
      alert('Notice resent successfully!');
      
    } catch (error) {
      console.error('Error resending notice:', error);
      setError('Failed to resend notice. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Notice</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <div className="mt-3 space-x-2">
                <button
                  onClick={loadNoticeData}
                  className="text-red-600 hover:text-red-700 text-sm font-medium underline"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/notices')}
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

  return (
    <div className="max-w-6xl mx-auto p-6">
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
          <li className="text-gray-900 font-medium">
            {notice?.caseName || notice?.caseNumber || 'Notice Details'}
          </li>
        </ol>
      </nav>

      <NoticeDetail
        notice={notice}
        emailTracking={emailTracking}
        loading={loading}
        onSendNotice={handleSendNotice}
        onDeleteNotice={handleDeleteNotice}
        onResendNotice={handleResendNotice}
      />
    </div>
  );
};

export default NoticeDetailPage;