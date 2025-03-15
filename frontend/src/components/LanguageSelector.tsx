import { Language, LanguageState } from '@/utils/api';
import React from 'react';

interface LanguageSelectorProps {
  languages: LanguageState;
  onLanguageChange: (lang: Language) => void;
}

export function getLanguageName(lang: Language): string {
  switch (lang) {
    case Language.English:
      return 'English';
    case Language.Spanish:
      return 'Español (Spanish)';
    case Language.French:
      return 'Français (French)';
    case Language.Chinese:
      return '中文 (Chinese)';
    case Language.Russian:
      return 'Русский (Russian)';
    case Language.German:
      return 'Deutsch (German)';
    case Language.Japanese:
      return '日本語 (Japanese)';
    case Language.Korean:
      return '한국어 (Korean)';
    default:
      return 'Unknown';
  }
}

export default function LanguageSelector({
  languages,
  onLanguageChange
}: LanguageSelectorProps) {
  // Track languages that are currently being downloaded
  const [downloading, setDownloading] = React.useState<Language[]>([]);

  // Function to handle language change and track downloading state
  const handleLanguageChange = (lang: Language) => {
    if (!languages.loaded.includes(lang)) {
      setDownloading(prev => [...prev, lang]);

      // Simulate download completion after a delay (remove this in real implementation)
      setTimeout(() => {
        setDownloading(prev => prev.filter(l => l !== lang));
      }, 2500);
    }
    onLanguageChange(lang);
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg w-[640px] mb-4">
      <h2 className="text-lg font-semibold mb-2">Language Selection</h2>

      <div className="flex items-center gap-3 mb-3">
        <label htmlFor="langSelect" className="font-medium">Current Language: </label>
        <select
          id="langSelect"
          value={languages.current}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          className="px-3 py-2 border rounded-md bg-white"
        >
          {languages.available.length === 0 ? (
            <option value="">Loading languages...</option>
          ) : (
            languages.available.map(lang => (
              <option key={lang} value={lang}>
                {getLanguageName(lang)}
              </option>
            ))
          )}
        </select>

        <div className="ml-auto text-sm">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {languages.current ? languages.current.toUpperCase() : 'No language selected'}
          </span>
        </div>
      </div>

      {/* Model Status Section */}
      <div className="mt-2 border-t pt-2">
        <h3 className="text-sm text-gray-600 mb-2">Language Model Status:</h3>
        <div className="flex flex-wrap gap-2">
          {languages.available.map(lang => (
            <div
              key={lang}
              className={`text-xs px-2 py-1 rounded-full flex items-center gap-1
                ${languages.current === lang ? 'bg-blue-500 text-white' : 'bg-gray-200'}
                ${languages.loaded.includes(lang) ? 'border-green-500 border' : ''}
              `}
            >
              <span>{lang.toUpperCase()}</span>

              {/* Status Indicator */}
              {languages.loaded.includes(lang) ? (
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : downloading.includes(lang) ? (
                <svg className="w-3 h-3 text-yellow-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              ) : (
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center text-xs text-gray-500">
        <div className="flex items-center mr-4">
          <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Loaded</span>
        </div>
        <div className="flex items-center mr-4">
          <svg className="w-3 h-3 text-yellow-500 animate-spin mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Downloading</span>
        </div>
        <div className="flex items-center">
          <svg className="w-3 h-3 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
          </svg>
          <span>Not Loaded</span>
        </div>
      </div>
    </div>
  );
}