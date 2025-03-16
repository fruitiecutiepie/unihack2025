interface RecordingControlsProps {
  recording: boolean;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleAudio: () => void;
  showSubtitles: boolean;
  setShowSubtitles: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  recording,
  audioEnabled,
  setAudioEnabled,
  startRecording,
  stopRecording,
  toggleAudio,
  showSubtitles,
  setShowSubtitles,
  setShowSettings,
}) => {
  return (
    <div className="flex gap-4">
      {!recording ? (
        <>
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Start Recording
          </button>
          <button
            onClick={toggleAudio}
            className={`px-4 py-2 ${audioEnabled
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gray-500 hover:bg-gray-600"
              } text-white rounded-md transition-colors`}
          >
            {audioEnabled ? "Mic On" : "Mic Off"}
          </button>
        </>
      ) : (
        <button
          onClick={stopRecording}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Stop Recording
        </button>
      )}

      <button
        onClick={() => setShowSubtitles(!showSubtitles)}
        className={`px-4 py-2 ${showSubtitles
          ? "bg-green-500 hover:bg-green-600"
          : "bg-gray-500 hover:bg-gray-600"
          } text-white rounded-md transition-colors`}
      >
        {showSubtitles ? "Subtitles On" : "Subtitles Off"}
      </button>

      <button
        onClick={() => setShowSettings(true)}
        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
      >
        Subtitle Settings
      </button>
    </div>
  );
};

export default RecordingControls;
