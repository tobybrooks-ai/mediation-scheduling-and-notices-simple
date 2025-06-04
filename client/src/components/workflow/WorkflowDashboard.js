import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const WorkflowStep = ({ step, isActive, isCompleted, onClick }) => {
  const getStepIcon = (step) => {
    switch (step.type) {
      case 'case':
        return '📁';
      case 'poll':
        return '📊';
      case 'notice':
        return '📄';
      default:
        return '⭕';
    }
  };

  const getStepColor = () => {
    if (isCompleted) return 'bg-green-500 text-white';
    if (isActive) return 'bg-blue-500 text-white';
    return 'bg-gray-200 text-gray-600';
  };

  return (
    <div className="flex items-center">
      <button
        onClick={onClick}
        className={`flex items-center justify-center w-10 h-10 rounded-full ${getStepColor()} transition-colors`}
      >
        <span className="text-lg">{getStepIcon(step)}</span>
      </button>
      <div className="ml-3">
        <h3 className={`text-sm font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
          {step.title}
        </h3>
        <p className="text-xs text-gray-500">{step.description}</p>
      </div>
    </div>
  );
};

const WorkflowProgress = ({ currentStep, steps, onStepClick }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Mediation Workflow</h2>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            <WorkflowStep
              step={step}
              isActive={currentStep === index}
              isCompleted={currentStep > index}
              onClick={() => onStepClick(index)}
            />
            
            {index < steps.length - 1 && (
              <div className="absolute left-5 top-10 w-0.5 h-6 bg-gray-200"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkflowCard = ({ workflow, onViewDetails, onContinue }) => {
  const getWorkflowStatus = (workflow) => {
    if (workflow.notice?.status === 'sent' || workflow.notice?.status === 'delivered') {
      return { status: 'completed', color: 'green', text: 'Completed' };
    } else if (workflow.poll?.status === 'finalized') {
      return { status: 'notice_pending', color: 'yellow', text: 'Notice Pending' };
    } else if (workflow.poll?.status === 'active') {
      return { status: 'voting', color: 'blue', text: 'Voting Active' };
    } else if (workflow.poll) {
      return { status: 'poll_draft', color: 'gray', text: 'Poll Draft' };
    } else {
      return { status: 'case_only', color: 'gray', text: 'Case Created' };
    }
  };

  const status = getWorkflowStatus(workflow);

  const getNextAction = () => {
    if (!workflow.poll) {
      return { text: 'Create Poll', action: () => window.location.href = `/polls/create?caseId=${workflow.case.id}` };
    } else if (workflow.poll.status === 'draft') {
      return { text: 'Activate Poll', action: () => onViewDetails('poll') };
    } else if (workflow.poll.status === 'finalized' && !workflow.notice) {
      return { text: 'Create Notice', action: () => window.location.href = `/notices/create?pollId=${workflow.poll.id}` };
    } else if (workflow.notice?.status === 'draft') {
      return { text: 'Send Notice', action: () => onViewDetails('notice') };
    }
    return null;
  };

  const nextAction = getNextAction();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {workflow.case.caseName || workflow.case.caseNumber}
          </h3>
          <p className="text-sm text-gray-600">
            {workflow.case.caseNumber && workflow.case.caseName && `Case #${workflow.case.caseNumber}`}
          </p>
        </div>
        
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
          {status.text}
        </span>
      </div>

      {/* Workflow Progress */}
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${workflow.case ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-xs text-gray-600">Case</span>
          
          <div className="w-4 h-0.5 bg-gray-300"></div>
          
          <div className={`w-3 h-3 rounded-full ${workflow.poll ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-xs text-gray-600">Poll</span>
          
          <div className="w-4 h-0.5 bg-gray-300"></div>
          
          <div className={`w-3 h-3 rounded-full ${workflow.notice ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-xs text-gray-600">Notice</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {workflow.poll && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Poll:</span> {workflow.poll.title}
            {workflow.poll.status === 'finalized' && workflow.poll.finalizedDate && (
              <span className="ml-2 text-green-600">
                (Scheduled: {new Date(workflow.poll.finalizedDate).toLocaleDateString()})
              </span>
            )}
          </div>
        )}
        
        {workflow.notice && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Notice:</span> {workflow.notice.noticeType} notice
            {workflow.notice.sentAt && (
              <span className="ml-2 text-green-600">
                (Sent: {new Date(workflow.notice.sentAt.seconds * 1000).toLocaleDateString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Link
            to={`/cases/${workflow.case.id}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Case
          </Link>
          
          {workflow.poll && (
            <Link
              to={`/polls/${workflow.poll.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Poll
            </Link>
          )}
          
          {workflow.notice && (
            <Link
              to={`/notices/${workflow.notice.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Notice
            </Link>
          )}
        </div>
        
        {nextAction && (
          <button
            onClick={nextAction.action}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            {nextAction.text}
          </button>
        )}
      </div>
    </div>
  );
};

const WorkflowDashboard = ({ workflows = [], loading = false, onRefresh }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');

  const filteredWorkflows = workflows
    .filter(workflow => {
      if (filter === 'all') return true;
      if (filter === 'active') return !workflow.notice || workflow.notice.status !== 'sent';
      if (filter === 'completed') return workflow.notice?.status === 'sent' || workflow.notice?.status === 'delivered';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'updated') {
        const aTime = a.case.updatedAt?.seconds || a.case.createdAt?.seconds || 0;
        const bTime = b.case.updatedAt?.seconds || b.case.createdAt?.seconds || 0;
        return bTime - aTime;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading workflows...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mediation Workflows</h2>
          <p className="text-gray-600">Track the complete case-to-notice workflow</p>
        </div>
        
        <button
          onClick={onRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Workflows</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workflow Cards */}
      {filteredWorkflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-600 mb-4">
            Create a case to start your first mediation workflow.
          </p>
          <Link
            to="/cases/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create Your First Case
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.case.id}
              workflow={workflow}
              onViewDetails={(type) => {
                if (type === 'case') window.location.href = `/cases/${workflow.case.id}`;
                if (type === 'poll') window.location.href = `/polls/${workflow.poll.id}`;
                if (type === 'notice') window.location.href = `/notices/${workflow.notice.id}`;
              }}
              onContinue={(action) => {
                // Handle continue actions
                console.log('Continue action:', action);
              }}
            />
          ))}
        </div>
      )}

      {/* Results Summary */}
      {filteredWorkflows.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredWorkflows.length} of {workflows.length} workflows
        </div>
      )}
    </div>
  );
};

export default WorkflowDashboard;