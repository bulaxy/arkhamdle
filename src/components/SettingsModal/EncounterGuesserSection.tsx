import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PackFilterControls from './PackFilterControls';
import type { EncounterGuesserSettings } from '../../types';

interface EncounterGuesserSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  blurAmount: number;
  onBlurAmountChange: (value: number) => void;
  packs: string[];
  settings: EncounterGuesserSettings;
  onChange: (settings: EncounterGuesserSettings) => void;
}

const EncounterGuesserSection: React.FC<EncounterGuesserSectionProps> = ({
  isOpen,
  onToggle,
  blurAmount,
  onBlurAmountChange,
  packs,
  settings,
  onChange,
}) => {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Encounter Guesser</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      
      {isOpen && (
        <div className="settings-section-content settings-column">
          <div className="setting-item">
            <div className="setting-header">
              <span className="setting-label">Blur Amount ({blurAmount}px)</span>
            </div>
            <p className="setting-description">Adjust the blur amount for the encounter card image.</p>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={blurAmount}
              onChange={(e) => onBlurAmountChange(parseInt(e.target.value, 10))}
              className="range-slider"
            />
          </div>

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
        </div>
      )}
    </div>
  );
};

export default EncounterGuesserSection;
