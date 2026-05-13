import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, AlertTriangle } from "lucide-react";
import { useGameContext } from "../../hooks/useGameContext";

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
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Global: General Setting</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content settings-column">
          {/* Enable Hints Toggle */}
          <label className="setting-item">
            <div className="setting-label">
              <span>Enable Hints</span>
              <span className="setting-description">Show hints after 3 wrong guesses in supported games</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enableHints}
                onChange={(e) => setSettings({ ...settings, enableHints: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </div>
          </label>

          {/* Include Campaign Cards Toggle */}
          {settings.includeEncounter && (
            <label className="setting-item">
              <div className="setting-label">
                <span>Include Campaign Cards</span>
                <span className="setting-description">Show campaign-specific cards in the game pool</span>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showCampaignCards}
                  onChange={(e) => setSettings({ ...settings, showCampaignCards: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
          )}

          <div className="settings-group">
            <label className="settings-text">Data Management</label>
            <div className="button-row tight">
              <button
                className={`premium-btn full-width ${settings.includeEncounter ? "active" : ""}`}
                onClick={async () => {
                  const newValue = !settings.includeEncounter;
                  if (newValue) {
                    setShowConfirm(true);
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

      {showConfirm && (
        <div className="modal-overlay confirm-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-with-icon">
                <AlertTriangle color="var(--warning)" size={24} />
                <h2>Confirm Download</h2>
              </div>
            </div>
            <div className="modal-body">
              <p className="settings-text">
                This will impact all game modes, such as including investigators like <strong>Gavriella Mizrah</strong> from <em>The Circle Undone - Disappearance at the Twilight Estate</em>, or some assets that are rarely thought of.
              </p>
              <p className="settings-text text-accent text-bold">
                Including campaign cards greatly enhances the True/False game mode, but it might make other game modes significantly harder!
              </p>
              <p className="settings-text">
                Note: Campaign cards will need to download <strong>11MB</strong> of data. This might be expensive on mobile data. You can toggle these cards off at any time after downloading.
              </p>
              <p className="settings-text">
                Are you sure you want to continue?
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="premium-btn footer-btn-primary"
                onClick={() => {
                  setShowConfirm(false);
                  setSettings({ ...settings, includeEncounter: true });
                  refreshData(true);
                }}
              >
                Continue
              </button>
              <button
                className="premium-btn footer-btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
