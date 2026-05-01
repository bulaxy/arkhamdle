import { ChevronDown, ChevronUp } from "lucide-react";
import type { TypeName } from "../../types";
import { TypeName as TypeNameEnum } from "../../types/arkham";

interface FlavourGuesserTypeFiltersSectionProps {
  typeFilters: Record<TypeName, boolean>;
  isOpen: boolean;
  onToggle: () => void;
  onTypeFilterChange: (typeCode: TypeName, include: boolean) => void;
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
};

export default function FlavourGuesserTypeFiltersSection({
  typeFilters,
  isOpen,
  onToggle,
  onTypeFilterChange,
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
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Flavour Guesser</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content">
          <p className="settings-text">
            Select which card types to include in Flavour Guesser.
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
      )}
    </div>
  );
}
