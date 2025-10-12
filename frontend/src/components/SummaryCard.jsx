import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Users, ChevronRight } from 'lucide-react';
import { formatDate, truncateText, getStatusColor, getFileIcon } from '../utils/helper';

const SummaryCard = ({ summary }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/summary/${summary._id}`)}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{getFileIcon(summary.fileType)}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {summary.title}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(summary.createdAt)}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            summary.processingStatus
          )}`}
        >
          {summary.processingStatus}
        </span>
      </div>

      <p className="text-gray-600 mb-4">
        {truncateText(summary.summary || 'Processing...', 150)}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          {summary.participants && summary.participants.length > 0 && (
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{summary.participants.length} participants</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDate(summary.createdAt)}</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>

      {summary.keyPoints && summary.keyPoints.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Key Points:</p>
          <div className="flex flex-wrap gap-2">
            {summary.keyPoints.slice(0, 3).map((point, index) => (
              <span
                key={index}
                className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
              >
                {truncateText(point, 30)}
              </span>
            ))}
            {summary.keyPoints.length > 3 && (
              <span className="inline-block text-blue-600 text-xs px-2 py-1">
                +{summary.keyPoints.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;