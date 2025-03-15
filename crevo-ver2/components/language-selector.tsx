"use client"

import type React from "react"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Check, Download, Loader2, Globe, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

type LanguageStatus = "loaded" | "downloading" | "not-loaded"

interface Language {
  code: string
  name: string
  status: LanguageStatus
}

const languages: Language[] = [
  { code: "EN", name: "English", status: "loaded" },
  { code: "ES", name: "Spanish", status: "not-loaded" },
  { code: "FR", name: "French", status: "downloading" },
  { code: "CN", name: "Chinese", status: "not-loaded" },
  { code: "RU", name: "Russian", status: "not-loaded" },
  { code: "DE", name: "German", status: "not-loaded" },
  { code: "JA", name: "Japanese", status: "not-loaded" },
  { code: "KO", name: "Korean", status: "not-loaded" },
]

export default function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState("EN")
  const [languagesState, setLanguagesState] = useState<Language[]>(languages)

  const getStatusIcon = (status: LanguageStatus) => {
    switch (status) {
      case "loaded":
        return <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
      case "downloading":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" aria-hidden="true" />
      case "not-loaded":
        return <Download className="h-4 w-4 text-zinc-400" aria-hidden="true" />
    }
  }

  const handleDownload = (e: React.MouseEvent, langCode: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Find the language
    const lang = languagesState.find((l) => l.code === langCode)
    if (!lang || lang.status !== "not-loaded") return

    // Update language status to downloading
    setLanguagesState((prev) =>
      prev.map((l) => (l.code === langCode ? { ...l, status: "downloading" as LanguageStatus } : l)),
    )

    toast({
      title: `Downloading ${lang.name}`,
      description: "Language model download started",
    })

    // Simulate download completion after 3 seconds
    setTimeout(() => {
      setLanguagesState((prev) =>
        prev.map((l) => (l.code === langCode ? { ...l, status: "loaded" as LanguageStatus } : l)),
      )

      toast({
        title: `${lang.name} downloaded`,
        description: "Language model is now available",
      })
    }, 3000)
  }

  return (
    <div className="space-y-5 bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-blue-500" aria-hidden="true" />
        <h2 className="text-lg text-white font-medium" id="language-section-title">
          Language Selection
        </h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="inline-flex items-center justify-center rounded-full w-5 h-5 text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                aria-label="Language selection information"
              >
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select a language for speech recognition and captions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        <label htmlFor="language-select" className="block text-sm font-medium text-zinc-300">
          Current Language
        </label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage} aria-labelledby="current-language-label">
          <SelectTrigger id="language-select" className="w-full bg-zinc-800 border-zinc-700 text-white h-12 text-base">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectGroup>
              <SelectLabel className="text-xs text-zinc-500">Available Languages</SelectLabel>
              {languagesState.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="py-3 pr-2">
                  <div className="relative flex items-center w-full pr-8">
                    <div className="flex-grow">
                      <span>{lang.name}</span>
                      <span className="ml-2 text-zinc-500">({lang.code})</span>
                    </div>
                    <div className="absolute right-0">
                      {lang.status === "not-loaded" ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-blue-500/20 hover:text-blue-400"
                          onClick={(e) => handleDownload(e, lang.code)}
                          aria-label={`Download ${lang.name} language model`}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <div className="h-6 w-6 flex items-center justify-center">{getStatusIcon(lang.status)}</div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-zinc-400">This language will be used for speech recognition and captions</p>
      </div>
    </div>
  )
}

