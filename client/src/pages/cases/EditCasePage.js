import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CaseForm from '../../components/cases/CaseForm';
import { getCaseById, updateCase } from '../../services/caseService';
import { useAuthContext } from '../../hooks/useAuthContext';

const EditCasePage = () => {
  const { id } = useParams();
  const [case_, setCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const loadCase = useCallback(async () => {
    try {
      setInitialLoading(true);
      setError('');
      const caseData = await getCaseById(id);
      setCase(caseData);
    } catch (error) {
      console.error('Error loading case:', error);
      setError('Failed to load case details. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCase();
    }
  }, [id, loadCase]);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError('');

      // Add update information
      const updateData = {
        ...formData,
        updatedAt: new Date(),
        updatedBy: user.uid
      };

      await updateCase(id, updateData);
      
      // Navigate back to the case detail page
      navigate(`/cases/${id}`);
    } catch (error) {
      console.error('Error updating case:', error);
      setError('Failed to update case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/cases/${id}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to edit cases.</p>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading case details...</span>
        </div>
      </div>
    );
  }

  if (!case_) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Case Not Found</h2>
          <p className="text-gray-600">The case you're looking for doesn't exist or has been deleted.</p>
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

        <CaseForm
          initialData={case_}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="edit"
        />
      </div>
    </div>
  );
};

export default EditCasePage;