import { ChevronDown, ChevronUp } from "lucide-react";
import type { FlavourGuesserSettings, TypeName } from "../../types";
import { TypeName as TypeNameEnum } from "../../types/arkham";
import PackFilterControls from "./PackFilterControls";
import MaxGuessesControl from "./MaxGuessesControl";

interface FlavourGuesserTypeFiltersSectionProps {
  typeFilters: Record<TypeName, boolean>;
  isOpen: boolean;
  onToggle: () => void;
  onTypeFilterChange: (typeCode: TypeName, include: boolean) => void;
  inputMode?: 'Multiple Choice' | 'Direct Input';
  onInputModeChange?: (mode: 'Multiple Choice' | 'Direct Input') => void;
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
  inputMode,
  onInputModeChange,
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
        <h3>Flavour Guesser</h3>
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

          {inputMode && onInputModeChange && (
            <>
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
            </>
          )}

          <div>
            <h4>Card Types</h4>
            <p className="settings-text mb-8">
              Select which card types to include.
            </p>
            <div className="setting-grid">
              {typeNames.map((typeCode) => (
                <label key={typeCode} className="setting-item">
                  <div className="setting-label">
                    <span>{TYPE_DISPLAY_NAMES[typeCode]}</span>
                  </div>
                  <div className="toggle-switch small">
                    <input
                      type="checkbox"
                      checked={typeFilters[typeCode]}
                      onChange={(e) => onTypeFilterChange(typeCode, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {inputMode === 'Direct Input' && (
            <>
              <hr className="settings-divider" />
              <MaxGuessesControl settings={settings} onChange={onChange} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
