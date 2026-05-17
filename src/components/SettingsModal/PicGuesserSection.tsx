import { ChevronDown, ChevronUp } from "lucide-react";
import type { PicGuesserSettings, TypeName } from "../../types";
import { TypeName as TypeNameEnum } from "../../types/arkham";
import PackFilterControls from "./PackFilterControls";
import MaxGuessesControl from "./MaxGuessesControl";

type Difficulty = "Hard" | "Normal" | "Easy";

interface PicGuesserSectionProps {
  difficulty: Difficulty;
  typeFilters: Record<TypeName, boolean>;
  isOpen: boolean;
  onToggle: () => void;
  onDifficultyChange: (diff: Difficulty) => void;
  onTypeFilterChange: (typeCode: TypeName, include: boolean) => void;
  packs: string[];
  settings: PicGuesserSettings;
  onChange: (settings: PicGuesserSettings) => void;
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

export default function PicGuesserSection({
  difficulty,
  typeFilters,
  isOpen,
  onToggle,
  onDifficultyChange,
  onTypeFilterChange,
  packs,
  settings,
  onChange,
}: PicGuesserSectionProps) {
  const typeCodes: TypeName[] = [
    TypeNameEnum.ASSET,
    TypeNameEnum.EVENT,
    TypeNameEnum.SKILL,
    TypeNameEnum.ENEMY,
    TypeNameEnum.TREACHERY,
    TypeNameEnum.LOCATION,
    TypeNameEnum.STORY,
    TypeNameEnum.ENEMY_LOCATION,
    TypeNameEnum.OTHER,
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Pic Guesser</h3>
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
            <h4>Difficulty</h4>
            <p className="settings-text mb-8">
              How much it zooms out each time you guess incorrectly.
            </p>
            <div className="button-row tight">
              {(["Hard", "Normal", "Easy"] as const).map((diff) => (
                <button
                  key={diff}
                  className={`premium-btn difficulty-btn ${difficulty === diff ? "active" : ""}`}
                  onClick={() => onDifficultyChange(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <hr className="settings-divider" />

          <div>
            <h4>Card Types</h4>
            <p className="settings-text mb-8">
              Select which card types to include.
            </p>
            <div className="setting-grid">
              {typeCodes.map((typeCode) => (
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
          <hr className="settings-divider" />
          <MaxGuessesControl settings={settings} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
