"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Paperclip, Video } from "lucide-react"
import { motion } from "framer-motion"

export default function VideoImporter() {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start md:justify-start justify-center gap-6 w-full max-w-2xl mx-auto lg:mx-0">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full md:w-auto"
      >
        <Link href="/record" className="block w-full">
          <Button className="w-full md:w-[220px] h-[60px] rounded-full bg-white hover:bg-zinc-900 text-zinc-900 hover:text-white text-base font-medium transition-all duration-300 group">
            <Video className="w-4 h-4 mr-3 text-zinc-700 group-hover:text-white transition-colors" />
            Record video
          </Button>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-zinc-500 font-medium md:self-center md:py-0 py-2"
      >
        Or
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="w-full md:w-auto"
      >
        <Link href="/upload" className="block w-full">
          <Button className="w-full md:w-[220px] h-[60px] rounded-full bg-transparent hover:bg-zinc-800/50 text-white text-base font-medium transition-all duration-300 group border border-zinc-700/70 hover:border-zinc-500">
            <Paperclip className="w-4 h-4 mr-3 text-zinc-400 group-hover:text-white transition-colors" />
            Upload files
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}

