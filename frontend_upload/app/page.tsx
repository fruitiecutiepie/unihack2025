import VideoImporter from "@/components/video-importer"
import LaptopMockup from "@/components/iphone-mockup"
import Image from "next/image"

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-zinc-950 to-zinc-900">
      {/* Animated Background - Top Left Area Only */}
      <div className="absolute top-0 left-0 w-[50%] h-[50%] max-w-[600px] max-h-[600px] -z-10">
        <div className="absolute inset-0 animate-gradient-slow bg-gradient-radial from-purple-900/10 via-blue-900/5 to-transparent"></div>
        <div className="absolute inset-0 animate-pulse-slow bg-gradient-radial from-zinc-800/10 via-zinc-800/5 to-transparent"></div>
        <div className="absolute inset-0 animate-pulse-slow-reverse bg-gradient-radial from-indigo-900/10 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-3/5 lg:pr-8">
              {/* Logo directly above text */}
              <div className="mb-8 text-center lg:text-left">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%205-TFlVNr1VXFToaXkY5Xb32pX7bJ0DYU.png"
                  alt="CREVO"
                  width={150}
                  height={50}
                  className="h-12 w-auto inline-block lg:inline"
                />
              </div>

              <div className="mb-12 max-w-2xl lg:mx-0 mx-auto">
                <p className="text-[1.8rem] leading-tight tracking-wide text-center lg:text-left">
                  <span className="text-zinc-500 font-light block mb-1">Import your videos and</span>
                  <span className="text-white font-normal block">let AI do the rest</span>
                </p>
              </div>
              <VideoImporter />
            </div>

            <div className="hidden lg:block lg:w-2/5 mt-10 lg:mt-0">
              <LaptopMockup />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

