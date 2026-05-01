import { ChevronDown, ChevronUp } from "lucide-react";
import type { TypeName } from "../../types";
import { TypeName as TypeNameEnum } from "../../types/arkham";

type Difficulty = "Hard" | "Normal" | "Easy";

interface PicGuesserSectionProps {
  difficulty: Difficulty;
  typeFilters: Record<TypeName, boolean>;
  isOpen: boolean;
  onToggle: () => void;
  onDifficultyChange: (diff: Difficulty) => void;
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

export default function PicGuesserSection({
  difficulty,
  typeFilters,
  isOpen,
  onToggle,
  onDifficultyChange,
  onTypeFilterChange,
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
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Pic Guesser</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content settings-column">
          <div>
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

          <div>
            <p className="settings-text mb-8">
              Select which card types to include.
            </p>
            <div className="type-filter-buttons">
              {typeCodes.map((typeCode) => (
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
