import { useRef, useEffect, useCallback } from "react";
import { Language } from "@/utils/api";
import { Subtitle } from "@/app/page";

interface VideoRecorderProps {
  setSubtitle: (subtitle: Subtitle | null) => void;
  subtitle: Subtitle | null;
  recording: boolean;
  setRecording: (recording: boolean) => void;
  setRecordedVideo: (videoUrl: string | null) => void;
  setRecordedBlob: (blob: Blob | null) => void;
  setSubtitleHistory: (
    history: Array<{ text: string; lang: string; startTime: number }>
  ) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  setSubtitle,
  subtitle,
  recording,
  setRecording,
  setRecordedVideo,
  setRecordedBlob,
  setSubtitleHistory,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartTime = useRef<number>(0);
  const chunks = useRef<Blob[]>([]);

  // Define the onResults callback for processing Mediapipe results.
  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // (Include your face detection/processing logic here.
    // This is a simplified placeholder that draws the current video frame.)
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // For example, when a new subtitle is received:
    // setSubtitle({ text: "Detected speech", lang: Language.English, timestamp: Date.now() });
  }, [setSubtitle]);

  async function setupCameraAndMediapipe() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const { FaceMesh } = await import("@mediapipe/face_mesh");
      const { Camera } = await import("@mediapipe/camera_utils");

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

  useEffect(() => {
    setupCameraAndMediapipe();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onResults]);

  // Recording functions
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

  return (
    <div className="relative w-[640px] h-[480px] bg-gray-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay={true}
        playsInline={true}
        muted={true}
        className="w-full h-full object-cover"
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute top-0 left-0"
      />
      {/* Optionally you can expose start/stop functions via props or context */}
    </div>
  );
};

export default VideoRecorder;
