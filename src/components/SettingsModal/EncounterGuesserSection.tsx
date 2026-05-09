import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PackFilterControls from './PackFilterControls';

interface EncounterGuesserSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  blurAmount: number;
  onBlurAmountChange: (value: number) => void;
  packs: string[];
  useGlobalPackFilter: boolean;
  filteredPacks: string[];
  includeWeakness: boolean;
  includeSignatures: boolean;
  onUseGlobalPackFilterChange: (value: boolean) => void;
  onPackToggle: (pack: string) => void;
  onSelectAll: () => void;
  onFilterAll: () => void;
  onIncludeWeaknessChange: (value: boolean) => void;
  onIncludeSignaturesChange: (value: boolean) => void;
  includeBondedCard: boolean;
  onIncludeBondedCardChange: (value: boolean) => void;
}

const EncounterGuesserSection: React.FC<EncounterGuesserSectionProps> = ({
  isOpen,
  onToggle,
  blurAmount,
  onBlurAmountChange,
  packs,
  useGlobalPackFilter,
  filteredPacks,
  includeWeakness,
  includeSignatures,
  onUseGlobalPackFilterChange,
  onPackToggle,
  onSelectAll,
  onFilterAll,
  onIncludeWeaknessChange,
  onIncludeSignaturesChange,
  includeBondedCard,
  onIncludeBondedCardChange,
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
            useGlobalFilter={useGlobalPackFilter}
            filteredPacks={filteredPacks}
            includeWeakness={includeWeakness}
            includeSignatures={includeSignatures}
            onUseGlobalFilterChange={onUseGlobalPackFilterChange}
            onPackToggle={onPackToggle}
            onSelectAll={onSelectAll}
            onFilterAll={onFilterAll}
            onIncludeWeaknessChange={onIncludeWeaknessChange}
            onIncludeSignaturesChange={onIncludeSignaturesChange}
            includeBondedCard={includeBondedCard}
            onIncludeBondedCardChange={onIncludeBondedCardChange}
            title="Card Filters"
          />
        </div>
      )}
    </div>
  );
};

export default EncounterGuesserSection;
