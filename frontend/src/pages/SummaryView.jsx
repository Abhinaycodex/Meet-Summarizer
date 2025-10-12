import { Download } from 'lucide-react';
import React from 'react';


const SummaryView = ({ onNavigate }) => {
  const mockSummary = {
    title: 'Q1 Planning Meeting',
    date: '2025-10-10',
    attendees: ['John Doe', 'Jane Smith', 'Bob Johnson'],
    summary: 'The team discussed Q1 objectives, budget allocation, and resource planning. Key priorities include product launch, market expansion, and team growth.',
    keyPoints: [
      'Product launch scheduled for March 2025',
      'Marketing budget increased by 20%',
      'Hiring 5 new team members in Q1',
      'Focus on customer retention strategies'
    ],
    actionItems: [
      { task: 'Finalize product roadmap', owner: 'John Doe', deadline: '2025-10-20' },
      { task: 'Create hiring plan', owner: 'Jane Smith', deadline: '2025-10-25' },
      { task: 'Review marketing campaigns', owner: 'Bob Johnson', deadline: '2025-10-30' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => onNavigate('dashboard')} className="text-blue-600 hover:text-blue-700 mb-4">
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{mockSummary.title}</h1>
            <p className="text-gray-600">{mockSummary.date}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Attendees</h2>
            <div className="flex flex-wrap gap-2">
              {mockSummary.attendees.map((attendee, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {attendee}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Summary</h2>
            <p className="text-gray-700 leading-relaxed">{mockSummary.summary}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Key Points</h2>
            <ul className="space-y-2">
              {mockSummary.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Action Items</h2>
            <div className="space-y-3">
              {mockSummary.actionItems.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.task}</h3>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Owner: {item.owner}</span>
                    <span>Deadline: {item.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Download Summary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;