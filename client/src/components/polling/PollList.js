import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PollStatus, getPollStatusDisplayName, getPollParticipationRate } from '../../models/PollModel';

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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getPollStatusDisplayName(status)}
    </span>
  );
};

const PollList = ({ polls, loading, onCreatePoll, onDeletePoll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter and sort polls
  const filteredPolls = polls
    .filter(poll => {
      const matchesSearch = !searchTerm || 
        poll.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poll.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poll.caseName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || poll.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          bValue = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          break;
        case 'status':
          aValue = a.status || 'draft';
          bValue = b.status || 'draft';
          break;
        case 'participantCount':
          aValue = a.participants ? a.participants.length : 0;
          bValue = b.participants ? b.participants.length : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading polls...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scheduling Polls</h2>
          <p className="text-gray-600">Create and manage mediation scheduling polls</p>
        </div>
        <button
          onClick={onCreatePoll}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create New Poll
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value={PollStatus.DRAFT}>Draft</option>
              <option value={PollStatus.ACTIVE}>Active</option>
              <option value={PollStatus.FINALIZED}>Finalized</option>
              <option value={PollStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
              <option value="participantCount">Participants</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Polls List */}
      {filteredPolls.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {polls.length === 0 ? 'No polls yet' : 'No polls match your filters'}
          </h3>
          <p className="text-gray-600 mb-4">
            {polls.length === 0 
              ? 'Create your first scheduling poll to get started.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {polls.length === 0 && (
            <button
              onClick={onCreatePoll}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Your First Poll
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPolls.map((poll) => (
            <div key={poll.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {poll.title || 'Untitled Poll'}
                    </h3>
                    <PollStatusBadge status={poll.status} />
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Case:</span> {poll.caseName || poll.caseNumber || 'N/A'}</p>
                    {poll.description && (
                      <p><span className="font-medium">Description:</span> {poll.description}</p>
                    )}
                    <p><span className="font-medium">Created:</span> {formatDate(poll.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/polls/${poll.id}`}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                  
                  {poll.status === PollStatus.DRAFT && (
                    <Link
                      to={`/polls/${poll.id}/edit`}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Edit
                    </Link>
                  )}
                  
                  {(poll.status === PollStatus.DRAFT || poll.status === PollStatus.CANCELLED) && onDeletePoll && (
                    <button
                      onClick={() => onDeletePoll(poll.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Poll Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {poll.participants ? poll.participants.length : 0}
                  </div>
                  <div className="text-xs text-gray-600">Participants</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {poll.options ? poll.options.length : 0}
                  </div>
                  <div className="text-xs text-gray-600">Time Options</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {poll.votesReceived || 0}
                  </div>
                  <div className="text-xs text-gray-600">Votes Received</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {getPollParticipationRate(poll)}%
                  </div>
                  <div className="text-xs text-gray-600">Participation</div>
                </div>
              </div>

              {/* Quick Actions */}
              {poll.status === PollStatus.ACTIVE && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Poll is active and collecting votes
                    </span>
                    <div className="flex gap-2">
                      <Link
                        to={`/polls/${poll.id}/results`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Results
                      </Link>
                      <span className="text-gray-300">•</span>
                      <Link
                        to={`/polls/${poll.id}/send-reminders`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Send Reminders
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {poll.status === PollStatus.FINALIZED && poll.finalizedOptionId && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Poll finalized - Ready to create notice
                    </span>
                    <Link
                      to={`/notices/create?pollId=${poll.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Create Notice
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {filteredPolls.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredPolls.length} of {polls.length} polls
        </div>
      )}
    </div>
  );
};

export default PollList;