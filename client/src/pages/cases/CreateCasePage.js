import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CaseForm from '../../components/cases/CaseForm';
import { createCase } from '../../services/caseService';
import { useAuthContext } from '../../hooks/useAuthContext';

const CreateCasePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError('');

      // Add user information
      const caseData = {
        ...formData,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newCase = await createCase(caseData);
      
      // Navigate to the new case detail page
      navigate(`/cases/${newCase.id}`);
    } catch (error) {
      console.error('Error creating case:', error);
      setError('Failed to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/cases');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to create cases.</p>
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
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="create"
        />
      </div>
    </div>
  );
};

export default CreateCasePage;