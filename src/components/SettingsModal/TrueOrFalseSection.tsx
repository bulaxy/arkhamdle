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
          <div className="pack-grid">
            <button className={`pack-btn ${settings.traitMode ? 'active' : ''}`} onClick={() => onChange({ ...settings, traitMode: !settings.traitMode })}>
              Cards Trait Mode
            </button>
            <button className={`pack-btn ${settings.enemyStatsMode ? 'active' : ''}`} onClick={() => onChange({ ...settings, enemyStatsMode: !settings.enemyStatsMode })}>
              Enemy Stats Mode
            </button>
            <button className={`pack-btn ${settings.locationTraitsMode ? 'active' : ''}`} onClick={() => onChange({ ...settings, locationTraitsMode: !settings.locationTraitsMode })}>
              Location Mode
            </button>
            <button className={`pack-btn ${settings.actTraitsMode ? 'active' : ''}`} onClick={() => onChange({ ...settings, actTraitsMode: !settings.actTraitsMode })}>
              Act & Agenda Mode
            </button>
            <button className={`pack-btn ${settings.agendaTraitsMode ? 'active' : ''}`} onClick={() => onChange({ ...settings, agendaTraitsMode: !settings.agendaTraitsMode })}>
              Agenda Mode
            </button>
            <button className={`pack-btn ${settings.treacheryTraitsMode ? 'active' : ''}`} onClick={() => onChange({ ...settings, treacheryTraitsMode: !settings.treacheryTraitsMode })}>
              Treachery Mode
            </button>

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
}
