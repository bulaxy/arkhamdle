import { ChevronDown, ChevronUp } from "lucide-react";
import type { TypeCode } from "../../types";
import { TypeCode as TypeCodeEnum } from "../../types/arkham";

type Difficulty = "Hard" | "Normal" | "Easy";

interface PicGuesserSectionProps {
  difficulty: Difficulty;
  typeFilters: Record<TypeCode, boolean>;
  isOpen: boolean;
  onToggle: () => void;
  onDifficultyChange: (diff: Difficulty) => void;
  onTypeFilterChange: (typeCode: TypeCode, include: boolean) => void;
}

const TYPE_DISPLAY_NAMES: Record<TypeCode, string> = {
  asset: "Asset",
  enemy: "Enemy",
  event: "Event",
  investigator: "Investigator",
  location: "Location",
  skill: "Skill",
  story: "Story",
  treachery: "Treachery",
};

export default function PicGuesserSection({
  difficulty,
  typeFilters,
  isOpen,
  onToggle,
  onDifficultyChange,
  onTypeFilterChange,
}: PicGuesserSectionProps) {
  const typeCodes: TypeCode[] = [
    TypeCodeEnum.ASSET,
    TypeCodeEnum.EVENT,
    TypeCodeEnum.SKILL,
    TypeCodeEnum.ENEMY,
    TypeCodeEnum.TREACHERY,
    TypeCodeEnum.LOCATION,
    TypeCodeEnum.STORY,
    TypeCodeEnum.INVESTIGATOR,
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Pic Guesser</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <p className="settings-text" style={{ marginBottom: '8px' }}>
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
            <p className="settings-text" style={{ marginBottom: '8px' }}>
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
