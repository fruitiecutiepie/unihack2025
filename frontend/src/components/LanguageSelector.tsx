"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Check, Download, Loader2, Globe, Info, Languages, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/useToast"
import { Button } from "@/components/ui/button"

export type LanguageCode = "EN" | "ES" | "FR" | "CN" | "RU" | "DE" | "JA" | "KO"
type LanguageStatus = "loaded" | "downloading" | "not-loaded"

export type Language = {
  code: LanguageCode
  name: string
  status: LanguageStatus
}

interface LanguageSelectorProps {
  languages: Language[],
  setLanguages: React.Dispatch<React.SetStateAction<Language[]>>,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  onSourceLanguageChange: (langCode: LanguageCode) => void;
  onTargetLanguageChange: (langCode: LanguageCode) => void;
}

export default function LanguageSelector({
  languages,
  setLanguages,
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
}: LanguageSelectorProps) {
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

  const handleDownload = (e: React.MouseEvent, langCode: LanguageCode, isSourceLang: boolean) => {
    e.preventDefault()
    e.stopPropagation()

    const lang = languages.find((l) => l.code === langCode)
    if (!lang || lang.status !== "not-loaded") return

    // Mark language as downloading
    setLanguages((prev) => prev.map(l => l.code === langCode ? { ...l, status: "downloading" } : l))

    toast({
      title: `Downloading ${lang.name}`,
      description: "Language model download started",
    })

    // Emit language change event (will trigger actual download on backend)
    isSourceLang
      ? onSourceLanguageChange(langCode)
      : onTargetLanguageChange(langCode)

    // Note: Backend should notify when download is complete
    // For now, we'll simulate it with a timeout
    setTimeout(() => {
      setLanguages((prev) => prev.map(l => l.code === langCode ? { ...l, status: "loaded" } : l))

      toast({
        title: `${lang.name} downloaded`,
        description: "Language model is now available",
      })
    }, 3000)
  }

  return (
    <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
      <div className="flex items-center gap-2 mb-6">
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
              <p>Select languages for speech recognition and translation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Speech Recognition Language */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label htmlFor="language-select" className="block text-sm font-medium text-zinc-300">
              Speech Recognition
            </label>
          </div>
          <Select
            value={sourceLanguage}
            onValueChange={(value) => onSourceLanguageChange(value as LanguageCode)}
            aria-labelledby="speech-language-label"
          >
            <SelectTrigger
              id="language-select"
              className="w-full bg-zinc-800 border-zinc-700 text-white h-12 text-base"
            >
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-zinc-800 border-zinc-700">
              <SelectGroup>
                <SelectLabel className="text-xs text-zinc-500">Available Languages</SelectLabel>
                {languages.map((lang) => (
                  <SelectItem key={`speech-${lang.code}`} value={lang.code} className="py-3 pr-2"
                    disabled={targetLanguage !== "EN" && lang.code !== "EN"} // TODO: Make text more dark
                  >
                    <div className="relative flex items-center w-full pr-8">
                      <div className="flex-grow text-white">
                        <span>{lang.name}</span>
                        <span className="ml-2 text-zinc-500">({lang.code})</span>
                      </div>
                      <div className="absolute right-0">
                        {lang.status === "not-loaded" ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-blue-500/20 hover:text-blue-400 text-white"
                            onClick={(e) => handleDownload(e, lang.code as LanguageCode, true)}
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
          <p className="text-xs text-zinc-400">This language will be used for speech recognition</p>
        </div>

        {/* Translation Language */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label htmlFor="translate-select" className="block text-sm font-medium text-zinc-300">
              Translate To
            </label>
            <Languages className="h-4 w-4 text-blue-400" aria-hidden="true" />
          </div>

          <Select
            value={targetLanguage}
            onValueChange={(value) => onTargetLanguageChange(value as LanguageCode)}
            aria-labelledby="translate-language-label"
          >
            <SelectTrigger
              id="translate-select"
              className="w-full bg-zinc-800 border-zinc-700 text-white h-12 text-base"
            >
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-zinc-800 border-zinc-700">
              <SelectGroup>
                <SelectLabel className="text-xs text-zinc-500">Translation Options</SelectLabel>
                <SelectItem value="NONE" className="py-3 pr-2">
                  <div className="flex items-center text-white">
                    <span>None</span>
                    <span className="ml-2 text-zinc-500">(No translation)</span>
                    <X className="ml-auto h-4 w-4 text-zinc-500" aria-hidden="true" />
                  </div>
                </SelectItem>

                <SelectLabel className="text-xs text-zinc-500 mt-2">Available Languages</SelectLabel>
                {languages.map((lang) => (
                  <SelectItem key={`translate-${lang.code}`} value={lang.code} className="py-3 pr-2"
                    disabled={sourceLanguage !== "EN" && lang.code !== "EN"}
                  >
                    <div className="relative flex items-center w-full pr-8 text-white">
                      <div className="flex-grow">
                        <span>{lang.name}</span>
                        <span className="ml-2 text-zinc-500">({lang.code})</span>
                      </div>
                      <div className="absolute right-0">
                        {lang.status === "not-loaded" ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-blue-500/20 hover:text-blue-400 text-white"
                            onClick={(e) => handleDownload(e, lang.code as LanguageCode, false)}
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
          <p className="text-xs text-zinc-400">
            {sourceLanguage === targetLanguage
              ? "No translation will be applied to captions"
              : "Captions will be translated to this language"}
          </p>
        </div>
      </div>
    </div>
  )
}