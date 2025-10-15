import React, { useState, useRef, useEffect } from 'react';
import { Video, Square, Clock, Download, AlertCircle, CheckCircle } from 'lucide-react';

const Recorder = () => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
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
        await uploadFile(file, blob);

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
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'uploads');

    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dnu3l4w7z/video/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Cloudinary upload successful:', data);
    setUploadSuccess(true);
    setRecordedVideo(data.secure_url); // You can now use Cloudinary-hosted video
    setUploading(false);
  } catch (err) {
    setError(`Failed to upload to Cloudinary: ${err.message}`);
    console.error('Cloudinary upload error:', err);
    setUploading(false);
  }
};


  const downloadVideo = () => {
    if (recordedVideo) {
      const a = document.createElement('a');
      a.href = recordedVideo;
      a.download = `meeting-${Date.now()}.webm`;
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
          <p className="text-gray-600">Record your screen with audio</p>
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
            <p className="text-sm text-green-800 font-medium">Recording uploaded successfully!</p>
          </div>
        )}

        {/* Upload Status */}
        {uploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-800 font-medium">Uploading recording...</p>
            </div>
          </div>
        )}

        {/* Recording Button */}
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={uploading}
            className={`w-full max-w-xs py-4 px-8 rounded-xl font-semibold text-white text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              recording
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
            <button
              onClick={downloadVideo}
              className="w-full max-w-xs py-3 px-6 rounded-xl font-semibold text-purple-600 bg-purple-100 hover:bg-purple-200 transition-all transform hover:scale-105 active:scale-95"
            >
              <div className="flex items-center justify-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Download Recording</span>
              </div>
            </button>
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

        {/* Instructions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">How to use:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click "Start Recording" to begin screen capture</li>
            <li>• Select the screen/window you want to record</li>
            <li>• Click "Stop Recording" when finished</li>
            <li>• The video will automatically upload and be available for download</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Recorder;