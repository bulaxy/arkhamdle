import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, AlertTriangle, Trash2, StopCircle, BarChart2, Info, Download, Upload, Hash, Trophy, Database, Users } from "lucide-react";
import { useGameContext } from "../../hooks/useGameContext";
import { useStats } from "../../context/StatsContext";
import type { AppSettings } from "../../types";
import StatsModal from "../StatsModal/StatsModal";

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
  const { settings, setSettings, refreshData, applySeed } = useGameContext();
  const { stopStreak, clearRecord } = useStats();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [prevSeed, setPrevSeed] = useState(settings.seed || "");
  const [localSeed, setLocalSeed] = useState(settings.seed || "");

  const currentSeed = settings.seed || "";
  if (currentSeed !== prevSeed) {
    setPrevSeed(currentSeed);
    setLocalSeed(currentSeed);
  }

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

          {/* Win Streaks Section */}
          <hr className="settings-divider" />
          <div className="settings-group">
            <div className="settings-group-header">
              <Trophy size={18} />
              <span>Win Streaks & Records</span>
            </div>
            <div className="settings-info-box">
              <div className="info-header">
                <Info size={16} />
                <span>Streak Rules</span>
              </div>
              <ul className="info-list">
                <li><strong>Wordle / Investigatordle / Pic / Campaign:</strong> Loss triggered after the configured max guesses or give up. Set limit per mode in its settings tab.</li>
                <li><strong>Story / Flavour (Direct) / Trait:</strong> Loss triggered after the configured max wrong guesses.</li>
                <li><strong>Flavour (Multi-choice) / True-False / Icon / Count / Guess By Trait:</strong> Single-attempt; any error resets the streak.</li>
                <li><strong>Random Trivia:</strong> Wins count for both the specific game and Random mode.</li>
              </ul>
            </div>

            {/* Win Streak Display Selector */}
            <div className="setting-item">
              <div className="setting-label">
                <span>Win Streak Display</span>
                <span className="setting-description">Choose to display the personal combined win streak across all game modes or a specific game mode's streak</span>
              </div>
              <select
                value={settings.streakDisplayType || "global"}
                onChange={(e) => setSettings({ ...settings, streakDisplayType: e.target.value as 'global' | 'mode' })}
                className="premium-input"
              >
                <option value="global">Personal Combined (All Game Modes)</option>
                <option value="mode">Specific Game Mode Only</option>
              </select>
            </div>

            <div className="button-row tight">
              <button
                className="premium-btn full-width"
                onClick={() => setShowStatsModal(true)}
              >
                <BarChart2 size={18} /> View Records
              </button>
              <button
                className="premium-btn full-width delete-btn"
                onClick={() => {
                  if (confirm("Reset current streaks to zero? (Overall records will be kept)")) {
                    stopStreak();
                  }
                }}
              >
                <StopCircle size={18} /> Stop Streak
              </button>
              <button
                className="premium-btn full-width delete-btn"
                onClick={() => {
                  if (confirm("Are you sure you want to PERMANENTLY clear all records and streaks?")) {
                    clearRecord();
                  }
                }}
              >
                <Trash2 size={18} /> Clear Record
              </button>
            </div>
          </div>

          <hr className="settings-divider" />
          <div className="settings-group">
            <div className="settings-group-header">
              <Database size={18} />
              <span>Data Management</span>
            </div>
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

          {/* Competition & Seed Section */}
          <hr className="settings-divider" />
          <div className="settings-group">
            <div className="settings-group-header">
              <Users size={18} />
              <span>Competition & Seed</span>
            </div>
            <div className="settings-info-box">
              <div className="info-header">
                <Info size={16} />
                <span>How to Compete</span>
              </div>
              <ul className="info-list">
                <li>1. Select the <strong>Game Mode</strong> you will be playing.</li>
                <li>2. <strong>Export</strong> your settings and share the file.</li>
                <li>3. Others should <strong>Import</strong> the settings file.</li>
                <li>4. Everyone enters the <strong>same Seed</strong> last.</li>
                <li>5. <strong>Coordinate & Check:</strong> It is highly recommended to check/coordinate with other players on which games/questions you will be playing before starting the run.</li>
                <li>6. <strong>Streaks & Leaderboard:</strong> Since custom seeds do not have a dedicated online leaderboard, players should clear/reset their streaks before starting to compete fairly, or track scores/guesses separately.</li>
              </ul>
            </div>

            <div className="setting-item no-border">
              <div className="setting-label">
                <span>Game Seed</span>
                <span className="setting-description">Ensure everyone uses the same seed for identical results</span>
              </div>
              <div className="seed-input-wrapper" style={{ display: 'flex', gap: '8px' }}>
                <Hash size={16} className="input-icon" style={{ marginTop: '10px' }} />
                <input
                  type="text"
                  className="seed-input"
                  placeholder="Enter seed (e.g. daily-123)"
                  value={localSeed}
                  onChange={(e) => setLocalSeed(e.target.value)}
                />
                <button 
                  className="premium-btn small-btn" 
                  onClick={() => applySeed(localSeed)}
                  style={{ padding: '8px 16px', minWidth: '80px' }}
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="button-row tight">
              <button
                className="premium-btn full-width"
                onClick={() => {
                  const dataStr = JSON.stringify(settings, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                  const exportFileDefaultName = `arkhamdle_settings_${new Date().toISOString().split('T')[0]}.json`;

                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
              >
                <Download size={18} /> Export Settings
              </button>

              <div className="file-input-wrapper full-width">
                <button className="premium-btn full-width">
                  <Upload size={18} /> Import Settings
                  <input
                    type="file"
                    accept=".json"
                    className="hidden-file-input"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        try {
                          const content = event.target?.result as string;
                          const importedSettings = JSON.parse(content) as AppSettings;

                          // Basic validation
                          if (!importedSettings.wordle) {
                            throw new Error("Invalid settings file");
                          }

                          // Check if we need to load encounter cards
                          if (importedSettings.includeEncounter && !settings.includeEncounter) {
                            if (confirm("Imported settings require campaign cards. Download them now? (11MB)")) {
                              setSettings(importedSettings);
                              await refreshData(true);
                            } else {
                              setSettings({ ...importedSettings, includeEncounter: false });
                            }
                          } else {
                            setSettings(importedSettings);
                          }
                          alert("Settings imported successfully!");
                        } catch (err) {
                          console.error(err);
                          alert("Failed to import settings. Please make sure it's a valid JSON file.");
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatsModal && (
        <StatsModal onClose={() => setShowStatsModal(false)} />
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
