import { useState, useRef, useEffect } from 'react';
import './AudioRecorder.css';

const AudioRecorder = ({ onAudioRecorded, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        setAudioBlob(audioBlob);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Convert to base64 for storage/transmission
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          onAudioRecorded({
            blob: audioBlob,
            url: url,
            base64: base64Audio,
            duration: recordingTime,
            size: audioBlob.size
          });
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setError(null);
    
    onAudioRecorded(null); // Clear audio from parent
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileSizeString = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  return (
    <div className="audio-recorder">
      <div className="recorder-header">
        <h4>🎤 Voice Description (Optional)</h4>
        <p>Record additional details about the emergency situation</p>
      </div>

      {error && (
        <div className="recorder-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="recorder-controls">
        {!audioBlob ? (
          <div className="recording-section">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={disabled}
                className="record-btn start"
              >
                <span className="record-icon">🎤</span>
                Start Recording
              </button>
            ) : (
              <div className="recording-active">
                <button
                  type="button"
                  onClick={stopRecording}
                  className="record-btn stop"
                >
                  <span className="record-icon recording">⏹️</span>
                  Stop Recording
                </button>
                <div className="recording-timer">
                  <span className="recording-dot"></span>
                  {formatTime(recordingTime)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="playback-section">
            <div className="audio-info">
              <div className="audio-details">
                <span className="audio-duration">🕒 {formatTime(recordingTime)}</span>
                <span className="audio-size">📁 {getFileSizeString(audioBlob.size)}</span>
              </div>
              
              <div className="playback-controls">
                <button
                  type="button"
                  onClick={playAudio}
                  className="play-btn"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                
                <button
                  type="button"
                  onClick={deleteRecording}
                  className="delete-btn"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      <div className="recorder-instructions">
        <p><strong>Tips for better recording:</strong></p>
        <ul>
          <li>🔇 Find a quiet location if possible</li>
          <li>📱 Hold device close to your mouth</li>
          <li>🗣️ Speak clearly and describe the situation in detail</li>
          <li>⏱️ Keep recordings under 2 minutes for faster processing</li>
        </ul>
      </div>
    </div>
  );
};

export default AudioRecorder;
