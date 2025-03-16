"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, FileVideo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/useToast"

export default function VideoUploader() {
  const [videos, setVideos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type.startsWith("video/"))

      if (newFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Please select video files only.",
          variant: "destructive",
        })
        return
      }

      setVideos((prev) => [...prev, ...newFiles])
    }
  }

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index))
  }

  const simulateUpload = () => {
    setUploading(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          toast({
            title: "Upload complete",
            description: `${videos.length} videos uploaded successfully.`,
          })
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  return (
    <div className="border rounded-lg p-6">
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Upload Videos</h3>
        <p className="text-sm text-muted-foreground mb-4">Drag and drop video files here or click to browse</p>
        <Button variant="outline" size="sm">
          Select Files
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="video/*"
          multiple
        />
      </div>

      {videos.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Selected Videos ({videos.length})</h3>
            <Button variant="default" size="sm" onClick={simulateUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Videos"}
            </Button>
          </div>

          {uploading && <Progress value={progress} className="h-2 mb-4" />}

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {videos.map((video, index) => (
              <div key={index} className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
                <div className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-md mr-3">
                    <FileVideo className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{video.name}</p>
                    <p className="text-xs text-muted-foreground">{(video.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeVideo(index)} disabled={uploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

