import React, { useState, useEffect } from 'react';
import { 
  NoticeType, 
  NoticeStatus, 
  createNotice, 
  validateNoticeData,
  getNoticeTypeOptions,
  generateNoticeSubject
} from '../../models/NoticeModel';
import PDFUpload from './PDFUpload';

const NoticeForm = ({ 
  initialData = null, 
  cases = [], 
  polls = [],
  onSubmit, 
  onCancel, 
  loading = false,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    caseId: '',
    caseNumber: '',
    caseName: '',
    noticeType: NoticeType.SCHEDULED,
    status: NoticeStatus.DRAFT,
    mediationDate: '',
    mediationTime: '',
    location: '',
    mediatorName: '',
    participants: [],
    notes: '',
    pdfFile: null,
    pdfFileName: '',
    pdfUrl: '',
    pdfStoragePath: ''
  });

  const [errors, setErrors] = useState({});
  const [pdfUploadError, setPdfUploadError] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        mediationDate: initialData.mediationDate ? 
          new Date(initialData.mediationDate).toISOString().split('T')[0] : '',
        participants: initialData.participants || []
      });
    }
  }, [initialData]);

  // Update case info when case is selected
  const handleCaseChange = (caseId) => {
    const selectedCase = cases.find(c => c.id === caseId);
    if (selectedCase) {
      setFormData(prev => ({
        ...prev,
        caseId,
        caseNumber: selectedCase.caseNumber || '',
        caseName: selectedCase.caseName || '',
        location: selectedCase.location || prev.location,
        mediatorName: selectedCase.mediatorName || prev.mediatorName,
        participants: selectedCase.participants || []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        caseId,
        caseNumber: '',
        caseName: '',
        participants: []
      }));
    }
    setErrors(prev => ({ ...prev, caseId: '' }));
  };

  // Update form data when poll is selected (for creating notice from poll)
  const handlePollChange = (pollId) => {
    const selectedPoll = polls.find(p => p.id === pollId);
    if (selectedPoll && selectedPoll.finalizedOptionId) {
      const finalizedOption = selectedPoll.options?.find(opt => opt.id === selectedPoll.finalizedOptionId);
      if (finalizedOption) {
        setFormData(prev => ({
          ...prev,
          mediationDate: finalizedOption.date,
          mediationTime: finalizedOption.time,
          location: finalizedOption.location || selectedPoll.location || prev.location
        }));
      }
    }
  };

  // Add participant
  const addParticipant = () => {
    const newParticipant = { name: '', email: '', role: '' };
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, newParticipant]
    }));
  };

  // Update participant
  const updateParticipant = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map((participant, i) => 
        i === index ? { ...participant, [field]: value } : participant
      )
    }));
  };

  // Remove participant
  const removeParticipant = (index) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  // Handle PDF file selection
  const handlePDFSelect = async (file, error) => {
    if (error) {
      setPdfUploadError(error);
      return;
    }

    if (!file) {
      setFormData(prev => ({
        ...prev,
        pdfFile: null,
        pdfFileName: '',
        pdfUrl: '',
        pdfStoragePath: ''
      }));
      setPdfUploadError('');
      return;
    }

    try {
      setPdfUploading(true);
      setPdfUploadError('');

      // TODO: Implement actual file upload to Firebase Storage
      // For now, we'll just store the file object
      setFormData(prev => ({
        ...prev,
        pdfFile: file,
        pdfFileName: file.name,
        pdfUrl: '', // Will be set after upload
        pdfStoragePath: '' // Will be set after upload
      }));

    } catch (error) {
      console.error('Error uploading PDF:', error);
      setPdfUploadError('Failed to upload PDF. Please try again.');
    } finally {
      setPdfUploading(false);
    }
  };

  // Handle PDF file removal
  const handlePDFRemove = () => {
    setFormData(prev => ({
      ...prev,
      pdfFile: null,
      pdfFileName: '',
      pdfUrl: '',
      pdfStoragePath: ''
    }));
    setPdfUploadError('');
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateNoticeData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check if PDF is required but not uploaded
    if (!formData.pdfFile && !formData.pdfUrl) {
      setErrors({ pdf: 'PDF attachment is required for mediation notices' });
      return;
    }

    // Clear errors and submit
    setErrors({});
    onSubmit(formData);
  };

  // Format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  // Get current PDF file info
  const getCurrentPDFFile = () => {
    if (formData.pdfFile) {
      return {
        name: formData.pdfFile.name,
        size: formData.pdfFile.size,
        url: null
      };
    } else if (formData.pdfUrl && formData.pdfFileName) {
      return {
        name: formData.pdfFileName,
        url: formData.pdfUrl,
        uploadedAt: formData.pdfUploadedAt
      };
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'create' ? 'Create New Notice' : 'Edit Notice'}
          </h2>
          <p className="text-gray-600">
            Create a mediation notice with PDF attachment to send to all participants.
          </p>
        </div>

        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Case Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Case *
              </label>
              <select
                value={formData.caseId}
                onChange={(e) => handleCaseChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.caseId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={mode === 'edit'}
              >
                <option value="">Select a case...</option>
                {cases.map(case_ => (
                  <option key={case_.id} value={case_.id}>
                    {case_.caseName || case_.caseNumber} 
                    {case_.caseNumber && case_.caseName && ` (${case_.caseNumber})`}
                  </option>
                ))}
              </select>
              {errors.caseId && (
                <p className="mt-1 text-sm text-red-600">{errors.caseId}</p>
              )}
            </div>

            {/* Notice Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notice Type *
              </label>
              <select
                value={formData.noticeType}
                onChange={(e) => setFormData(prev => ({ ...prev, noticeType: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.noticeType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {getNoticeTypeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.noticeType && (
                <p className="mt-1 text-sm text-red-600">{errors.noticeType}</p>
              )}
            </div>

            {/* Mediator Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mediator Name
              </label>
              <input
                type="text"
                value={formData.mediatorName}
                onChange={(e) => setFormData(prev => ({ ...prev, mediatorName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter mediator name..."
              />
            </div>
          </div>
        </div>

        {/* Mediation Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mediation Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mediation Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mediation Date *
              </label>
              <input
                type="date"
                value={formData.mediationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, mediationDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.mediationDate ? 'border-red-300' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.mediationDate && (
                <p className="mt-1 text-sm text-red-600">{errors.mediationDate}</p>
              )}
            </div>

            {/* Mediation Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mediation Time *
              </label>
              <input
                type="time"
                value={formData.mediationTime}
                onChange={(e) => setFormData(prev => ({ ...prev, mediationTime: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.mediationTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.mediationTime && (
                <p className="mt-1 text-sm text-red-600">{errors.mediationTime}</p>
              )}
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter mediation location..."
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional additional notes or instructions..."
              />
            </div>
          </div>
        </div>

        {/* PDF Upload */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Attachment *</h3>
          
          <PDFUpload
            onFileSelect={handlePDFSelect}
            onFileRemove={handlePDFRemove}
            currentFile={getCurrentPDFFile()}
            loading={pdfUploading}
            error={pdfUploadError}
          />
          
          {errors.pdf && (
            <p className="mt-2 text-sm text-red-600">{errors.pdf}</p>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
            <button
              type="button"
              onClick={addParticipant}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Add Participant
            </button>
          </div>

          {formData.participants.length > 0 ? (
            <div className="space-y-4">
              {formData.participants.map((participant, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={participant.name || ''}
                      onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Participant name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={participant.email || ''}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={participant.role || ''}
                      onChange={(e) => updateParticipant(index, 'role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Role (optional)"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeParticipant(index)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p>No participants added yet</p>
              <p className="text-sm">Add participants who will receive the notice</p>
            </div>
          )}
          
          {errors.participants && (
            <p className="mt-2 text-sm text-red-600">{errors.participants}</p>
          )}
        </div>

        {/* Preview */}
        {formData.caseId && formData.noticeType && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Preview</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Subject:</strong> {generateNoticeSubject(formData)}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Attachment:</strong> {formData.pdfFileName || 'No PDF attached'}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || pdfUploading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </span>
            ) : (
              mode === 'create' ? 'Create Notice' : 'Update Notice'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoticeForm;