import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CaseStatus, 
  CaseType,
  getCaseStatusDisplayName,
  getCaseTypeDisplayName,
  isCaseScheduled,
  getCaseParticipantCount,
  formatCaseDateTime
} from '../../models/CaseModel';

const CaseStatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case CaseStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case CaseStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case CaseStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case CaseStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getCaseStatusDisplayName(status)}
    </span>
  );
};

const CaseTypeIcon = ({ type }) => {
  const getIcon = (type) => {
    switch (type) {
      case CaseType.COUNTY:
        return '🏛️';
      case CaseType.FAMILY:
        return '👨‍👩‍👧‍👦';
      case CaseType.CIRCUIT:
        return '⚖️';
      case CaseType.DEPENDENCY:
        return '👶';
      default:
        return '📁';
    }
  };

  return <span className="text-lg mr-2">{getIcon(type)}</span>;
};

const CaseList = ({ cases, loading, onCreateCase, onDeleteCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter and sort cases
  const filteredCases = cases
    .filter(case_ => {
      const matchesSearch = !searchTerm || 
        case_.caseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.mediatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
      const matchesType = typeFilter === 'all' || case_.caseType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'caseName':
          aValue = a.caseName || a.caseNumber || '';
          bValue = b.caseName || b.caseNumber || '';
          break;
        case 'caseNumber':
          aValue = a.caseNumber || '';
          bValue = b.caseNumber || '';
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          bValue = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          break;
        case 'scheduledDate':
          aValue = a.scheduledDate ? new Date(a.scheduledDate) : new Date(0);
          bValue = b.scheduledDate ? new Date(b.scheduledDate) : new Date(0);
          break;
        case 'status':
          aValue = a.status || 'draft';
          bValue = b.status || 'draft';
          break;
        case 'caseType':
          aValue = a.caseType || '';
          bValue = b.caseType || '';
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
        <span className="ml-2 text-gray-600">Loading cases...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cases</h2>
          <p className="text-gray-600">Manage mediation cases and participants</p>
        </div>
        {onCreateCase && (
          <button
            onClick={onCreateCase}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create New Case
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search cases..."
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
              <option value={CaseStatus.DRAFT}>Draft</option>
              <option value={CaseStatus.SCHEDULED}>Scheduled</option>
              <option value={CaseStatus.COMPLETED}>Completed</option>
              <option value={CaseStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value={CaseType.COUNTY}>County</option>
              <option value={CaseType.FAMILY}>Family</option>
              <option value={CaseType.CIRCUIT}>Circuit</option>
              <option value={CaseType.DEPENDENCY}>Dependency</option>
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
              <option value="caseName">Case Name</option>
              <option value="caseNumber">Case Number</option>
              <option value="scheduledDate">Scheduled Date</option>
              <option value="status">Status</option>
              <option value="caseType">Type</option>
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

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {cases.length === 0 ? 'No cases yet' : 'No cases match your filters'}
          </h3>
          <p className="text-gray-600 mb-4">
            {cases.length === 0 
              ? 'Create your first case to get started.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {cases.length === 0 && onCreateCase && (
            <button
              onClick={onCreateCase}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Your First Case
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCases.map((case_) => (
            <div key={case_.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CaseTypeIcon type={case_.caseType} />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {case_.caseName || case_.caseNumber || 'Untitled Case'}
                    </h3>
                    <CaseStatusBadge status={case_.status} />
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Case Number:</span> {case_.caseNumber || 'N/A'}</p>
                    <p><span className="font-medium">Type:</span> {getCaseTypeDisplayName(case_.caseType)}</p>
                    {case_.mediatorName && (
                      <p><span className="font-medium">Mediator:</span> {case_.mediatorName}</p>
                    )}
                    {case_.location && (
                      <p><span className="font-medium">Location:</span> {case_.location}</p>
                    )}
                    <p><span className="font-medium">Created:</span> {formatDate(case_.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/cases/${case_.id}`}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                  
                  {case_.status === CaseStatus.DRAFT && (
                    <Link
                      to={`/cases/${case_.id}/edit`}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Edit
                    </Link>
                  )}
                  
                  {(case_.status === CaseStatus.DRAFT || case_.status === CaseStatus.CANCELLED) && onDeleteCase && (
                    <button
                      onClick={() => onDeleteCase(case_.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Case Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {getCaseParticipantCount(case_)}
                  </div>
                  <div className="text-xs text-gray-600">Participants</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {case_.pollsCount || 0}
                  </div>
                  <div className="text-xs text-gray-600">Polls</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {case_.noticesCount || 0}
                  </div>
                  <div className="text-xs text-gray-600">Notices</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {case_.activitiesCount || 0}
                  </div>
                  <div className="text-xs text-gray-600">Activities</div>
                </div>
              </div>

              {/* Quick Actions */}
              {case_.status === CaseStatus.DRAFT && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Ready to create scheduling poll
                    </span>
                    <Link
                      to={`/polls/create?caseId=${case_.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Create Poll
                    </Link>
                  </div>
                </div>
              )}

              {isCaseScheduled(case_) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600">
                      ✓ Scheduled: {formatCaseDateTime(case_)}
                    </span>
                    <Link
                      to={`/notices/create?caseId=${case_.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
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
      {filteredCases.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredCases.length} of {cases.length} cases
        </div>
      )}
    </div>
  );
};

export default CaseList;