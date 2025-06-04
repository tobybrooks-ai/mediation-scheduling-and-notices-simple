import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MockAuthProvider } from './contexts/MockAuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';

// Polling pages
import PollsPage from './pages/polls/PollsPage';
import CreatePollPage from './pages/polls/CreatePollPage';
import PollDetailPage from './pages/polls/PollDetailPage';
import VotePage from './pages/polls/VotePage';

// Notice pages
import NoticesPage from './pages/notices/NoticesPage';
import CreateNoticePage from './pages/notices/CreateNoticePage';
import NoticeDetailPage from './pages/notices/NoticeDetailPage';

// Case pages
import CasesPage from './pages/cases/CasesPage';
import CreateCasePage from './pages/cases/CreateCasePage';
import CaseDetailPage from './pages/cases/CaseDetailPage';
import EditCasePage from './pages/cases/EditCasePage';

// Workflow pages
import ActivityTimelinePage from './pages/workflow/ActivityTimelinePage';
import EmailTrackingPage from './pages/workflow/EmailTrackingPage';

import './index.css';

function App() {
  // Use mock auth in development for testing
  const useMockAuth = process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_AUTH === 'true';
  
  return (
    <AuthProvider>
      <MockAuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Polling routes */}
            <Route 
              path="/polls" 
              element={
                <ProtectedRoute>
                  <PollsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/polls/create" 
              element={
                <ProtectedRoute>
                  <CreatePollPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/polls/:pollId" 
              element={
                <ProtectedRoute>
                  <PollDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/polls/:pollId/edit" 
              element={
                <ProtectedRoute>
                  <CreatePollPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Public voting route (no auth required) */}
            <Route path="/vote/:pollId" element={<VotePage />} />
            
            {/* Notice routes */}
            <Route 
              path="/notices" 
              element={
                <ProtectedRoute>
                  <NoticesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notices/create" 
              element={
                <ProtectedRoute>
                  <CreateNoticePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notices/:noticeId" 
              element={
                <ProtectedRoute>
                  <NoticeDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notices/:noticeId/edit" 
              element={
                <ProtectedRoute>
                  <CreateNoticePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Case routes */}
            <Route 
              path="/cases" 
              element={
                <ProtectedRoute>
                  <CasesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cases/create" 
              element={
                <ProtectedRoute>
                  <CreateCasePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cases/:id" 
              element={
                <ProtectedRoute>
                  <CaseDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cases/:id/edit" 
              element={
                <ProtectedRoute>
                  <EditCasePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Workflow routes */}
            <Route 
              path="/activity-timeline" 
              element={
                <ProtectedRoute>
                  <ActivityTimelinePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/email-tracking" 
              element={
                <ProtectedRoute>
                  <EmailTrackingPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
      </MockAuthProvider>
    </AuthProvider>
  );
}

export default App;