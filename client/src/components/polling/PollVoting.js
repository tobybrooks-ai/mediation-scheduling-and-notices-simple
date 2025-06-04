import React, { useState, useEffect } from 'react';
import { VoteStatus, getVoteStatusDisplayName } from '../../models/PollModel';

const PollVoting = ({ 
  poll, 
  participantEmail, 
  existingVotes = [], 
  onSubmitVotes, 
  loading = false,
  submitted = false 
}) => {
  const [votes, setVotes] = useState({});
  const [participantName, setParticipantName] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  // Initialize votes from existing votes
  useEffect(() => {
    if (existingVotes.length > 0) {
      const voteMap = {};
      existingVotes.forEach(vote => {
        voteMap[vote.optionId] = vote.status;
        if (vote.participantName && !participantName) {
          setParticipantName(vote.participantName);
        }
        if (vote.notes && !notes) {
          setNotes(vote.notes);
        }
      });
      setVotes(voteMap);
    }
  }, [existingVotes, participantName, notes]);

  const handleVoteChange = (optionId, status) => {
    setVotes(prev => ({
      ...prev,
      [optionId]: status
    }));
    
    // Clear any errors for this option
    setErrors(prev => ({
      ...prev,
      [optionId]: ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate that at least one vote is submitted
    const voteEntries = Object.entries(votes);
    if (voteEntries.length === 0) {
      setErrors({ general: 'Please vote on at least one time option.' });
      return;
    }

    // Prepare vote data
    const voteData = {
      participantEmail,
      participantName: participantName.trim(),
      notes: notes.trim(),
      votes: voteEntries.map(([optionId, status]) => ({
        optionId,
        status,
        participantEmail,
        participantName: participantName.trim(),
        notes: notes.trim()
      }))
    };

    setErrors({});
    onSubmitVotes(voteData);
  };

  const formatDateTime = (date, time) => {
    try {
      const dateObj = new Date(`${date}T${time}`);
      return dateObj.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return `${date} at ${time}`;
    }
  };

  const getVoteStatusColor = (status) => {
    switch (status) {
      case VoteStatus.AVAILABLE:
        return 'bg-green-100 border-green-300 text-green-800';
      case VoteStatus.PREFERRED:
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case VoteStatus.UNAVAILABLE:
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getVoteCount = (status) => {
    return Object.values(votes).filter(vote => vote === status).length;
  };

  if (!poll) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Poll not found</h3>
        <p className="text-gray-600">The poll you're looking for doesn't exist or is no longer active.</p>
      </div>
    );
  }

  if (poll.status !== 'active') {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">⏰</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Poll not active</h3>
        <p className="text-gray-600">
          {poll.status === 'draft' && 'This poll has not been activated yet.'}
          {poll.status === 'finalized' && 'This poll has been finalized and is no longer accepting votes.'}
          {poll.status === 'cancelled' && 'This poll has been cancelled.'}
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Thank you for voting!</h2>
          <p className="text-green-800 mb-4">
            Your votes have been successfully submitted for the mediation scheduling poll.
          </p>
          <div className="bg-white p-4 rounded border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-green-800 text-left space-y-1">
              <li>• The mediator will review all participant responses</li>
              <li>• You'll receive a notification when the final time is selected</li>
              <li>• A formal mediation notice will be sent with all details</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{poll.title}</h1>
          
          <div className="text-gray-600 space-y-1 mb-4">
            <p><span className="font-medium">Case:</span> {poll.caseName || poll.caseNumber || 'N/A'}</p>
            {poll.description && <p><span className="font-medium">Description:</span> {poll.description}</p>}
            {poll.location && <p><span className="font-medium">Location:</span> {poll.location}</p>}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
            <p className="text-blue-800 text-sm">
              Please indicate your availability for each proposed time slot. You can select multiple options:
            </p>
            <ul className="text-blue-800 text-sm mt-2 space-y-1">
              <li><strong>Available:</strong> You can attend at this time</li>
              <li><strong>Preferred:</strong> This is your preferred time (if available)</li>
              <li><strong>Unavailable:</strong> You cannot attend at this time</li>
            </ul>
          </div>
        </div>

        {/* Participant Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={participantEmail}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>
          </div>
        </div>

        {/* Voting Options */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Time Options</h2>
            <div className="text-sm text-gray-600">
              {Object.keys(votes).length} of {poll.options?.length || 0} options voted
            </div>
          </div>

          {poll.options && poll.options.length > 0 ? (
            <div className="space-y-4">
              {poll.options.map((option) => {
                const currentVote = votes[option.id];
                
                return (
                  <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {formatDateTime(option.date, option.time)}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Duration: {option.duration} minutes
                        {option.location && option.location !== poll.location && ` • Location: ${option.location}`}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[VoteStatus.AVAILABLE, VoteStatus.PREFERRED, VoteStatus.UNAVAILABLE].map((status) => (
                        <label
                          key={status}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                            currentVote === status
                              ? getVoteStatusColor(status)
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`vote-${option.id}`}
                            value={status}
                            checked={currentVote === status}
                            onChange={(e) => handleVoteChange(option.id, e.target.value)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {getVoteStatusDisplayName(status)}
                            </div>
                            <div className="text-xs text-gray-600">
                              {status === VoteStatus.AVAILABLE && 'I can attend this time'}
                              {status === VoteStatus.PREFERRED && 'This is my preferred time'}
                              {status === VoteStatus.UNAVAILABLE && 'I cannot attend this time'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">⏰</div>
              <p>No time options available</p>
            </div>
          )}

          {errors.general && (
            <p className="mt-4 text-sm text-red-600">{errors.general}</p>
          )}
        </div>

        {/* Vote Summary */}
        {Object.keys(votes).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Vote Summary</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {getVoteCount(VoteStatus.AVAILABLE)}
                </div>
                <div className="text-sm text-green-800">Available</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {getVoteCount(VoteStatus.PREFERRED)}
                </div>
                <div className="text-sm text-blue-800">Preferred</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {getVoteCount(VoteStatus.UNAVAILABLE)}
                </div>
                <div className="text-sm text-red-800">Unavailable</div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h2>
          
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional comments or scheduling constraints..."
          />
        </div>

        {/* Submit Button */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {existingVotes.length > 0 ? (
                <span className="text-blue-600">✓ You have already voted. Submitting will update your previous votes.</span>
              ) : (
                <span>Please review your selections before submitting.</span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading || Object.keys(votes).length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </span>
              ) : (
                existingVotes.length > 0 ? 'Update Votes' : 'Submit Votes'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PollVoting;