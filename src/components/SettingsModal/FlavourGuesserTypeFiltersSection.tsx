import { ChevronDown, ChevronUp } from "lucide-react";
import type { FlavourGuesserSettings, TypeName } from "../../types";
import { TypeName as TypeNameEnum } from "../../types/arkham";
import PackFilterControls from "./PackFilterControls";

interface FlavourGuesserTypeFiltersSectionProps {
  typeFilters: Record<TypeName, boolean>;
  isOpen: boolean;
  onToggle: () => void;
  onTypeFilterChange: (typeCode: TypeName, include: boolean) => void;
  packs: string[];
  settings: FlavourGuesserSettings;
  onChange: (settings: FlavourGuesserSettings) => void;
}

const TYPE_DISPLAY_NAMES: Record<TypeName, string> = {
  asset: "Asset",
  enemy: "Enemy",
  event: "Event",
  investigator: "Investigator",
  location: "Location",
  skill: "Skill",
  story: "Story",
  treachery: "Treachery",
  scenario: "Scenario",
  agenda: "Agenda",
  act: "Act",
  key: "Key",
  enemyLocation: "Enemy Location",
  other: "Other",
};

export default function FlavourGuesserTypeFiltersSection({
  typeFilters,
  isOpen,
  onToggle,
  onTypeFilterChange,
  packs,
  settings,
  onChange,
}: FlavourGuesserTypeFiltersSectionProps) {
  const typeNames: TypeName[] = [
    TypeNameEnum.ASSET,
    TypeNameEnum.EVENT,
    TypeNameEnum.SKILL,
    TypeNameEnum.ENEMY,
    TypeNameEnum.TREACHERY,
    TypeNameEnum.LOCATION,
    TypeNameEnum.STORY,
    TypeNameEnum.INVESTIGATOR,
    TypeNameEnum.SCENARIO,
    TypeNameEnum.AGENDA,
    TypeNameEnum.ACT,
    TypeNameEnum.KEY,
    TypeNameEnum.ENEMY_LOCATION,
    TypeNameEnum.OTHER,
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Flavour Guesser</h3>
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

          <div>
            <h4>Card Types</h4>
            <p className="settings-text mb-8">
              Select which card types to include.
            </p>
            <div className="type-filter-buttons">
              {typeNames.map((typeCode) => (
                <button
                  key={typeCode}
                  className={`pack-btn ${typeFilters[typeCode] ? "active" : ""}`}
                  onClick={() =>
                    onTypeFilterChange(typeCode, !typeFilters[typeCode])
                  }
                >
                  {TYPE_DISPLAY_NAMES[typeCode]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
