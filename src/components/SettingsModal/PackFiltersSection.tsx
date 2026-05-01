import { ChevronDown, ChevronUp } from "lucide-react";

interface PackFiltersSectionProps {
  packs: string[];
  filteredPacks: string[];
  includeWeakness: boolean;
  includeSignatures: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onPackToggle: (packGroup: string) => void;
  onSelectAll: () => void;
  onFilterAll: () => void;
  onIncludeWeaknessChange: (include: boolean) => void;
  onIncludeSignaturesChange: (include: boolean) => void;
}

export default function PackFiltersSection({
  packs,
  filteredPacks,
  includeWeakness,
  includeSignatures,
  isOpen,
  onToggle,
  onPackToggle,
  onSelectAll,
  onFilterAll,
  onIncludeWeaknessChange,
  onIncludeSignaturesChange,
}: PackFiltersSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Global: Pack Filters</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content">
          <p className="settings-text">
            Filter which pack groups to include in the games. By default, all
            are shown.
          </p>
          <div className="button-row">
            <button className="premium-btn" onClick={onSelectAll}>
              Select All
            </button>
            <button className="premium-btn" onClick={onFilterAll}>
              Filter All
            </button>
          </div>

          <div className="pack-filter-container">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeWeakness}
                onChange={(e) => onIncludeWeaknessChange(e.target.checked)}
              />
              <span className="bold">
                Include Weaknesses (Basic & Non-Basic)
              </span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => onIncludeSignaturesChange(e.target.checked)}
              />
              <span className="bold">
                Include Signature Cards
              </span>
            </label>
          </div>

          <div className="pack-grid">
            {packs.map((packGroup) => {
              const isChecked = !filteredPacks.includes(packGroup);
              return (
                <button
                  key={packGroup}
                  className={`pack-btn ${isChecked ? "active" : ""}`}
                  onClick={() => onPackToggle(packGroup)}
                >
                  {packGroup}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
