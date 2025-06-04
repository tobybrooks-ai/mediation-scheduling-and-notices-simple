import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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

import './index.css';

function App() {
  return (
    <AuthProvider>
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;