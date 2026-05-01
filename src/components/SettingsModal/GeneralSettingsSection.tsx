import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useGameContext } from "../../context/GameContext";

interface GeneralSettingsSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function GeneralSettingsSection({
  isOpen,
  onToggle,
  onClose,
}: GeneralSettingsSectionProps) {
  const { settings, setSettings, refreshData } = useGameContext();

  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Global: General Setting</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content settings-column">
          {/* Enable Hints Toggle */}
          <div className="hint-toggle-row">
            <div>
              <h3 className="hint-toggle-title">Enable Hints</h3>
              <p className="settings-text small">
                Show hints after 3 wrong guesses in supported games
              </p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.enableHints}
                onChange={(e) => setSettings({ ...settings, enableHints: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="settings-group">
            <label className="settings-text">Data Management</label>
            <div className="button-row tight">
              <button
                className={`premium-btn full-width ${settings.includeEncounter ? "active" : ""}`}
                onClick={async () => {
                  const newValue = !settings.includeEncounter;
                  if (newValue) {
                    const confirmed = window.confirm(
                      "Campaign cards will add about 8MB to the data download (11MB total). This might be expensive on mobile data. Are you sure you want to continue?"
                    );
                    if (confirmed) {
                      setSettings({ ...settings, includeEncounter: true });
                      refreshData(true);
                    }
                  } else {
                    setSettings({ ...settings, includeEncounter: false });
                    refreshData(false);
                  }
                }}
              >
                <RefreshCw size={18} className={settings.includeEncounter ? "spin-once" : ""} />
                {settings.includeEncounter ? "Unload Campaign Cards" : "Load Campaign Cards (11MB)"}
              </button>

              <button
                className="premium-btn full-width"
                onClick={async () => {
                  await refreshData();
                  onClose();
                }}
              >
                <RefreshCw size={18} /> Force Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
