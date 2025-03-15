"use client";

import LanguageSelector from "@/components/LanguageSelector";
import { fetchLanguages, LanguageState, Language } from "@/utils/api";
import { useRef, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";

export const BACKEND_URL = 'http://localhost:5033';

type Subtitle = {
  text: string;
  lang: string;
  timestamp?: number;
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [subtitle, setSubtitle] = useState<Subtitle | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const chunks = useRef<Blob[]>([]);

  // Add refs to track previous mouth positions and speaking status
  const prevMouthPositions = useRef<Map<number, any[]>>(new Map());
  const speakingFaces = useRef<Map<number, boolean>>(new Map());
  const frameCounter = useRef<number>(0);
  // Add debounce counters for each face
  const speakingCounters = useRef<Map<number, number>>(new Map());
  const notSpeakingCounters = useRef<Map<number, number>>(new Map());
  // Threshold for mouth movement to be considered speaking
  const MOUTH_MOVEMENT_THRESHOLD = 0.015;
  // Debounce thresholds for speaking detection
  const SPEAKING_THRESHOLD = 3;
  const NOT_SPEAKING_THRESHOLD = 5;

  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    bgColor: 'rgba(0,0,0,0.5)',
    outline: false
  });
  const [subtitleHistory, setSubtitleHistory] = useState<Array<{
    text: string,
    lang: string,
    startTime: number
  }>>([]);

  // Record subtitle timestamps when they change
  useEffect(() => {
    if (subtitle && subtitle.text && recording) {
      setSubtitleHistory(prev => [...prev, {
        ...subtitle,
        startTime: Date.now() - recordingStartTime.current
      }]);
    }
  }, [subtitle, recording]);

  useEffect(() => {
    // Don't do anything if no subtitle is present
    if (!subtitle) return;

    // Check every second if subtitle is stale
    const interval = setInterval(() => {
      if (subtitle?.timestamp && (Date.now() - subtitle.timestamp > 3000)) {
        console.log('Clearing stale subtitle');
        setSubtitle(null);
      }
    }, 1000);

    // Clean up interval when component unmounts or subtitle changes
    return () => clearInterval(interval);
  }, [subtitle]);

  // Add a ref to track recording start time
  const recordingStartTime = useRef<number>(0);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.on('connect', async () => {
      console.log('Connected to backend');
      setSocketConnected(true);

      const langs = await fetchLanguages()
      setLanguages(langs);

      socket.emit('connect')
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setSocketConnected(false);
    });

    socket.on('error', () => {
      console.log('Connection error');
      setSocketConnected(false);
    });

    // Listen for the "subtitle" event
    socket.on('subtitle', (data) => {
      console.log('Received subtitle:', data);
      setSubtitle({
        ...data,
        timestamp: Date.now()
      });
    });

    socket.on('language_updated', (data) => {
      console.log('Language updated on server:', JSON.stringify(data));
      setLanguages(prev => ({ ...prev, current: data.lang }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const [languages, setLanguages] = useState({
    available: [] as Language[],
    loaded: [] as Language[],
    current: Language.English
  });

  const handleLanguageChange = (lang: Language) => {
    console.log(lang)
    // Parse the string to ensure it's a valid Language enum value
    const languageCode = Object.values(Language).includes(lang)
      ? lang as Language
      : Language.English; // Default fallback

    // Use socketio instead of fetch for more responsive updates
    if (socketRef.current) {
      socketRef.current.emit('language_changed', { lang: languageCode });

      // Optimistically update UI state
      setLanguages(prev => ({ ...prev, current: languageCode }));
      console.log(`Language changed to: ${languageCode}`);
    } else {
      console.error('Socket not connected, cannot change language');
    }
  };

  // onResults callback to detect mouth movement and draw detected mouth landmarks
  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Increment frame counter
    frameCounter.current += 1;

    // Default settings
    let zoom = 1;
    let faceCenterX = 0;
    let faceCenterY = 0;
    let activeSpeaker = -1;

    // Check if faces are detected
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      // Process each detected face
      results.multiFaceLandmarks.forEach((landmarks: any, faceIndex: number) => {
        // Get previous landmarks for this face
        const previousLandmarks = prevMouthPositions.current.get(faceIndex) || [];

        // Calculate mouth movement
        let mouthMovement = 0;

        if (previousLandmarks.length > 0) {
          // Focus specifically on mouth opening/closing landmarks
          // Upper lip: 13, 14, 312
          // Lower lip: 17, 15, 16
          // Corners: 61, 291
          const upperLipIndices = [13, 14, 312];
          const lowerLipIndices = [17, 15, 16];
          const cornerIndices = [61, 291];

          // Calculate vertical distance between upper and lower lip
          let upperLipY = 0;
          let lowerLipY = 0;

          upperLipIndices.forEach(index => {
            if (landmarks[index]) {
              upperLipY += landmarks[index].y;
            }
          });
          upperLipY /= upperLipIndices.length;

          lowerLipIndices.forEach(index => {
            if (landmarks[index]) {
              lowerLipY += landmarks[index].y;
            }
          });
          lowerLipY /= lowerLipIndices.length;

          // Current vertical mouth opening
          const currentMouthOpening = Math.abs(lowerLipY - upperLipY);

          // Previous vertical mouth opening
          let prevUpperLipY = 0;
          let prevLowerLipY = 0;

          upperLipIndices.forEach(index => {
            if (previousLandmarks[index]) {
              prevUpperLipY += previousLandmarks[index].y;
            }
          });
          prevUpperLipY /= upperLipIndices.length;

          lowerLipIndices.forEach(index => {
            if (previousLandmarks[index]) {
              prevLowerLipY += previousLandmarks[index].y;
            }
          });
          prevLowerLipY /= lowerLipIndices.length;

          const previousMouthOpening = Math.abs(prevLowerLipY - prevUpperLipY);

          // Calculate change in mouth opening
          const verticalMovement = Math.abs(currentMouthOpening - previousMouthOpening);

          // Also check horizontal movement of mouth corners
          let horizontalMovement = 0;
          cornerIndices.forEach(index => {
            const current = landmarks[index];
            const previous = previousLandmarks[index];

            if (current && previous) {
              // Focus more on horizontal movement (x) for mouth corners
              const dx = current.x - previous.x;
              horizontalMovement += Math.abs(dx);
            }
          });

          // Weight vertical movement more heavily as it's more indicative of speaking
          mouthMovement = (verticalMovement * 3) + (horizontalMovement * 1);
        }

        // Store current landmarks for next frame comparison
        prevMouthPositions.current.set(faceIndex, [...landmarks]);

        // Initialize counters if they don't exist
        if (!speakingCounters.current.has(faceIndex)) {
          speakingCounters.current.set(faceIndex, 0);
        }
        if (!notSpeakingCounters.current.has(faceIndex)) {
          notSpeakingCounters.current.set(faceIndex, 0);
        }

        // Get current speaking status
        let isSpeaking = speakingFaces.current.get(faceIndex) || false;

        // Update speaking status based on mouth movement with debounce
        if (mouthMovement > MOUTH_MOVEMENT_THRESHOLD) {
          // Increment speaking counter and reset not speaking counter
          speakingCounters.current.set(faceIndex, speakingCounters.current.get(faceIndex)! + 1);
          notSpeakingCounters.current.set(faceIndex, 0);

          // If speaking counter reaches threshold, mark as speaking
          if (speakingCounters.current.get(faceIndex)! >= SPEAKING_THRESHOLD) {
            isSpeaking = true;
          }
        } else {
          // Increment not speaking counter and reset speaking counter
          notSpeakingCounters.current.set(faceIndex, notSpeakingCounters.current.get(faceIndex)! + 1);
          speakingCounters.current.set(faceIndex, 0);

          // If not speaking counter reaches threshold, mark as not speaking
          if (notSpeakingCounters.current.get(faceIndex)! >= NOT_SPEAKING_THRESHOLD) {
            isSpeaking = false;
          }
        }

        // Update speaking status
        speakingFaces.current.set(faceIndex, isSpeaking);

        // If this face is speaking, make it the active speaker for zoom
        if (isSpeaking && activeSpeaker === -1) {
          activeSpeaker = faceIndex;

          // Compute the bounding box of the face
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          landmarks.forEach((landmark: any) => {
            minX = Math.min(minX, landmark.x);
            minY = Math.min(minY, landmark.y);
            maxX = Math.max(maxX, landmark.x);
            maxY = Math.max(maxY, landmark.y);
          });

          // Set the zoom factor when speaking
          zoom = 1.5; // Adjust as necessary

          // Compute face center in canvas coordinates
          faceCenterX = ((minX + maxX) / 2) * canvas.width;
          faceCenterY = ((minY + maxY) / 2) * canvas.height;
        }
      });
    }

    // Save the current context state
    ctx.save();

    if (activeSpeaker !== -1 && zoom !== 1) {
      // Apply zoom effect centered on the speaking face

      // Calculate the scaled dimensions
      const scaledWidth = canvas.width / zoom;
      const scaledHeight = canvas.height / zoom;

      // Calculate the top-left corner of the zoomed viewport
      const sourceX = Math.max(0, faceCenterX - (scaledWidth / 2));
      const sourceY = Math.max(0, faceCenterY - (scaledHeight / 2));

      // Ensure we don't go out of bounds
      const adjustedSourceX = Math.min(sourceX, canvas.width - scaledWidth);
      const adjustedSourceY = Math.min(sourceY, canvas.height - scaledHeight);

      // Draw the zoomed portion of the video
      ctx.drawImage(
        videoRef.current,
        adjustedSourceX, adjustedSourceY, scaledWidth, scaledHeight,
        0, 0, canvas.width, canvas.height
      );
    } else {
      // Draw the normal video frame
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Restore context to remove the zoom transformation for overlays
    ctx.restore();

    // Draw mouth landmarks and speaking indicators
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      results.multiFaceLandmarks.forEach((landmarks: any, faceIndex: number) => {
        const mouthIndices = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
        ctx.beginPath();
        mouthIndices.forEach((index, i) => {
          const landmark = landmarks[index];
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        const isFaceSpeaking = speakingFaces.current.get(faceIndex) || false;
        ctx.strokeStyle = isFaceSpeaking ? "red" : "lime";
        ctx.lineWidth = 2;
        ctx.stroke();
        if (isFaceSpeaking) {
          const mouthTop = landmarks[61];
          const labelX = mouthTop.x * canvas.width;
          const labelY = (mouthTop.y * canvas.height) - 10;
          ctx.font = "16px Arial";
          ctx.fillStyle = "red";
          ctx.fillText("Speaking", labelX - 30, labelY);
        }
      });
    }
  }, []);

  // Set up camera and Mediapipe FaceMesh pipeline
  useEffect(() => {
    async function setupCameraAndMediapipe() {
      try {
        // Get the camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Dynamically import Mediapipe modules
        const { FaceMesh } = await import("@mediapipe/face_mesh");
        const { Camera } = await import("@mediapipe/camera_utils");

        // Initialize FaceMesh with a locateFile function for WASM assets
        const faceMesh = new FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
          // TODO: diff model to dynamically change/detect faces
          maxNumFaces: 5,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        faceMesh.onResults(onResults);

        // Use Mediapipe Camera utility to process each frame
        if (videoRef.current) {
          const mpCamera = new Camera(videoRef.current, {
            onFrame: async () => {
              await faceMesh.send({ image: videoRef.current! });
            },
            width: 640,
            height: 480,
          });
          mpCamera.start();
        }
      } catch (err) {
        console.error("Error setting up camera or Mediapipe:", err);
      }
    }
    setupCameraAndMediapipe();

    // Cleanup: Stop all tracks when component unmounts
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onResults]);

  // Recording functionality remains the same
  const startRecording = () => {
    chunks.current = [];
    setSubtitleHistory([]);
    recordingStartTime.current = Date.now();
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "video/webm" });
        const videoURL = URL.createObjectURL(blob);
        setRecordedVideo(videoURL);
        setRecordedBlob(blob);
      };
      mediaRecorder.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const toggleAudio = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
      }
    }
  };

  const downloadVideo = () => {
    if (recordedBlob) {
      const url = window.URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `recorded-video-${timestamp}.webm`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  // Function to download subtitles as SRT file
  const downloadSubtitles = () => {
    if (subtitleHistory.length === 0) return;

    // Convert milliseconds to SRT format (00:00:00,000)
    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const milliseconds = ms % 1000;

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    };

    // Generate SRT content
    let srtContent = '';
    subtitleHistory.forEach((item, index) => {
      // Each subtitle shows for ~3 seconds
      const endTime = index < subtitleHistory.length - 1 ?
        subtitleHistory[index + 1].startTime :
        item.startTime + 3000;

      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(item.startTime)} --> ${formatTime(endTime)}\n`;
      srtContent += `${item.text}\n\n`;
    });

    // Create and download the file
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `subtitles-${timestamp}.srt`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold">Video Recorder with Mediapipe</h1>

      {/* Socket connection status indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}
        ></div>
        <span className={socketConnected ? 'text-green-600' : 'text-red-600'}>
          {socketConnected ? 'Connected to backend' : 'Not connected to backend'}
        </span>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Video container with canvas overlay */}
        <div className="relative w-[640px] h-[480px] bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0"
          />

          {/* Subtitle overlay */}
          {subtitle && showSubtitles && (
            <div
              className="absolute bottom-10 left-0 right-0 text-center px-6"
              style={{
                color: subtitleSettings.color,
                backgroundColor: subtitleSettings.bgColor,
                fontSize: `${subtitleSettings.fontSize}px`,
                fontWeight: subtitleSettings.fontWeight,
                textShadow: subtitleSettings.outline ? '1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000' : 'none',
                padding: '8px',
                borderRadius: '4px',
                maxWidth: '80%',
                margin: '0 auto',
                opacity: subtitle.timestamp && (Date.now() - subtitle.timestamp > 2500) ? 0.3 : 0.9,
                transition: 'opacity 0.5s ease',
              }}
            >
              {subtitle.text}
            </div>
          )}
        </div>

        <LanguageSelector
          languages={languages}
          onLanguageChange={handleLanguageChange}
        />

        <div className="flex gap-4">
          {!recording ? (
            <>
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Start Recording
              </button>
              <button
                onClick={toggleAudio}
                className={`px-4 py-2 ${audioEnabled
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-500 hover:bg-gray-600"
                  } text-white rounded-md transition-colors`}
              >
                {audioEnabled ? "Mic On" : "Mic Off"}
              </button>
            </>
          ) : (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Stop Recording
            </button>
          )}

          {/* Subtitle toggle button */}
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`px-4 py-2 ${showSubtitles
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gray-500 hover:bg-gray-600"
              } text-white rounded-md transition-colors`}
          >
            {showSubtitles ? "Subtitles On" : "Subtitles Off"}
          </button>

          {/* Subtitle settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            Subtitle Settings
          </button>
        </div>

        {/* Subtitle settings panel */}
        {showSettings && (
          <div className="mt-4 p-6 bg-gray-100 rounded-lg w-[640px] shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Subtitle Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="font-medium mb-3 text-gray-700">Text Appearance</h4>
                <div className="space-y-4">
                  <div>
                    <label className="flex justify-between text-sm mb-1">
                      <span>Font Size</span>
                      <span className="font-medium">{subtitleSettings.fontSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="36"
                      value={subtitleSettings.fontSize}
                      onChange={(e) => setSubtitleSettings({
                        ...subtitleSettings,
                        fontSize: parseInt(e.target.value)
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Font Weight</label>
                    <select
                      value={subtitleSettings.fontWeight}
                      onChange={(e) => setSubtitleSettings({
                        ...subtitleSettings,
                        fontWeight: e.target.value
                      })}
                      className="w-full rounded border p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="font-medium mb-3 text-gray-700">Color & Background</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">Text Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={subtitleSettings.color}
                        onChange={(e) => setSubtitleSettings({
                          ...subtitleSettings,
                          color: e.target.value
                        })}
                        className="w-12 h-8 rounded border"
                      />
                      <span className="text-sm text-gray-600">{subtitleSettings.color}</span>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={subtitleSettings.bgColor !== 'transparent'}
                        onChange={(e) => setSubtitleSettings({
                          ...subtitleSettings,
                          bgColor: e.target.checked ? 'rgba(0,0,0,0.5)' : 'transparent'
                        })}
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm">Show Background</span>
                    </label>

                    {subtitleSettings.bgColor !== 'transparent' && (
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          type="color"
                          value={subtitleSettings.bgColor.startsWith('rgba') ? '#000000' : subtitleSettings.bgColor}
                          onChange={(e) => {
                            // Convert hex to rgba with 0.5 opacity
                            const hex = e.target.value;
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            setSubtitleSettings({
                              ...subtitleSettings,
                              bgColor: `rgba(${r},${g},${b},0.5)`
                            });
                          }}
                          className="w-12 h-8 rounded border"
                        />
                        <span className="text-sm text-gray-600">Background color</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={subtitleSettings.outline}
                        onChange={(e) => setSubtitleSettings({
                          ...subtitleSettings,
                          outline: e.target.checked
                        })}
                        className="rounded text-blue-500 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm">Text Outline (improved readability)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-md flex items-center justify-center">
                <div className="px-6 py-3 text-center inline-block"
                  style={{
                    color: subtitleSettings.color,
                    backgroundColor: subtitleSettings.bgColor,
                    fontSize: `${subtitleSettings.fontSize}px`,
                    fontWeight: subtitleSettings.fontWeight,
                    textShadow: subtitleSettings.outline ? '1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000' : 'none',
                    borderRadius: '4px'
                  }}>
                  Preview Text
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {recordedVideo && (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">Recorded Video</h2>
          <video
            src={recordedVideo}
            controls
            className="w-[640px] rounded-lg"
          />

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={downloadVideo}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              Download Video
            </button>
            <button
              onClick={downloadSubtitles}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Download Subtitles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
