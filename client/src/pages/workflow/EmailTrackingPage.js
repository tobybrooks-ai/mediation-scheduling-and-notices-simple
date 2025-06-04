import React, { useState, useEffect } from 'react';
import EmailTracking from '../../components/workflow/EmailTracking';
import { getEmailTracking } from '../../services/noticeService';
import { useAuth } from '../../contexts/AuthContext';

const EmailTrackingPage = () => {
  const [emailTracking, setEmailTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadEmailTracking();
  }, []);

  const loadEmailTracking = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load email tracking data
      const emailData = await getEmailTracking();
      setEmailTracking(emailData);

    } catch (error) {
      console.error('Error loading email tracking:', error);
      setError('Failed to load email tracking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to view email tracking.</p>
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

        <EmailTracking
          emailTracking={emailTracking}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default EmailTrackingPage;