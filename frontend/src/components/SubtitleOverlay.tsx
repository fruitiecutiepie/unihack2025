import { Subtitle } from "@/app/page";

interface SubtitleOverlayProps {
  subtitle: Subtitle | null;
  showSubtitles: boolean;
  subtitleSettings: {
    fontSize: number;
    fontWeight: string;
    color: string;
    bgColor: string;
    outline: boolean;
  };
}

const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  subtitle,
  showSubtitles,
  subtitleSettings,
}) => {
  if (!subtitle || !showSubtitles) return null;
  const opacity =
    subtitle.timestamp && Date.now() - subtitle.timestamp > 2500 ? 0.3 : 0.9;

  return (
    <div
      className="absolute bottom-10 left-0 right-0 text-center px-6"
      style={{
        color: subtitleSettings.color,
        backgroundColor: subtitleSettings.bgColor,
        fontSize: `${subtitleSettings.fontSize}px`,
        fontWeight: subtitleSettings.fontWeight,
        textShadow: subtitleSettings.outline
          ? "1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000"
          : "none",
        padding: "8px",
        borderRadius: "4px",
        maxWidth: "80%",
        margin: "0 auto",
        opacity: opacity,
        transition: "opacity 0.5s ease",
      }}
    >
      {subtitle.originalText}
      {subtitle.sourceLang !== subtitle.targetLang && (
        <div className="text-sm text-gray-400">
          {subtitle.translatedText}
        </div>
      )}
    </div>
  );
};

export default SubtitleOverlay;
