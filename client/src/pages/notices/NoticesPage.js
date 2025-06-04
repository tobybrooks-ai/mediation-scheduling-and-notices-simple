import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NoticeList from '../../components/notices/NoticeList';

const NoticesPage = () => {
  const navigate = useNavigate();
  // const { } = useAuth(); // Not currently needed
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load notices on component mount
  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      setError('');
      
      // TODO: Implement getNotices service function
      // For now, we'll use a placeholder
      const noticesData = [];
      setNotices(noticesData);
      
    } catch (error) {
      console.error('Error loading notices:', error);
      setError('Failed to load notices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = () => {
    navigate('/notices/create');
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Implement deleteNotice service function
      console.log('Deleting notice:', noticeId);
      
      // Remove from local state
      setNotices(prev => prev.filter(notice => notice.id !== noticeId));
      
    } catch (error) {
      console.error('Error deleting notice:', error);
      setError('Failed to delete notice. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Notices</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={loadNotices}
                className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <NoticeList
        notices={notices}
        loading={loading}
        onCreateNotice={handleCreateNotice}
        onDeleteNotice={handleDeleteNotice}
      />
    </div>
  );
};

export default NoticesPage;