import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const FileUpload = ({ onFileSelect, onTextSubmit }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [mode, setMode] = useState('file'); // 'file' or 'text'

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  });

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const participantList = participants
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    await onFileSelect(selectedFile, title, participantList);
    setSelectedFile(null);
    setTitle('');
    setParticipants('');
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const participantList = participants
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    await onTextSubmit(textInput, title, participantList);
    setTextInput('');
    setTitle('');
    setParticipants('');
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`pb-2 px-1 ${
              mode === 'file'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setMode('file')}
          >
            Upload File
          </button>
          <button
            className={`pb-2 px-1 ${
              mode === 'text'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setMode('text')}
          >
            Paste Text
          </button>
        </div>
      </div>

      {mode === 'file' ? (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the file here</p>
            ) : (
              <>
                <p className="text-gray-600 mb-2">
                  Drag & drop a file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOCX, TXT, MP3, WAV (max 50MB)
                </p>
              </>
            )}
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your meeting transcript or notes here..."
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Q1 Planning Meeting"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Participants (optional)
          </label>
          <input
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="e.g., John Doe, Jane Smith, Mike Johnson"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Separate multiple names with commas
          </p>
        </div>

        <button
          onClick={mode === 'file' ? handleFileUpload : handleTextSubmit}
          disabled={mode === 'file' ? !selectedFile : !textInput.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Generate Summary
        </button>
      </div>
    </div>
  );
};

export default FileUpload;