import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Language, LanguageState } from "@/utils/api";
import { BACKEND_URL, Subtitle } from "@/app/page";

export default function useSocket(
  setSubtitle: (subtitle: Subtitle) => void
) {
  const [languages, setLanguages] = useState<LanguageState>({
    available: Object.values(Language),
    loaded: [],
    currentSource: Language.English,
    currentTarget: Language.English
  });
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
      setLanguages((prev) => ({ ...prev, currentSource: data.lang }));
    });

    socket.on("set_language_target", (data: {
      lang: Language;
    }) => {
      setLanguages((prev) => ({ ...prev, currentTarget: data.lang }));
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
      setSubtitle({
        originalText: originalText,
        translatedText: translatedText,
        sourceLang: sourceLang,
        targetLang: targetLang,
        isPartial: isPartial,
        timestamp: Date.now()
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleSourceLanguageChange = (lang: Language) => {
    const languageCode = Object.values(Language).includes(lang)
      ? lang
      : Language.English;
    if (socketRef.current) {
      socketRef.current.emit("set_language_source", { lang: languageCode });
      setLanguages((prev) => ({ ...prev, currentSource: languageCode }));
    }
  };

  const handleTargetLanguageChange = (lang: Language) => {
    if (socketRef.current) {
      socketRef.current.emit("set_language_target", { lang });
      setLanguages((prev) => ({ ...prev, currentTarget: lang }));
    }
  };

  return {
    languages,
    socketConnected,
    handleSourceLanguageChange,
    handleTargetLanguageChange
  };
}
