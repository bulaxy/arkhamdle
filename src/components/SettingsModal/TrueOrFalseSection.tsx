import { ChevronDown, ChevronUp } from "lucide-react";
import PackFilterControls from "./PackFilterControls";

import type { TrueOrFalseSettings } from "../../types";

interface TrueOrFalseSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  packs: string[];
  settings: TrueOrFalseSettings;
  onChange: (settings: TrueOrFalseSettings) => void;
}

export default function TrueOrFalseSection({
  isOpen,
  onToggle,
  packs,
  settings,
  onChange,
}: TrueOrFalseSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>True Or False</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content settings-column">
          <label className="setting-item">
            <div className="setting-label">
              <span>Trait Mode</span>
              <span className="setting-description">Ask if a card has certain traits.</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.traitMode}
                onChange={(e) => onChange({ ...settings, traitMode: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </div>
          </label>

          <label className="setting-item">
            <div className="setting-label">
              <span>Enemy Stats Mode</span>
              <span className="setting-description">Ask about enemy stats and keywords.</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enemyStatsMode}
                onChange={(e) => onChange({ ...settings, enemyStatsMode: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </div>
          </label>

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
}
