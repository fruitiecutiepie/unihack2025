"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Video, StopCircle, Save, Trash2 } from "lucide-react"
//import { useToast } from "@/hooks/use-toast"

export default function RecordVideo() {
  //const { toast } = useToast()
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [permission, setPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setPermission(true)
      } catch (err) {
        console.error("Error accessing camera:", err)
        setPermission(false)
        /*
        toast({
          title: "Camera access denied",
          description: "Please allow camera access to record video",
          variant: "destructive",
        })
        */
      }
    }

    setupCamera()

    return () => {
      // Clean up the stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return

    chunksRef.current = []
    const stream = videoRef.current.srcObject as MediaStream
    const mediaRecorder = new MediaRecorder(stream)

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/mp4" })
      setVideoBlob(blob)
      /*
      toast({
        title: "Recording complete",
        description: "Your video has been recorded successfully",
      })
      */
    }

    mediaRecorder.start()
    mediaRecorderRef.current = mediaRecorder
    setRecording(true)
    /*
    toast({
      title: "Recording started",
      description: "Recording video from your camera",
    })
    */
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

    /*
    toast({
      title: "Video saved",
      description: "Your recorded video has been saved to your device",
    })
    */
  }

  const discardVideo = () => {
    setVideoBlob(null)
    /*
    toast({
      title: "Video discarded",
      description: "Your recorded video has been discarded",
    })
    */
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
          <h1 className="text-2xl font-light text-white mb-8 text-center">Record Video</h1>

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

            {recording && (
              <div className="absolute top-4 left-4 flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                <span className="text-white text-sm">Recording</span>
              </div>
            )}
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
                className={`w-full py-6 rounded-md font-medium shadow-lg transition-all duration-300 border ${
                  recording
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
        </div>
      </main>
    </div>
  )
}

