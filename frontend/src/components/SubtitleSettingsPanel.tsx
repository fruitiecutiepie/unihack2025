interface SubtitleSettingsPanelProps {
  subtitleSettings: {
    fontSize: number;
    fontWeight: string;
    color: string;
    bgColor: string;
    outline: boolean;
  };
  setSubtitleSettings: (
    settings: SubtitleSettingsPanelProps["subtitleSettings"]
  ) => void;
}

const SubtitleSettingsPanel: React.FC<SubtitleSettingsPanelProps> = ({
  subtitleSettings,
  setSubtitleSettings,
}) => {
  const updateSetting = (field: string, value: any) => {
    setSubtitleSettings({ ...subtitleSettings, [field]: value });
  };

  return (
    <div className="mt-4 p-6 bg-gray-100 rounded-lg w-[640px] shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Subtitle Settings</h3>
        <button onClick={() => setSubtitleSettings(subtitleSettings)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 
              1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 
              1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 
              4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-4 rounded-md shadow-sm">
          <h4 className="font-medium mb-3 text-gray-700">Text Appearance</h4>
          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-sm mb-1">
                <span>Font Size</span>
                <span className="font-medium">{subtitleSettings.fontSize}px</span>
              </label>
              <input
                type="range"
                min="16"
                max="36"
                value={subtitleSettings.fontSize}
                onChange={(e) =>
                  updateSetting("fontSize", parseInt(e.target.value))
                }
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Font Weight</label>
              <select
                value={subtitleSettings.fontWeight}
                onChange={(e) => updateSetting("fontWeight", e.target.value)}
                className="w-full rounded border p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-sm">
          <h4 className="font-medium mb-3 text-gray-700">Color & Background</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Text Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={subtitleSettings.color}
                  onChange={(e) => updateSetting("color", e.target.value)}
                  className="w-12 h-8 rounded border"
                />
                <span className="text-sm text-gray-600">
                  {subtitleSettings.color}
                </span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={subtitleSettings.bgColor !== "transparent"}
                  onChange={(e) =>
                    updateSetting("bgColor", e.target.checked ? "rgba(0,0,0,0.5)" : "transparent")
                  }
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm">Show Background</span>
              </label>
              {subtitleSettings.bgColor !== "transparent" && (
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="color"
                    value={
                      subtitleSettings.bgColor.startsWith("rgba")
                        ? "#000000"
                        : subtitleSettings.bgColor
                    }
                    onChange={(e) => {
                      const hex = e.target.value;
                      const r = parseInt(hex.slice(1, 3), 16);
                      const g = parseInt(hex.slice(3, 5), 16);
                      const b = parseInt(hex.slice(5, 7), 16);
                      updateSetting("bgColor", `rgba(${r},${g},${b},0.5)`);
                    }}
                    className="w-12 h-8 rounded border"
                  />
                  <span className="text-sm text-gray-600">Background color</span>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={subtitleSettings.outline}
                  onChange={(e) => updateSetting("outline", e.target.checked)}
                  className="rounded text-blue-500 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm">
                  Text Outline (improved readability)
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md flex items-center justify-center">
          <div
            className="px-6 py-3 text-center inline-block"
            style={{
              color: subtitleSettings.color,
              backgroundColor: subtitleSettings.bgColor,
              fontSize: `${subtitleSettings.fontSize}px`,
              fontWeight: subtitleSettings.fontWeight,
              textShadow: subtitleSettings.outline
                ? "1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000"
                : "none",
              borderRadius: "4px",
            }}
          >
            Preview Text
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtitleSettingsPanel;
