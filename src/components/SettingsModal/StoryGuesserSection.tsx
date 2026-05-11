import { ChevronDown, ChevronUp } from "lucide-react";
import PackFilterControls from "./PackFilterControls";
import type { StoryGuesserSettings } from "../../types";

interface StoryGuesserSectionProps {
  scrambleWords: boolean;
  scrambleLetters: boolean;
  hideName: boolean;
  sliceScale: number;
  isOpen: boolean;
  onToggle: () => void;
  onScrambleWordsChange: (value: boolean) => void;
  onScrambleLettersChange: (value: boolean) => void;
  onHideNameChange: (value: boolean) => void;
  onSliceScaleChange: (value: number) => void;
  packs: string[];
  settings: StoryGuesserSettings;
  onChange: (settings: StoryGuesserSettings) => void;
}

export default function StoryGuesserSection({
  scrambleWords,
  scrambleLetters,
  hideName,
  sliceScale,
  isOpen,
  onToggle,
  onScrambleWordsChange,
  onScrambleLettersChange,
  onHideNameChange,
  onSliceScaleChange,
  packs,
  settings,
  onChange,
}: StoryGuesserSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Story Guesser</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content settings-column">
          <PackFilterControls
            packs={packs}
            useGlobalFilter={settings.useGlobalPackFilter}
            filteredPacks={settings.filteredPacks}
            includeWeakness={settings.includeWeakness}
            includeSignatures={settings.includeSignatures}
            onUseGlobalFilterChange={(val) => onChange({...settings, useGlobalPackFilter: val})}
            onPackToggle={(pack) => {
              const newPacks = settings.filteredPacks.includes(pack)
                ? settings.filteredPacks.filter(p => p !== pack)
                : [...settings.filteredPacks, pack];
              onChange({ ...settings, filteredPacks: newPacks });
            }}
            onSelectAll={() => onChange({ ...settings, filteredPacks: [] })}
            onFilterAll={() => onChange({ ...settings, filteredPacks: packs })}
            onIncludeWeaknessChange={(val) => onChange({ ...settings, includeWeakness: val })}
            onIncludeSignaturesChange={(val) => onChange({ ...settings, includeSignatures: val })}
            includeBondedCard={settings.includeBondedCard}
            onIncludeBondedCardChange={(val) => onChange({ ...settings, includeBondedCard: val })}
            title="Card Filters"
          />

          <hr className="settings-divider" />

          <div className="settings-column">
            <h4>Game Rules</h4>
            <p className="settings-text">Configure how the text is scrambled.</p>
            
            <label className="setting-item">
              <div className="setting-label">
                <span>Scramble Word Order</span>
                <span className="setting-description">Shuffle the paragraphs of the card text.</span>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={scrambleWords}
                  onChange={(e) => onScrambleWordsChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>

            <label className="setting-item">
              <div className="setting-label">
                <span>Scramble Letters</span>
                <span className="setting-description">Shuffle the letters inside each word.</span>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={scrambleLetters}
                  onChange={(e) => onScrambleLettersChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>

            <label className="setting-item">
              <div className="setting-label">
                <span>Hide Investigator Name</span>
                <span className="setting-description">Censor investigator names if they appear in the text.</span>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={hideName}
                  onChange={(e) => onHideNameChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>

            <div className="setting-item no-cursor">
              <div className="setting-label">
                <span>Text Display Length: {Math.round(sliceScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={sliceScale}
                onChange={(e) => onSliceScaleChange(parseFloat(e.target.value))}
                className="range-slider"
                style={{ width: '120px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
