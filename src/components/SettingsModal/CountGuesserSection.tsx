import { ChevronDown, ChevronUp } from "lucide-react";
import PackFilterControls from "./PackFilterControls";
import type { CountGuesserSettings } from "../../types";

interface CountGuesserSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  inputMode: 'Multiple Choice' | 'Direct Input';
  onInputModeChange: (mode: 'Multiple Choice' | 'Direct Input') => void;
  poolFilter: 'Player Cards Only' | 'All Cards';
  onPoolFilterChange: (filter: 'Player Cards Only' | 'All Cards') => void;
  packs: string[];
  settings: CountGuesserSettings;
  onChange: (settings: CountGuesserSettings) => void;
}

export default function CountGuesserSection({
  isOpen,
  onToggle,
  inputMode,
  onInputModeChange,
  poolFilter,
  onPoolFilterChange,
  packs,
  settings,
  onChange,
}: CountGuesserSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Count Guesser</h3>
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
            includeBondedCard={settings.includeBondedCard}
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
            onIncludeBondedCardChange={(val) => onChange({ ...settings, includeBondedCard: val })}
            title="Card Filters"
          />

          <hr className="settings-divider" />

          <div>
            <h4>Input Mode</h4>
            <p className="settings-text mb-8">
              Select how you want to answer questions.
            </p>
            <div className="setting-toggle-group">
              <button
                className={`toggle-btn ${inputMode === "Multiple Choice" ? "active" : ""}`}
                onClick={() => onInputModeChange("Multiple Choice")}
              >
                Multiple Choice
              </button>
              <button
                className={`toggle-btn ${inputMode === "Direct Input" ? "active" : ""}`}
                onClick={() => onInputModeChange("Direct Input")}
              >
                Direct Input
              </button>
            </div>
          </div>
          
          <hr className="settings-divider" />

          <div>
            <h4>Card Pool Filtering</h4>
            <p className="settings-text mb-8">
              Select which cards to include in the guessing pool.
            </p>
            <div className="setting-toggle-group">
              <button
                className={`toggle-btn ${poolFilter === "Player Cards Only" ? "active" : ""}`}
                onClick={() => onPoolFilterChange("Player Cards Only")}
              >
                Player Cards Only
              </button>
              <button
                className={`toggle-btn ${poolFilter === "All Cards" ? "active" : ""}`}
                onClick={() => onPoolFilterChange("All Cards")}
              >
                All Cards
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
