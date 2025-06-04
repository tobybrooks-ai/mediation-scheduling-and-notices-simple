import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CaseList from '../../components/cases/CaseList';
import { getCases, deleteCase } from '../../services/caseService';
import { useAuthContext } from '../../hooks/useAuthContext';

const CasesPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthContext();

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      setError('');
      const casesData = await getCases();
      setCases(casesData);
    } catch (error) {
      console.error('Error loading cases:', error);
      setError('Failed to load cases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = () => {
    navigate('/cases/create');
  };

  const handleDeleteCase = async (caseId) => {
    if (!window.confirm('Are you sure you want to delete this case? This action cannot be undone and will also delete all associated polls and notices.')) {
      return;
    }

    try {
      await deleteCase(caseId);
      setCases(cases.filter(case_ => case_.id !== caseId));
    } catch (error) {
      console.error('Error deleting case:', error);
      setError('Failed to delete case. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to view cases.</p>
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

        <CaseList
          cases={cases}
          loading={loading}
          onCreateCase={handleCreateCase}
          onDeleteCase={handleDeleteCase}
        />
      </div>
    </div>
  );
};

export default CasesPage;