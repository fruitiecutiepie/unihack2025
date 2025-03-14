import VideoImporter from "@/components/video-importer"
import IPhoneMockup from "@/components/iphone-mockup"
import Image from "next/image"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 flex items-center justify-center p-4">
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
            <IPhoneMockup />
          </div>
        </div>
      </div>
    </div>
  )
}

