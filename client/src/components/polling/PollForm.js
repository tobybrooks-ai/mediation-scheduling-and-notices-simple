import React, { useState, useEffect } from 'react';
import { PollStatus, createPoll, createPollOption, validatePollData } from '../../models/PollModel';

const PollForm = ({ 
  initialData = null, 
  cases = [], 
  onSubmit, 
  onCancel, 
  loading = false,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    caseId: '',
    caseNumber: '',
    caseName: '',
    location: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    options: [],
    participants: [],
    status: PollStatus.DRAFT
  });

  const [errors, setErrors] = useState({});
  const [newOption, setNewOption] = useState({
    date: '',
    time: '',
    duration: 60,
    location: ''
  });

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        options: initialData.options || [],
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
        participants: selectedCase.participants || [],
        title: `Scheduling Poll - ${selectedCase.caseName || selectedCase.caseNumber}`
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

  // Add time option
  const addTimeOption = () => {
    if (!newOption.date || !newOption.time) {
      setErrors(prev => ({ ...prev, newOption: 'Date and time are required' }));
      return;
    }

    const option = createPollOption({
      date: newOption.date,
      time: newOption.time,
      duration: parseInt(newOption.duration) || 60,
      location: newOption.location || formData.location
    });

    setFormData(prev => ({
      ...prev,
      options: [...prev.options, option]
    }));

    setNewOption({
      date: '',
      time: '',
      duration: 60,
      location: ''
    });

    setErrors(prev => ({ ...prev, newOption: '', options: '' }));
  };

  // Remove time option
  const removeTimeOption = (optionId) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(option => option.id !== optionId)
    }));
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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validatePollData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
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

  // Format time for display
  const formatTimeForDisplay = (date, time) => {
    try {
      const dateObj = new Date(`${date}T${time}`);
      return dateObj.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return `${date} at ${time}`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'create' ? 'Create New Poll' : 'Edit Poll'}
          </h2>
          <p className="text-gray-600">
            Create a scheduling poll to find the best time for mediation with all participants.
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

            {/* Poll Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter poll title..."
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description or instructions for participants..."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter default location..."
              />
            </div>

            {/* Time Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Zone
              </label>
              <input
                type="text"
                value={formData.timeZone}
                onChange={(e) => setFormData(prev => ({ ...prev, timeZone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Time zone..."
              />
            </div>
          </div>
        </div>

        {/* Time Options */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Options</h3>
          
          {/* Add New Option */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Add Time Option</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={newOption.date}
                  onChange={(e) => setNewOption(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  value={newOption.time}
                  onChange={(e) => setNewOption(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={newOption.duration}
                  onChange={(e) => setNewOption(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="15"
                  max="480"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addTimeOption}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Add Option
                </button>
              </div>
            </div>
            
            {errors.newOption && (
              <p className="mt-2 text-sm text-red-600">{errors.newOption}</p>
            )}
          </div>

          {/* Current Options */}
          {formData.options.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-900">Current Options ({formData.options.length})</h4>
              {formData.options.map((option, index) => (
                <div key={option.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {formatTimeForDisplay(option.date, option.time)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Duration: {option.duration} minutes
                      {option.location && ` • Location: ${option.location}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTimeOption(option.id)}
                    className="ml-4 text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">⏰</div>
              <p>No time options added yet</p>
              <p className="text-sm">Add at least one time option for participants to vote on</p>
            </div>
          )}
          
          {errors.options && (
            <p className="mt-2 text-sm text-red-600">{errors.options}</p>
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
              <p className="text-sm">Add participants who will vote on the scheduling options</p>
            </div>
          )}
          
          {errors.participants && (
            <p className="mt-2 text-sm text-red-600">{errors.participants}</p>
          )}
        </div>

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
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </span>
            ) : (
              mode === 'create' ? 'Create Poll' : 'Update Poll'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PollForm;