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
  CaptionsIcon as SubtitlesOff,
  Mic,
  MicOff,
} from "lucide-react"
import { toast } from "@/hooks/useToast"
import LanguageSelector from "@/components/language-selector"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CustomSwitch } from "@/components/ui/custom-switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import "../app/globals.css";

type CaptionLanguageOption = "original" | "translated" | "both"

export default function RecordVideo() {
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [permission, setPermission] = useState<boolean | null>(null)
  const [captions, setCaptions] = useState<string>("")
  const [translatedCaptions, setTranslatedCaptions] = useState<string>("")
  const [captionIndex, setCaptionIndex] = useState(0)
  const [captionsEnabled, setCaptionsEnabled] = useState(true)
  const [captionLanguage, setCaptionLanguage] = useState<CaptionLanguageOption>("original")
  const [micActive, setMicActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const captionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Sample captions that will rotate during recording
  const sampleCaptions = [
    "This is an AI-powered video editor",
    "It can automatically edit your videos",
    "Just record or upload your content",
    "The AI will handle the rest",
    "You can add effects and transitions",
    "Perfect for social media content",
    "Save time on video editing",
    "Create professional videos easily",
  ]

  // Sample translated captions
  const sampleTranslatedCaptions = [
    "Este es un editor de video con IA",
    "Puede editar automáticamente tus videos",
    "Solo graba o sube tu contenido",
    "La IA se encargará del resto",
    "Puedes añadir efectos y transiciones",
    "Perfecto para contenido de redes sociales",
    "Ahorra tiempo en la edición de videos",
    "Crea videos profesionales fácilmente",
  ]

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

      // Clear any running caption intervals
      if (captionIntervalRef.current) {
        clearInterval(captionIntervalRef.current)
      }
    }
  }, [])

  // Simulate captions during recording
  useEffect(() => {
    if (recording) {
      // Set initial caption
      setCaptions(sampleCaptions[0])
      setTranslatedCaptions(sampleTranslatedCaptions[0])

      // Rotate through captions every few seconds
      captionIntervalRef.current = setInterval(() => {
        setCaptionIndex((prev) => {
          const newIndex = (prev + 1) % sampleCaptions.length
          setCaptions(sampleCaptions[newIndex])
          setTranslatedCaptions(sampleTranslatedCaptions[newIndex])
          return newIndex
        })
      }, 3000)
    } else {
      // Clear captions when not recording
      setCaptions("")
      setTranslatedCaptions("")

      // Clear interval
      if (captionIntervalRef.current) {
        clearInterval(captionIntervalRef.current)
        captionIntervalRef.current = null
      }
    }

    return () => {
      if (captionIntervalRef.current) {
        clearInterval(captionIntervalRef.current)
      }
    }
  }, [recording])

  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return

    chunksRef.current = []
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

  const discardVideo = () => {
    setVideoBlob(null)
    toast({
      title: "Video discarded",
      description: "Your recorded video has been discarded",
    })
  }

  const toggleCaptions = () => {
    setCaptionsEnabled((prev) => !prev)
    toast({
      title: captionsEnabled ? "Captions disabled" : "Captions enabled",
      description: captionsEnabled
        ? "Captions will not be shown or recorded"
        : "Captions will be shown during recording",
    })
  }

  const handleCaptionLanguageChange = (value: string) => {
    setCaptionLanguage(value as CaptionLanguageOption)

    const messages = {
      original: "Showing original language captions",
      translated: "Showing translated captions",
      both: "Showing both original and translated captions",
    }

    toast({
      title: "Caption language updated",
      description: messages[value as CaptionLanguageOption],
    })
  }

  // Function to render the appropriate captions based on the selected option
  const renderCaptions = () => {
    if (!captionsEnabled) return null

    let captionContent

    switch (captionLanguage) {
      case "original":
        captionContent = (
          <p className="text-white text-center font-medium text-lg">
            {recording ? captions : "This is how captions will appear during recording"}
          </p>
        )
        break
      case "translated":
        captionContent = (
          <p className="text-white text-center font-medium text-lg">
            {recording ? translatedCaptions : "Captions will be translated to your selected language"}
          </p>
        )
        break
      case "both":
        captionContent = (
          <>
            <p className="text-white text-center font-medium text-lg mb-1">
              {recording ? captions : "This is how captions will appear during recording"}
            </p>
            <p className="text-blue-300 text-center font-medium text-lg">
              {recording ? translatedCaptions : "With translation below in your selected language"}
            </p>
          </>
        )
        break
    }

    return (
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="bg-black/70 px-6 py-3 rounded-lg backdrop-blur-sm max-w-[80%]">{captionContent}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-zinc-800">
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
              {/* Caption Language Selector */}
              {captionsEnabled && (
                <div className="flex items-center space-x-2">
                  <Select value={captionLanguage} onValueChange={handleCaptionLanguageChange}>
                    <SelectTrigger className="w-[180px] h-8 bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Caption language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original Language</SelectItem>
                      <SelectItem value="translated">Translated</SelectItem>
                      <SelectItem value="both">Both Languages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Caption Toggle */}
              <div className="flex items-center space-x-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="captions-toggle" className="text-sm text-zinc-400 cursor-pointer">
                          Captions
                        </Label>
                        <CustomSwitch
                          id="captions-toggle"
                          checked={captionsEnabled}
                          onCheckedChange={toggleCaptions}
                          aria-label={captionsEnabled ? "Disable captions" : "Enable captions"}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{captionsEnabled ? "Turn off captions" : "Turn on captions"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {captionsEnabled ? (
                  <Subtitles className="h-4 w-4 text-white" aria-hidden="true" />
                ) : (
                  <SubtitlesOff className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                )}
              </div>
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

            {/* Captions */}
            {renderCaptions()}
          </div>

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
              <Button
                className={`w-full py-6 rounded-md font-medium shadow-lg transition-all duration-300 border ${recording
                  ? "bg-red-900/80 hover:bg-red-800 text-white border-red-700/50"
                  : "bg-zinc-900 hover:bg-white text-white hover:text-zinc-900 border-zinc-700/50"
                  }`}
                onClick={recording ? stopRecording : startRecording}
                disabled={permission === false}
              >
                {recording ? (
                  <>
                    <StopCircle className="w-5 h-5 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Language Selector */}
          <div className="mt-10">
            <LanguageSelector />
          </div>
        </div>
      </main>
    </div>
  )
}
