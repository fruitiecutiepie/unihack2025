"use client"

import type React from "react"
import Link from "next/link"
import { useState, useRef } from "react"
//import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, Film, Video } from "lucide-react"
import { motion } from "framer-motion"

interface VideoFile {
  id: number
  file: File | undefined | null
}

export default function VideoImporter() {
  //const notification = useNotification()

  const [videos, setVideos] = useState<VideoFile[]>([
    { id: 1, file: null },
    { id: 2, file: null },
    { id: 3, file: null },
  ])
  const [generating, setGenerating] = useState(false)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, id: number) => {
    const file = event.target.files?.[0]

    if (file && !file.type.startsWith("video/mp4")) {
      /*
      notification.show({
        title: "Invalid file type",
        description: "Please select an MP4 video file",
        variant: "destructive",
      })
      */
      
      return
    }

    setVideos((prev) => prev.map((video) => (video.id === id ? { ...video, file } : video)))
  }

  const handleGenerate = () => {
    const hasVideos = videos.some((video) => video.file !== null)

    if (!hasVideos) {
      /*
      notification.show({
        title: "No videos selected",
        description: "Please import at least one video",
        variant: "destructive",
      })
      */
      return
    }

    setGenerating(true)
    // Simulate video generation
    setTimeout(() => {
      setGenerating(false)
      /*
      notification.show({
        title: "Video generated",
        description: "Your video has been generated successfully",
      })
      */
    }, 2000)
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto lg:mx-0">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => fileInputRefs.current[index]?.click()}
            className={`
        aspect-square max-w-[180px] w-full mx-auto lg:mx-0
        rounded-xl overflow-hidden
        flex flex-col items-center justify-center cursor-pointer
        transition-all duration-300 group
        ${video.file ? "bg-zinc-800/80" : "bg-zinc-800/30 backdrop-blur-sm"}
        hover:bg-zinc-800/60 hover:scale-[1.02]
        border border-zinc-700/50 hover:border-zinc-500/50
        shadow-lg shadow-black/20
      `}
          >
            <input
              type="file"
              accept="video/mp4"
              className="hidden"
              onChange={(e) => handleFileChange(e, video.id)}
              ref={(el) => (fileInputRefs.current[index] = el)}
            />

            {video.file ? (
              <div className="flex flex-col items-center justify-center p-3 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center mb-2">
                  <Film className="w-5 h-5 text-zinc-300" />
                </div>
                <p className="text-zinc-300 font-medium text-xs mb-1 truncate max-w-[90%]">{video.file.name}</p>
                <p className="text-zinc-500 text-[10px]">{(video.file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700/30 flex items-center justify-center mb-2 group-hover:bg-zinc-700/50 transition-colors">
                  <Upload className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                </div>
                <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors text-xs">Import mp4</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="space-y-4 max-w-2xl mx-auto lg:mx-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Button
            className="w-full py-6 rounded-md bg-zinc-900 hover:bg-white text-white hover:text-zinc-900 font-medium text-lg shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 border border-zinc-700/50 hover:border-white/10"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <span className="flex items-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate video"
            )}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Link href="/record" className="block w-full">
            <Button
              variant="outline"
              className="w-full py-6 rounded-md bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-lg shadow-lg shadow-black/10 transition-all duration-300 border border-zinc-700/50"
            >
              <Video className="w-5 h-5 mr-2" />
              Record video
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

