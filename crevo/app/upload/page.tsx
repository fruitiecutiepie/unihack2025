"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Film, Trash2, Download, ArrowLeftIcon } from "lucide-react"
//import { toast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

type PageState = "upload" | "loading" | "preview"

export default function UploadFiles() {
  const [files, setFiles] = useState<File[]>([])
  const [pageState, setPageState] = useState<PageState>("upload")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Simulate loading progress
  useEffect(() => {
    if (pageState === "loading") {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setPageState("preview")
            return 100
          }
          return prev + 1
        })
      }, 50)

      return () => clearInterval(interval)
    }
  }, [pageState])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files

    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles).filter((file) => file.type.startsWith("video/"))

      if (newFiles.length === 0) {
        /*
        toast({
          title: "Invalid files",
          description: "Please select video files only",
          variant: "destructive",
        })
        */
        return
      }

      setFiles((prev) => [...prev, ...newFiles])
      /*
      toast({
        title: "Files added",
        description: `Added ${newFiles.length} video file(s)`,
      })
      */
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    /*
    toast({
      title: "File removed",
      description: "The file has been removed",
    })
    */
  }

  const handleGenerate = () => {
    setPageState("loading")
    setLoadingProgress(0)
  }

  const handleBackToUpload = () => {
    setPageState("upload")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Mock durations for demo purposes
  const getDuration = (index: number) => {
    const durations = [65, 127, 43, 92, 180]
    return durations[index % durations.length]
  }

  // Render different content based on page state
  const renderContent = () => {
    switch (pageState) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-full max-w-md">
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )

      case "preview":
        return (
          <div className="flex flex-col">
            <div className="flex items-center mb-6">
              <button
                onClick={handleBackToUpload}
                className="flex items-center text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                <span>Back to Upload</span>
              </button>
            </div>

            <h2 className="text-2xl font-light text-white mb-6">Your Generated Video</h2>

            {/* Video Preview */}
            <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden mb-6 shadow-xl">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                poster="/placeholder.svg?height=720&width=1280"
                src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Button className="flex-1 py-6 rounded-md bg-zinc-900 hover:bg-zinc-800/50 text-white font-medium shadow-lg transition-all duration-300 border border-zinc-700/50 hover:border-zinc-500">
                <Download className="w-5 h-5 mr-2" />
                Download Video
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-6 rounded-md bg-transparent hover:bg-red-900/70 text-white hover:text-white font-medium transition-all duration-300 border border-zinc-700/70 hover:border-red-700/50"
                onClick={handleBackToUpload}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Discard
              </Button>
            </div>

            {/* Video Details */}
            <div className="mt-8 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
              <h3 className="text-white font-medium mb-2">Video Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-400">
                    Duration: <span className="text-white">00:60</span>
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">
                    Resolution: <span className="text-white">1920 × 1080</span>
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">
                    Size: <span className="text-white">24.5 MB</span>
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">
                    Format: <span className="text-white">MP4</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default: // "upload"
        return (
          <>
            <h1 className="text-2xl font-light text-white mb-8 text-center md:text-left">Upload Files</h1>

            {/* File List */}
            <div className="space-y-6">
              <AnimatePresence>
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 overflow-hidden"
                  >
                    <div className="flex items-center p-4">
                      <div className="bg-zinc-700/30 rounded-md p-3 mr-4">
                        <Film className="h-6 w-6 text-zinc-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{file.name}</p>
                        <div className="flex items-center text-zinc-400 text-sm mt-1">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDuration(getDuration(index))}</span>
                        </div>
                      </div>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-red-600 hover:text-white transition-all duration-200"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add File Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={`${files.length > 0 ? "mt-6" : "mt-0"}`}
              >
                <Button
                  variant="outline"
                  className="w-full py-8 rounded-lg border-dashed border-2 border-zinc-700/70 hover:border-zinc-500 bg-transparent hover:bg-zinc-800/30 text-zinc-400 hover:text-white font-medium transition-all duration-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add File
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="video/*"
                  multiple
                />
              </motion.div>
            </div>

            {/* Generate Button - Only show if files are added */}
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-8"
              >
                <Button
                  className="w-full py-6 rounded-md bg-zinc-900 hover:bg-zinc-800/50 text-white font-medium text-lg shadow-lg shadow-black/20 transition-all duration-300 border border-zinc-700/50 hover:border-zinc-500"
                  onClick={handleGenerate}
                >
                  Generate Video
                </Button>
              </motion.div>
            )}
          </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 flex flex-col">
      {/* Header - Only show in upload state */}
      {pageState === "upload" && (
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
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6">
        <div className="w-full max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pageState}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

