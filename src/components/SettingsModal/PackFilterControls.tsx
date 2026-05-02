interface PackFilterControlsProps {
  packs: string[];
  filteredPacks: string[];
  includeWeakness: boolean;
  includeSignatures: boolean;
  onPackToggle: (packGroup: string) => void;
  onSelectAll: () => void;
  onFilterAll: () => void;
  onIncludeWeaknessChange: (include: boolean) => void;
  onIncludeSignaturesChange: (include: boolean) => void;
  title?: string;
  description?: string;
  useGlobalFilter?: boolean;
  onUseGlobalFilterChange?: (useGlobal: boolean) => void;
}

export default function PackFilterControls({
  packs,
  filteredPacks,
  includeWeakness,
  includeSignatures,
  onPackToggle,
  onSelectAll,
  onFilterAll,
  onIncludeWeaknessChange,
  onIncludeSignaturesChange,
  title,
  description,
  useGlobalFilter,
  onUseGlobalFilterChange,
}: PackFilterControlsProps) {
  return (
    <div className="pack-filter-controls">
      {title && <h4>{title}</h4>}
      {description && <p className="settings-text">{description}</p>}

      {onUseGlobalFilterChange !== undefined && (
        <div className="global-filter-toggle">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useGlobalFilter}
              onChange={(e) => onUseGlobalFilterChange(e.target.checked)}
            />
            <span className="bold">Use Global Pack Filter</span>
          </label>
        </div>
      )}

      {(!useGlobalFilter || onUseGlobalFilterChange === undefined) && (
        <>
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
              <span className="bold">Include Weaknesses</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => onIncludeSignaturesChange(e.target.checked)}
              />
              <span className="bold">Include Signatures</span>
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
        </>
      )}
    </div>
  );
}
