"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
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

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold">Video Recorder with Mediapipe</h1>

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
        </div>

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
                className={`px-4 py-2 ${
                  audioEnabled
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
        </div>
      </div>

      {recordedVideo && (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">Recorded Video</h2>
          <video
            src={recordedVideo}
            controls
            className="w-[640px] rounded-lg"
          />
          <button
            onClick={downloadVideo}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            Download Video
          </button>
        </div>
      )}
    </div>
  );
}
