"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export default function IPhoneMockup() {
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
      <div className="relative mx-auto border-[12px] border-zinc-800 rounded-[2rem] h-[500px] w-[250px] shadow-xl">
        <div className="absolute top-0 inset-x-0">
          <div className="h-[28px] w-[120px] mx-auto bg-zinc-800 rounded-b-[1rem]"></div>
        </div>

        <div className="h-[28px] w-[4px] absolute -right-[12px] top-[100px] bg-zinc-800 rounded-r-lg"></div>
        <div className="h-[28px] w-[4px] absolute -right-[12px] top-[150px] bg-zinc-800 rounded-r-lg"></div>
        <div className="h-[56px] w-[4px] absolute -left-[12px] top-[120px] bg-zinc-800 rounded-l-lg"></div>

        <div className="rounded-[1.7rem] overflow-hidden w-full h-full">
          {/* Full Screen GIF */}
          <div
            className="h-full w-full flex items-center justify-center overflow-hidden transition-all duration-100"
            style={generateBackgroundStyle()}
          >
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
                <div className="text-white/70 text-[10px]">4:32 PM</div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full border border-white/70"></div>
                  <div className="w-3 h-3 rounded-full border border-white/70"></div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                <div className="h-1 w-16 bg-white/30 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reflection */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-[200px] h-[30px] bg-white/5 rounded-full blur-md"></div>
    </motion.div>
  )
}

