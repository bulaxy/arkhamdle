import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PackFilterControls from './PackFilterControls';
import type { CampaignPackGuesserSettings } from '../../types';

interface CampaignPackGuesserSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  blurAmount: number;
  onBlurAmountChange: (value: number) => void;
  packs: string[];
  settings: CampaignPackGuesserSettings;
  onChange: (settings: CampaignPackGuesserSettings) => void;
}

const CampaignPackGuesserSection: React.FC<CampaignPackGuesserSectionProps> = ({
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
        <h3>Campaign Pack Guesser</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      
      {isOpen && (
        <div className="settings-section-content settings-column">
          <div className="setting-item no-cursor">
            <div className="setting-label">
              <span>Blur Amount ({blurAmount}px)</span>
              <p className="setting-description">Adjust the blur amount for the encounter card image.</p>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={blurAmount}
              onChange={(e) => onBlurAmountChange(parseInt(e.target.value, 10))}
              className="range-slider"
              style={{ width: '120px' }}
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

export default CampaignPackGuesserSection;
