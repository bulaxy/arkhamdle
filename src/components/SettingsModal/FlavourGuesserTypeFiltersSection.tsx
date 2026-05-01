import { ChevronDown, ChevronUp } from "lucide-react";
import type { TypeCode } from "../../types";
import { TypeCode as TypeCodeEnum } from "../../types/arkham";

interface FlavourGuesserTypeFiltersSectionProps {
  typeFilters: Record<TypeCode, boolean>;
  isOpen: boolean;
  onToggle: () => void;
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

export default function FlavourGuesserTypeFiltersSection({
  typeFilters,
  isOpen,
  onToggle,
  onTypeFilterChange,
}: FlavourGuesserTypeFiltersSectionProps) {
  const typeCodes: TypeCode[] = [
    TypeCodeEnum.ASSET,
    TypeCodeEnum.EVENT,
    TypeCodeEnum.SKILL,
    TypeCodeEnum.ENEMY,
    TypeCodeEnum.TREACHERY,
    TypeCodeEnum.LOCATION,
    TypeCodeEnum.STORY,
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
      )}
    </div>
  );
}
