"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export default function LaptopMockup() {
  // Animation frames for a simple loading animation
  const [frame, setFrame] = useState(0)
  const totalFrames = 30

  // Simulate GIF animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % totalFrames)
    }, 50)

    return () => clearInterval(interval)
  }, [])

  // Generate a simple animation for the GIF
  const generateAnimationStyle = () => {
    // Create a pulsing circle animation
    const scale = 0.8 + 0.2 * Math.sin((frame / totalFrames) * Math.PI * 2)
    const hue = ((frame / totalFrames) * 360) % 360

    return {
      transform: `scale(${scale})`,
      backgroundColor: `hsl(${hue}, 70%, 60%)`,
    }
  }

  // Generate background gradient that changes with the animation
  const generateBackgroundStyle = () => {
    const hue = ((frame / totalFrames) * 360 + 180) % 360 // Complementary color

    return {
      background: `radial-gradient(circle, hsl(${hue}, 50%, 15%) 0%, hsl(${hue}, 70%, 5%) 100%)`,
    }
  }

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Laptop Body */}
      <div className="relative mx-auto">
        {/* Screen */}
        <div className="relative w-[400px] h-[250px] bg-zinc-800 rounded-t-lg border-8 border-zinc-800 shadow-xl">
          {/* Screen Content */}
          <div className="h-full w-full rounded-sm overflow-hidden" style={generateBackgroundStyle()}>
            {/* Animated GIF simulation */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Animated element */}
              <div
                className="w-40 h-40 rounded-full transition-all duration-100 ease-in-out shadow-lg shadow-black/30"
                style={generateAnimationStyle()}
              ></div>

              {/* Minimal overlay */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <div className="text-white text-xs font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                  AI Generated
                </div>
              </div>

              {/* Status bar */}
              <div className="absolute top-2 left-3 right-3 flex justify-between items-center">
                <div className="text-white/70 text-[10px]">CREVO</div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-white/70"></div>
                  <div className="w-2 h-2 rounded-full bg-white/70"></div>
                  <div className="w-2 h-2 rounded-full bg-white/70"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Webcam */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-700"></div>
        </div>

        {/* Laptop Base */}
        <div className="relative w-[400px] h-[20px] bg-zinc-800 rounded-b-sm">
          {/* Laptop Hinge */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 w-[80px] h-[4px] bg-zinc-700 rounded-b-sm"></div>
        </div>

        {/* Laptop Bottom */}
        <div className="relative w-[400px] h-[15px] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-b-lg transform perspective-[800px] rotateX(5deg) scale-y-[0.8] origin-top">
          {/* Touchpad */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-[5px] w-[100px] h-[5px] bg-zinc-700 rounded-sm"></div>
        </div>

        {/* Reflection/Shadow */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-[350px] h-[10px] bg-black/20 rounded-full blur-md"></div>
      </div>
    </motion.div>
  )
}

