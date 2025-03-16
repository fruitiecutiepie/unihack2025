import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL, Subtitle } from "@/app/page";
import { Language, LanguageCode } from "@/components/LanguageSelector";
import { fetchLanguages } from "@/utils/api";

export default function useSocket(
  setSubtitles: Dispatch<SetStateAction<Subtitle | null>>
) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("EN")
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("EN")
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"], // Try both transport methods
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    socketRef.current = socket;

    socket.on("connect", async () => {
      setSocketConnected(true);
      const languages = await fetchLanguages();
      if (languages) {
        setLanguages(languages);
      }
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("error", () => {
      setSocketConnected(false);
    });

    socket.on("set_language_source", (data: {
      lang: Language;
    }) => {
      setLanguages((prev) => [...prev, data.lang]);
    });

    socket.on("set_language_target", (data: {
      lang: Language;
    }) => {
      setLanguages((prev) => [...prev, data.lang]);
    });

    socket.on("subtitle", (data) => {
      console.log('Received subtitle:', data);

      // Extract data
      const originalText = data.original;
      const translatedText = data.translated; // May be undefined if no translation
      const sourceLang = data.source_lang;
      const targetLang = data.target_lang;
      const isPartial = data.is_partial;

      // Update subtitle state
      setSubtitles({
        originalText: originalText,
        translatedText: translatedText,
        isPartial: isPartial,
        timestamp: Date.now()
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleSourceLanguageChange = (langCode: LanguageCode) => {
    if (socketRef.current) {
      socketRef.current.emit("set_language_source", { langCode });
      setSourceLanguage(langCode);
    }
  };

  const handleTargetLanguageChange = (langCode: LanguageCode) => {
    if (socketRef.current) {
      socketRef.current.emit("set_language_target", { langCode });
      setTargetLanguage(langCode);
    }
  };

  return {
    socketConnected,
    languages,
    setLanguages,
    sourceLanguage,
    targetLanguage,
    handleSourceLanguageChange,
    handleTargetLanguageChange
  };
}
