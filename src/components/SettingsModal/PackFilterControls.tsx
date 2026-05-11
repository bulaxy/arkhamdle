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
  includeBondedCard: boolean;
  onIncludeBondedCardChange: (include: boolean) => void;
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
  includeBondedCard,
  onIncludeBondedCardChange,
  title,
  description,
  useGlobalFilter,
  onUseGlobalFilterChange,
}: PackFilterControlsProps) {
  return (
    <div className="pack-filter-controls">
      {title && <h4 className="mb-4">{title}</h4>}
      {description && <p className="settings-text mb-8">{description}</p>}

      {onUseGlobalFilterChange !== undefined && (
        <div className="global-filter-toggle">
          <label className="setting-item">
            <div className="setting-label">
              <span>Use Global Pack Filter</span>
              <span className="setting-description">Use the pack filters defined in the Global settings section.</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={useGlobalFilter}
                onChange={(e) => onUseGlobalFilterChange(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </div>
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

          <div className="pack-filter-container settings-column mt-10">
            <label className="setting-item">
              <div className="setting-label">
                <span>Include Weaknesses</span>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={includeWeakness}
                  onChange={(e) => onIncludeWeaknessChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
            <label className="setting-item">
              <div className="setting-label">
                <span>Include Signatures</span>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => onIncludeSignaturesChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
            <label className="setting-item">
              <div className="setting-label">
                <span>Include Bonded Cards</span>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={includeBondedCard}
                  onChange={(e) => onIncludeBondedCardChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
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
