import React, { useState, useRef, useEffect } from 'react';
import { Video, Square, Clock, Download, AlertCircle, CheckCircle, FileText, Loader } from 'lucide-react';

const Recorder = () => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [meetingData, setMeetingData] = useState(null);

  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recording]);

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError('');
      setUploadSuccess(false);
      setMeetingData(null);
      chunksRef.current = [];

      // Request screen capture with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      // Handle data available
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Handle recording stop
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideo(videoUrl);

        // Create file and upload
        const file = new File([blob], `meeting-${Date.now()}.webm`, { type: 'video/webm' });
        await uploadFile(file);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      // Handle stream end (user stops sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });

      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setRecording(true);
      setTimer(0);
    } catch (err) {
      setError('Failed to start recording. Please allow screen sharing permission.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setUploadSuccess(false);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", `Meeting Recording - ${new Date().toLocaleString()}`);

      console.log('Uploading to backend...');

      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Backend response:", data);

      if (!data.meeting) {
        throw new Error("Server did not return meeting data.");
      }

      setMeetingData(data.meeting);
      setUploadSuccess(true);

      // Update video URL to Cloudinary URL
      if (data.meeting.videoUrl) {
        setRecordedVideo(data.meeting.videoUrl);
      }

      return data.meeting;

    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload recording");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const downloadVideo = () => {
    if (recordedVideo) {
      const a = document.createElement('a');
      a.href = recordedVideo;
      a.download = `meeting-${Date.now()}.webm`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4">
            <Video className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Screen Recorder</h1>
          <p className="text-gray-600">Record your screen with audio and get AI summary</p>
        </div>

        {/* Timer Display */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center space-x-3">
            <Clock className={`h-6 w-6 ${recording ? 'text-red-600 animate-pulse' : 'text-gray-600'}`} />
            <span className="text-4xl font-mono font-bold text-gray-900">
              {formatTime(timer)}
            </span>
          </div>
          {recording && (
            <div className="flex items-center justify-center mt-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="ml-2 text-sm font-medium text-red-600">Recording in progress...</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium">Recording processed successfully!</p>
          </div>
        )}

        {/* Upload/Processing Status */}
        {uploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Loader className="animate-spin h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Processing your recording...</p>
                <p className="text-xs text-blue-600 mt-1">This may take a few minutes. Please wait.</p>
              </div>
            </div>
          </div>
        )}

        {/* Recording Button */}
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={uploading}
            className={`w-full max-w-xs py-4 px-8 rounded-xl font-semibold text-white text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${recording
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
              }`}
          >
            <div className="flex items-center justify-center space-x-3">
              {recording ? (
                <>
                  <Square className="h-6 w-6" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Video className="h-6 w-6" />
                  <span>Start Recording</span>
                </>
              )}
            </div>
          </button>

          {/* Download Button */}
          {recordedVideo && !recording && (
            <div className="w-full max-w-xs space-y-3">
              <button
                onClick={downloadVideo}
                className="w-full py-3 px-6 rounded-xl font-semibold text-purple-600 bg-purple-100 hover:bg-purple-200 transition-all transform hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Download Recording</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Preview Video */}
        {recordedVideo && !recording && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview</h3>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <video
                src={recordedVideo}
                controls
                className="w-full"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* Meeting Summary & Details */}
        {meetingData && (
          <div className="mt-6 space-y-4">
            {/* Summary */}
            {meetingData.summary && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-5">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Meeting Summary</h4>
                    <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {meetingData.summary}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Items */}
            {meetingData.actionItems && meetingData.actionItems.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-amber-600 mr-2" />
                  Action Items
                </h4>
                <ul className="space-y-2">
                  {meetingData.actionItems.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-amber-600 mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Meeting Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Title:</span>
                  <p className="font-medium text-gray-900">{meetingData.title}</p>
                </div>
                <div>
                  <span className="text-gray-500">Uploaded:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(meetingData.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">How to use:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click "Start Recording" to begin screen capture</li>
            <li>• Select the screen/window you want to record</li>
            <li>• Click "Stop Recording" when finished</li>
            <li>• The video will be automatically processed with AI</li>
            <li>• You'll receive a summary, transcript, and action items</li>
            <li>• Download the recording anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Recorder;