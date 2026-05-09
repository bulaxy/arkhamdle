import { ChevronDown, ChevronUp } from "lucide-react";
import PackFilterControls from "./PackFilterControls";

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
  includeBondedCard: boolean;
  onIncludeBondedCardChange: (include: boolean) => void;
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
  includeBondedCard,
  onIncludeBondedCardChange,
}: PackFiltersSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Global: Cards Filter</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content">
          <PackFilterControls
            packs={packs}
            filteredPacks={filteredPacks}
            includeWeakness={includeWeakness}
            includeSignatures={includeSignatures}
            onPackToggle={onPackToggle}
            onSelectAll={onSelectAll}
            onFilterAll={onFilterAll}
            onIncludeWeaknessChange={onIncludeWeaknessChange}
            onIncludeSignaturesChange={onIncludeSignaturesChange}
            includeBondedCard={includeBondedCard}
            onIncludeBondedCardChange={onIncludeBondedCardChange}
            description="Filter which pack groups to include in the games by default. All games will use this unless overridden in their specific settings."
          />
        </div>
      )}
    </div>
  );
}
