import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { getCases } from '../services/caseService';
import { testEmailConfig } from '../services/pollService';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
    activePolls: 0,
    totalNotices: 0,
    emailsSent: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailTest, setEmailTest] = useState({
    email: '',
    testing: false,
    result: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load cases
      const cases = await getCases();
      
      // Calculate basic stats
      const activeCases = cases.filter(c => c.status === 'active' || !c.status);
      
      setStats({
        totalCases: cases.length,
        activeCases: activeCases.length,
        completedCases: cases.filter(c => c.status === 'completed').length,
        recentActivity: cases
          .sort((a, b) => {
            const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
            const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
            return bTime - aTime;
          })
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            type: 'case',
            title: c.caseName,
            subtitle: c.caseNumber,
            time: c.updatedAt || c.createdAt
          }))
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!emailTest.email) {
      alert('Please enter an email address');
      return;
    }

    try {
      setEmailTest(prev => ({ ...prev, testing: true, result: null }));
      
      const result = await testEmailConfig(emailTest.email);
      
      setEmailTest(prev => ({
        ...prev,
        testing: false,
        result: { success: true, message: 'Test email sent successfully!' }
      }));
      
    } catch (error) {
      console.error('Email test failed:', error);
      setEmailTest(prev => ({
        ...prev,
        testing: false,
        result: { success: false, message: error.message }
      }));
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Welcome back, {user?.displayName || user?.email}!
            </h2>
            <p className="text-gray-600">
              Here's an overview of your mediation cases and recent activity.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📁</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Cases
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCases}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Cases
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeCases}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Cases
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.completedCases}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Polls
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activePolls}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📄</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Notices
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalNotices}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📧</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Emails Sent
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.emailsSent}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      System Status
                    </dt>
                    <dd className="text-lg font-medium text-green-600">
                      Operational
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href="/cases/create"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                📁 New Case
              </a>
              <a
                href="/polls/create"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                📊 Create Poll
              </a>
              <a
                href="/notices/create"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                📄 Send Notice
              </a>
              <a
                href="/polls"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                📊 View Polls
              </a>
            </div>
          </div>
        </div>

        {/* Email Configuration Test */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Email Configuration Test
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Test your email configuration by sending a test email to yourself.
            </p>
            <div className="flex space-x-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={emailTest.email}
                onChange={(e) => setEmailTest(prev => ({ ...prev, email: e.target.value }))}
                disabled={emailTest.testing}
              />
              <button
                onClick={handleTestEmail}
                disabled={emailTest.testing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {emailTest.testing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing...
                  </>
                ) : (
                  'Send Test Email'
                )}
              </button>
            </div>
            {emailTest.result && (
              <div className={`mt-3 p-3 rounded-md ${emailTest.result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {emailTest.result.message}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            {stats.recentActivity.length > 0 ? (
              <div className="flow-root">
                <ul className="-mb-8">
                  {stats.recentActivity.map((activity, index) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== stats.recentActivity.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <span className="text-white text-sm">📁</span>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Updated case{' '}
                                <span className="font-medium text-gray-900">{activity.title}</span>
                              </p>
                              <p className="text-xs text-gray-400">{activity.subtitle}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatTime(activity.time)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;