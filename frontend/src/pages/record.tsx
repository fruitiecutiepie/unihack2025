"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Video,
  StopCircle,
  Save,
  Trash2,
  Subtitles,
  SubtitlesIcon as SubtitlesOff,
  Mic,
  MicOff,
  Settings,
  InfoIcon,
} from "lucide-react"
import { toast } from "@/hooks/useToast"
import LanguageSelector from "@/components/LanguageSelector"
import SubtitleSettingsPanel from "@/components/SubtitleSettingsPanel"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CustomSwitch } from "@/components/ui/custom-switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useSocket from "@/hooks/useSocket"

import "../app/globals.css";

type SubtitleLanguageOption = "original" | "translated" | "both"

export type Subtitle = {
  originalText: string;
  translatedText: string;
  isPartial: boolean;
  timestamp: number;
};

export default function RecordVideo() {
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [permission, setPermission] = useState<boolean | null>(null)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [micActive, setMicActive] = useState(false)
  const [subtitles, setSubtitles] = useState<Subtitle | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [subtitleLanguage, setSubtitleLanguage] = useState<SubtitleLanguageOption>("original")
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const subtitleIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Subtitle settings state
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    bgColor: "rgba(0,0,0,0.5)",
    outline: false,
  })

  // Subtitle history for SRT download
  const [subtitleHistory, setSubtitleHistory] = useState<Array<Subtitle>>([])

  // Connect to socket for real-time translation
  const {
    socketConnected,

    languages,
    setLanguages,

    sourceLanguage,
    targetLanguage,

    handleSourceLanguageChange,
    handleTargetLanguageChange
  } = useSocket(setSubtitles)

  // Sample subtitles that will rotate during recording
  // const sampleSubtitles = [
  //   "This is an AI-powered video editor",
  //   "It can automatically edit your videos",
  //   "Just record or upload your content",
  //   "The AI will handle the rest",
  //   "You can add effects and transitions",
  //   "Perfect for social media content",
  //   "Save time on video editing",
  //   "Create professional videos easily",
  // ]

  // // Sample translated subtitles
  // const sampleTranslatedSubtitles = [
  //   "Este es un editor de video con IA",
  //   "Puede editar automáticamente tus videos",
  //   "Solo graba o sube tu contenido",
  //   "La IA se encargará del resto",
  //   "Puedes añadir efectos y transiciones",
  //   "Perfecto para contenido de redes sociales",
  //   "Ahorra tiempo en la edición de videos",
  //   "Crea videos profesionales fácilmente",
  // ]

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        streamRef.current = stream

        // Check if audio tracks exist and are enabled
        const audioTracks = stream.getAudioTracks()
        setMicActive(audioTracks.length > 0 && audioTracks[0].enabled)

        setPermission(true)
      } catch (err) {
        console.error("Error accessing camera:", err)
        setPermission(false)
        setMicActive(false)
        toast({
          title: "Camera access denied",
          description: "Please allow camera access to record video",
          variant: "destructive",
        })
      }
    }

    setupCamera()

    return () => {
      // Clean up the stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Clear any running subtitles intervals
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current)
      }
    }
  }, [])

  // Handle subtitles changes from socket
  useEffect(() => {
    console.log("recording", recording, "subtitles", subtitles)
    if (subtitles) {
      setSubtitles(subtitles)
      // Add to subtitles history for SRT generation if not a partial update
      if (!subtitles.isPartial) {
        setSubtitleHistory(prev => [
          ...prev,
          {
            ...subtitles,
            timestamp: Date.now() - (recording ? 0 : 3000)
          }
        ])
      }
      console.log("subtitles", subtitles);
      subtitleIntervalRef.current = setInterval(() => {
        if (subtitles.timestamp && (Date.now() - subtitles.timestamp > 3000)) {
          setSubtitles(null)

          // Clear interval
          if (subtitleIntervalRef.current) {
            clearInterval(subtitleIntervalRef.current)
            subtitleIntervalRef.current = null
          }
        }
      }, 3000)
    }

    return () => {
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current)
      }
    }
  }, [subtitles])

  // Disable subtitles if not socket connected
  useEffect(() => {
    if (!socketConnected) {
      setSubtitlesEnabled(false)
    } else {
      setSubtitlesEnabled(true)
    }
  }, [socketConnected])

  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return

    chunksRef.current = []
    setSubtitleHistory([])
    const stream = videoRef.current.srcObject as MediaStream

    // Check microphone status before recording
    const audioTracks = stream.getAudioTracks()
    setMicActive(audioTracks.length > 0 && audioTracks[0].enabled)

    const mediaRecorder = new MediaRecorder(stream)

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/mp4" })
      setVideoBlob(blob)
      toast({
        title: "Recording complete",
        description: "Your video has been recorded successfully",
      })
    }

    mediaRecorder.start()
    mediaRecorderRef.current = mediaRecorder
    setRecording(true)
    toast({
      title: "Recording started",
      description: "Recording video from your camera",
    })
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const saveVideo = () => {
    if (!videoBlob) return

    const url = URL.createObjectURL(videoBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `recorded-video-${new Date().toISOString()}.mp4`
    a.click()

    toast({
      title: "Video saved",
      description: "Your recorded video has been saved to your device",
    })
  }

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
          ? subtitleHistory[index + 1].timestamp
          : item.timestamp + 3000;
      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(item.timestamp)} --> ${formatTime(
        endTime
      )}\n`;
      srtContent += `${item.originalText}\n\n`;
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

    toast({
      title: "Subtitles downloaded",
      description: "Your subtitles file has been downloaded",
    })
  }

  const discardVideo = () => {
    setVideoBlob(null)
    toast({
      title: "Video discarded",
      description: "Your recorded video has been discarded",
    })
  }

  const toggleSubtitles = () => {
    setSubtitlesEnabled((prev) => !prev)
    toast({
      title: subtitlesEnabled ? "Subtitles disabled" : "Subtitles enabled",
      description: subtitlesEnabled
        ? "Subtitles will not be shown or recorded"
        : "Subtitles will be shown during recording",
    })
  }

  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks()
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled
        setMicActive(audioTracks[0].enabled)
        toast({
          title: audioTracks[0].enabled ? "Microphone enabled" : "Microphone disabled",
          description: audioTracks[0].enabled ? "Audio will be recorded" : "Audio will not be recorded",
        })
      }
    }
  }

  const handleSubtitleLanguageChange = (value: string) => {
    setSubtitleLanguage(value as SubtitleLanguageOption)

    const messages = {
      original: "Showing original language subtitles",
      translated: "Showing translated subtitles",
      both: "Showing both original and translated subtitles",
    }

    toast({
      title: "Subtitle language updated",
      description: messages[value as SubtitleLanguageOption],
    })
  }

  // Function to render the appropriate subtitles based on the selected option
  const renderSubtitles = () => {
    if (!subtitlesEnabled || !subtitles) return null
    console.log("subtitles", subtitles)

    let subtitleContent = null

    switch (subtitleLanguage) {
      case "original":
        subtitleContent = (
          <p className="text-white text-center font-medium text-lg">
            {subtitles && subtitles.originalText}
          </p>
        )
        break
      case "translated":
        subtitleContent = (
          <p className="text-white text-center font-medium text-lg">
            {subtitles && subtitles.translatedText}
          </p>
        )
        break
      case "both":
        subtitleContent = (
          <>
            <p className="text-white text-center font-medium text-lg mb-1">
              {subtitles && subtitles.originalText}
            </p>
            {subtitles.originalText !== subtitles.translatedText && (
              <p className="text-blue-300 text-center font-medium text-lg">
                {subtitles && subtitles.translatedText}
              </p>
            )}
          </>
        )
        break
    }

    return (
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="bg-black/70 px-6 py-3 rounded-lg backdrop-blur-sm max-w-[80%]">
          {subtitleContent}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-6 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Back</span>
            </Link>
          </div>
          <div>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%205-TFlVNr1VXFToaXkY5Xb32pX7bJ0DYU.png"
              alt="CREVO"
              width={100}
              height={30}
              className="h-8 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl mx-auto">
          <div
            className="items-center justify-center py-4 text-center text-zinc-400 text-sm w-full"
          >
            {/* Socket connection status */}
            {socketConnected === false && (
              <div className="bg-red-900/80 p-4 rounded-lg mb-4 flex items-center justify-center space-x-2">
                <InfoIcon className="w-4 h-4 text-red-300" />
                <p className="text-red-400 text-sm">Please run the backend server to enable subtitle service and refresh the page.</p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            {/* Microphone Status Indicator */}
            <div className="flex items-center space-x-2">
              {micActive ? (
                <>
                  <Mic className="h-4 w-4 text-green-400" aria-hidden="true" />
                  <span className="text-sm text-zinc-300">Microphone active</span>
                </>
              ) : (
                <>
                  <MicOff className="h-4 w-4 text-red-400" aria-hidden="true" />
                  <span className="text-sm text-zinc-400">Microphone inactive</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-6">
              {/* Subtitle Language Selector */}
              {subtitlesEnabled && (
                <div className="flex items-center space-x-2">
                  <Select value={subtitleLanguage} onValueChange={handleSubtitleLanguageChange}>
                    <SelectTrigger className="w-[180px] h-8 bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Subtitle language" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="original">Original Language</SelectItem>
                      <SelectItem value="translated">Translated</SelectItem>
                      <SelectItem value="both">Both Languages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subtitle Toggle */}
              {socketConnected && (
                <div className="flex items-center space-x-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="subtitles-toggle" className="text-sm text-zinc-400 cursor-pointer">
                            Subtitles
                          </Label>
                          <CustomSwitch
                            id="subtitles-toggle"
                            checked={subtitlesEnabled}
                            onCheckedChange={toggleSubtitles}
                            aria-label={subtitlesEnabled ? "Disable subtitles" : "Enable subtitles"}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>{subtitlesEnabled ? "Turn off subtitles" : "Turn on subtitles"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {subtitlesEnabled ? (
                    <Subtitles className="h-4 w-4 text-white" aria-hidden="true" />
                  ) : (
                    <SubtitlesOff className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  )}
                </div>
              )}

              {/* Settings Button */}
              {socketConnected && (
                <Button
                  variant="ghost"
                  className="p-1 rounded-full"
                  onClick={() => setShowSettings(!showSettings)}>
                  <Settings className="h-4 w-4 text-zinc-400" />
                </Button>
              )}
            </div>
          </div>

          {/* Video Preview */}
          <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden mb-6 shadow-xl">
            {permission === false && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <div className="text-center p-6">
                  <Video className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-2">Camera access denied</p>
                  <p className="text-zinc-500 text-sm">Please allow camera access in your browser settings</p>
                </div>
              </div>
            )}

            {videoBlob ? (
              <video className="w-full h-full object-cover" src={URL.createObjectURL(videoBlob)} controls />
            ) : (
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            )}

            {/* Status Indicators */}
            <div className="absolute top-4 left-4 flex items-center space-x-4">
              {recording && (
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                  <span className="text-white text-sm">Recording</span>
                </div>
              )}

              {!micActive && recording && (
                <div className="flex items-center bg-black/50 px-2 py-1 rounded-md">
                  <MicOff className="w-3 h-3 text-red-400 mr-1" />
                  <span className="text-white text-xs">Muted</span>
                </div>
              )}
            </div>

            {/* Subtitles Overlay */}
            {renderSubtitles()}
          </div>

          {/* Subtitle Settings Panel */}
          {showSettings && (
            <SubtitleSettingsPanel
              subtitleSettings={subtitleSettings}
              setSubtitleSettings={setSubtitleSettings}
            />
          )}

          {/* Controls */}
          <div className="flex flex-col space-y-4">
            {videoBlob ? (
              <div className="flex space-x-4">
                <Button
                  className="flex-1 py-6 rounded-md bg-zinc-900 hover:bg-white text-white hover:text-zinc-900 font-medium shadow-lg transition-all duration-300 border border-zinc-700/50"
                  onClick={saveVideo}
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Video
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 py-6 rounded-md bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium transition-all duration-300 border border-zinc-700/50"
                  onClick={discardVideo}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Discard
                </Button>
              </div>
            ) : (
              <div className="flex gap-4">
                {!recording ? (
                  <>
                    <Button
                      className="flex-1 py-6 rounded-md bg-zinc-900 hover:bg-white text-white hover:text-zinc-900 font-medium shadow-lg transition-all duration-300 border border-zinc-700/50"
                      onClick={startRecording}
                      disabled={permission === false}
                    >
                      <Video className="w-5 h-5 mr-2" />
                      Start Recording
                    </Button>
                    <Button
                      onClick={toggleMicrophone}
                      variant="outline"
                      className={`px-4 py-6 rounded-md ${micActive
                        ? "bg-transparent border-green-700/50 text-green-400"
                        : "bg-transparent border-zinc-700/50 text-zinc-400"
                        } hover:bg-zinc-800 hover:text-white transition-all duration-300`}
                    >
                      {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full py-6 rounded-md bg-red-900/80 hover:bg-red-800 text-white font-medium shadow-lg transition-all duration-300 border border-red-700/50"
                    onClick={stopRecording}
                  >
                    <StopCircle className="w-5 h-5 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>
            )}

            {/* Download Subtitles button shown when video is recorded */}
            {videoBlob && subtitleHistory.length > 0 && (
              <Button
                variant="outline"
                className="w-full py-2 mt-2 rounded-md bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium transition-all duration-300 border border-zinc-700/50"
                onClick={downloadSubtitles}
              >
                <Subtitles className="w-4 h-4 mr-2" />
                Download Subtitles
              </Button>
            )}
          </div>

          {/* Language Selector */}
          {socketConnected && (
            <div className="mt-10">
              <LanguageSelector
                languages={languages}
                setLanguages={setLanguages}
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onSourceLanguageChange={handleSourceLanguageChange}
                onTargetLanguageChange={handleTargetLanguageChange}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
