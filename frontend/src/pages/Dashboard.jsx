import {useState} from 'react';
import { File, Upload, Download } from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
  const [summaries, setSummaries] = useState([
    { id: 1, title: 'Q1 Planning Meeting', date: '2025-10-10', status: 'completed' },
    { id: 2, title: 'Sprint Review', date: '2025-10-08', status: 'completed' },
    { id: 3, title: 'Client Sync', date: '2025-10-05', status: 'completed' }
  ]);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      const newSummary = {
        id: summaries.length + 1,
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
        date: new Date().toISOString().split('T')[0],
        status: 'processing'
      };
      setSummaries([newSummary, ...summaries]);
      setSelectedFile(null);
      setTimeout(() => {
        setSummaries(prev => prev.map(s => s.id === newSummary.id ? { ...s, status: 'completed' } : s));
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Meeting</h2>
          <div className="flex items-center space-x-4">
            <label className="flex-1">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT, or Audio files</p>
                <input type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.docx,.txt,.mp3,.wav" />
              </div>
            </label>
            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              Upload
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Summaries</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {summaries.map((summary) => (
              <div key={summary.id} className="p-6 hover:bg-gray-50 transition cursor-pointer" onClick={() => onNavigate('summary', summary.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <File className="h-10 w-10 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{summary.title}</h3>
                      <p className="text-sm text-gray-500">{summary.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      summary.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {summary.status === 'completed' ? 'Completed' : 'Processing'}
                    </span>
                    <Download className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;