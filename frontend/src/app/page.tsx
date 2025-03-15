"use client";

import { useEffect, useState } from "react";
import VideoRecorder from "@/components/VideoRecorder";
import SubtitleOverlay from "@/components/SubtitleOverlay";
import RecordingControls from "@/components/RecordingControls";
import SubtitleSettingsPanel from "@/components/SubtitleSettingsPanel";
import LanguageSelector from "@/components/LanguageSelector";
import useSocket from "@/hooks/useSocket";
import { Language } from "@/utils/api";

export type Subtitle = {
  originalText: string;
  translatedText: string;
  sourceLang: Language;
  targetLang: Language;
  isPartial: boolean;
  timestamp: number;
};

export let BACKEND_URL = "http://localhost:5033";

export default function Home() {
  // Global states
  useEffect(() => {
    fetch('../../../config.json')
      .then(res => res.json())
      .then(config => {
        console.log('Loaded config:', config);
        if (config.BACKEND_URL) {
          BACKEND_URL = config.BACKEND_URL;
        }
      })
      .catch(err => {
        console.error('Failed to load config:', err);
      });
  }, []);

  const [subtitle, setSubtitle] = useState<Subtitle | null>(null);
  const {
    languages,
    socketConnected,
    handleSourceLanguageChange,
    handleTargetLanguageChange
  } = useSocket(
    setSubtitle
  );
  const [recording, setRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    bgColor: "rgba(0,0,0,0.5)",
    outline: false,
  });
  const [subtitleHistory, setSubtitleHistory] = useState<
    Array<{ text: string; lang: string; startTime: number }>
  >([]);

  // Recording controls (start, stop, toggle audio, download, etc.)
  const downloadVideo = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
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

  const downloadSubtitles = () => {
    if (subtitleHistory.length === 0) return;

    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const milliseconds = ms % 1000;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds
          .toString()
          .padStart(3, "0")}`;
    };

    let srtContent = "";
    subtitleHistory.forEach((item, index) => {
      const endTime =
        index < subtitleHistory.length - 1
          ? subtitleHistory[index + 1].startTime
          : item.startTime + 3000;
      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(item.startTime)} --> ${formatTime(
        endTime
      )}\n`;
      srtContent += `${item.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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

      {/* Socket connection status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${socketConnected ? "bg-green-500" : "bg-red-500"
            }`}
        ></div>
        <span className={socketConnected ? "text-green-600" : "text-red-600"}>
          {socketConnected ? "Connected to backend" : "Not connected to backend"}
        </span>
      </div>

      {/* Video stream and face mesh processing */}
      <VideoRecorder
        setSubtitle={setSubtitle}
        recording={recording}
        setRecording={setRecording}
        setRecordedVideo={setRecordedVideo}
        setRecordedBlob={setRecordedBlob}
        setSubtitleHistory={setSubtitleHistory}
        subtitle={subtitle}
      />

      {/* Subtitle overlay */}
      <SubtitleOverlay
        subtitle={subtitle}
        showSubtitles={showSubtitles}
        subtitleSettings={subtitleSettings}
      />

      {/* Language selector */}
      <LanguageSelector
        languages={languages}
        onSourceLanguageChange={handleSourceLanguageChange}
        onTargetLanguageChange={handleTargetLanguageChange}
      />

      {/* Recording and subtitle controls */}
      <RecordingControls
        recording={recording}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        startRecording={() => { }}
        stopRecording={() => { }}
        toggleAudio={() => { }}
        showSubtitles={showSubtitles}
        setShowSubtitles={setShowSubtitles}
        setShowSettings={setShowSettings}
      />

      {/* Subtitle settings panel */}
      {showSettings && (
        <SubtitleSettingsPanel
          subtitleSettings={subtitleSettings}
          setSubtitleSettings={setSubtitleSettings}
        />
      )}

      {/* Recorded video preview and download options */}
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
