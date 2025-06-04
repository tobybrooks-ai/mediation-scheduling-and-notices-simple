import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PollStatus, 
  VoteStatus,
  getPollStatusDisplayName,
  getVoteStatusDisplayName,
  canActivatePoll,
  canFinalizePoll,
  getPollParticipationRate,
  calculateOptionVoteCounts,
  getBestPollOption
} from '../../models/PollModel';

const PollStatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case PollStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case PollStatus.ACTIVE:
        return 'bg-blue-100 text-blue-800';
      case PollStatus.FINALIZED:
        return 'bg-green-100 text-green-800';
      case PollStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
      {getPollStatusDisplayName(status)}
    </span>
  );
};

const VoteStatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case VoteStatus.AVAILABLE:
        return 'bg-green-100 text-green-800';
      case VoteStatus.PREFERRED:
        return 'bg-blue-100 text-blue-800';
      case VoteStatus.UNAVAILABLE:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getVoteStatusDisplayName(status)}
    </span>
  );
};

const PollDetail = ({ 
  poll, 
  votes = [], 
  loading = false, 
  onActivatePoll, 
  onFinalizePoll, 
  onCancelPoll,
  onSendInvitations,
  onSendReminders,
  onDeletePoll 
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);

  // Calculate vote statistics for each option
  const optionsWithVotes = poll?.options?.map(option => {
    const counts = calculateOptionVoteCounts(option, votes);
    return { ...option, ...counts };
  }) || [];

  // Get best option recommendation
  const bestOption = getBestPollOption(poll, votes);

  // Get participant voting status
  const participantStatus = poll?.participants?.map(participant => {
    const participantVotes = votes.filter(vote => vote.participantEmail === participant.email);
    return {
      ...participant,
      hasVoted: participantVotes.length > 0,
      voteCount: participantVotes.length,
      votes: participantVotes
    };
  }) || [];

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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleFinalizePoll = () => {
    if (!selectedOptionId) {
      alert('Please select a time option to finalize the poll.');
      return;
    }
    onFinalizePoll(selectedOptionId);
    setShowConfirmDialog(null);
  };

  const handleAction = (action, data = null) => {
    switch (action) {
      case 'activate':
        onActivatePoll();
        break;
      case 'finalize':
        setShowConfirmDialog('finalize');
        break;
      case 'cancel':
        setShowConfirmDialog('cancel');
        break;
      case 'delete':
        setShowConfirmDialog('delete');
        break;
      case 'sendInvitations':
        onSendInvitations();
        break;
      case 'sendReminders':
        onSendReminders();
        break;
      default:
        break;
    }
  };

  const confirmAction = () => {
    switch (showConfirmDialog) {
      case 'finalize':
        handleFinalizePoll();
        break;
      case 'cancel':
        onCancelPoll();
        setShowConfirmDialog(null);
        break;
      case 'delete':
        onDeletePoll();
        setShowConfirmDialog(null);
        break;
      default:
        setShowConfirmDialog(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading poll details...</span>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Poll not found</h3>
        <p className="text-gray-600">The poll you're looking for doesn't exist or has been deleted.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{poll.title}</h1>
              <PollStatusBadge status={poll.status} />
            </div>
            
            <div className="text-gray-600 space-y-1">
              <p><span className="font-medium">Case:</span> {poll.caseName || poll.caseNumber || 'N/A'}</p>
              {poll.description && <p><span className="font-medium">Description:</span> {poll.description}</p>}
              <p><span className="font-medium">Created:</span> {formatDate(poll.createdAt)}</p>
              {poll.location && <p><span className="font-medium">Location:</span> {poll.location}</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            {poll.status === PollStatus.DRAFT && (
              <>
                <Link
                  to={`/polls/${poll.id}/edit`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Edit Poll
                </Link>
                
                {canActivatePoll(poll) && (
                  <button
                    onClick={() => handleAction('activate')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Activate Poll
                  </button>
                )}
                
                <button
                  onClick={() => handleAction('delete')}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </>
            )}

            {poll.status === PollStatus.ACTIVE && (
              <>
                <button
                  onClick={() => handleAction('sendInvitations')}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Send Invitations
                </button>
                
                <button
                  onClick={() => handleAction('sendReminders')}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Send Reminders
                </button>
                
                {canFinalizePoll(poll) && (
                  <button
                    onClick={() => handleAction('finalize')}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Finalize Poll
                  </button>
                )}
                
                <button
                  onClick={() => handleAction('cancel')}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Cancel Poll
                </button>
              </>
            )}

            {poll.status === PollStatus.FINALIZED && (
              <Link
                to={`/notices/create?pollId=${poll.id}`}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Create Notice
              </Link>
            )}
          </div>
        </div>

        {/* Poll Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {poll.participants ? poll.participants.length : 0}
            </div>
            <div className="text-sm text-gray-600">Participants</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {poll.options ? poll.options.length : 0}
            </div>
            <div className="text-sm text-gray-600">Time Options</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {poll.votesReceived || 0}
            </div>
            <div className="text-sm text-gray-600">Votes Received</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {getPollParticipationRate(poll)}%
            </div>
            <div className="text-sm text-gray-600">Participation</div>
          </div>
        </div>
      </div>

      {/* Time Options and Results */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Options & Results</h2>
        
        {bestOption && poll.status === PollStatus.ACTIVE && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">🏆 Recommended Option</h3>
            <p className="text-blue-800">
              <strong>{formatDateTime(bestOption.date, bestOption.time)}</strong>
              <span className="ml-2 text-sm">
                (Score: {bestOption.score} • {bestOption.availableCount} available, {bestOption.preferredCount} preferred)
              </span>
            </p>
          </div>
        )}

        {optionsWithVotes.length > 0 ? (
          <div className="space-y-4">
            {optionsWithVotes
              .sort((a, b) => {
                // Sort by score (preferred * 3 + available * 1 - unavailable * 2)
                const scoreA = (a.preferredCount * 3) + (a.availableCount * 1) - (a.unavailableCount * 2);
                const scoreB = (b.preferredCount * 3) + (b.availableCount * 1) - (b.unavailableCount * 2);
                return scoreB - scoreA;
              })
              .map((option, index) => {
                const score = (option.preferredCount * 3) + (option.availableCount * 1) - (option.unavailableCount * 2);
                const isSelected = selectedOptionId === option.id;
                const isBest = bestOption && bestOption.id === option.id;
                
                return (
                  <div 
                    key={option.id} 
                    className={`border rounded-lg p-4 ${
                      isBest ? 'border-blue-300 bg-blue-50' : 
                      isSelected ? 'border-green-300 bg-green-50' : 
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {formatDateTime(option.date, option.time)}
                          </h3>
                          {isBest && <span className="text-blue-600 text-sm font-medium">🏆 Best Option</span>}
                          {poll.finalizedOptionId === option.id && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              ✓ Selected
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">
                          Duration: {option.duration} minutes
                          {option.location && ` • Location: ${option.location}`}
                        </p>
                      </div>

                      {poll.status === PollStatus.ACTIVE && canFinalizePoll(poll) && (
                        <div className="ml-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="selectedOption"
                              value={option.id}
                              checked={isSelected}
                              onChange={(e) => setSelectedOptionId(e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-600">Select for finalization</span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Vote Statistics */}
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {option.availableCount}
                        </div>
                        <div className="text-xs text-gray-600">Available</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">
                          {option.preferredCount}
                        </div>
                        <div className="text-xs text-gray-600">Preferred</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">
                          {option.unavailableCount}
                        </div>
                        <div className="text-xs text-gray-600">Unavailable</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {score}
                        </div>
                        <div className="text-xs text-gray-600">Score</div>
                      </div>
                    </div>

                    {/* Vote Details */}
                    {option.totalVotes > 0 && (
                      <div className="border-t border-gray-200 pt-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Votes:</h4>
                        <div className="flex flex-wrap gap-2">
                          {votes
                            .filter(vote => vote.optionId === option.id)
                            .map((vote, voteIndex) => (
                              <div key={voteIndex} className="flex items-center gap-1">
                                <span className="text-sm text-gray-700">
                                  {vote.participantName || vote.participantEmail}
                                </span>
                                <VoteStatusBadge status={vote.status} />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
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
      </div>

      {/* Participants */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Participants</h2>
        
        {participantStatus.length > 0 ? (
          <div className="space-y-3">
            {participantStatus.map((participant, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {participant.name || participant.email}
                  </div>
                  {participant.name && (
                    <div className="text-sm text-gray-600">{participant.email}</div>
                  )}
                  {participant.role && (
                    <div className="text-sm text-gray-500">{participant.role}</div>
                  )}
                </div>
                
                <div className="text-right">
                  {participant.hasVoted ? (
                    <div className="text-green-600 font-medium text-sm">
                      ✓ Voted ({participant.voteCount} options)
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      Not voted yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>No participants added</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showConfirmDialog === 'finalize' && 'Finalize Poll'}
              {showConfirmDialog === 'cancel' && 'Cancel Poll'}
              {showConfirmDialog === 'delete' && 'Delete Poll'}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {showConfirmDialog === 'finalize' && 'Are you sure you want to finalize this poll? This action cannot be undone.'}
              {showConfirmDialog === 'cancel' && 'Are you sure you want to cancel this poll? Participants will be notified.'}
              {showConfirmDialog === 'delete' && 'Are you sure you want to delete this poll? This action cannot be undone.'}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded text-white font-medium transition-colors ${
                  showConfirmDialog === 'delete' || showConfirmDialog === 'cancel'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {showConfirmDialog === 'finalize' && 'Finalize'}
                {showConfirmDialog === 'cancel' && 'Cancel Poll'}
                {showConfirmDialog === 'delete' && 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollDetail;