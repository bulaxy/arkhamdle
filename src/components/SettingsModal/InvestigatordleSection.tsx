import { ChevronDown, ChevronUp } from "lucide-react";
import PackFilterControls from "./PackFilterControls";

interface InvestigatordleSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  packs: string[];
  useGlobalPackFilter: boolean;
  filteredPacks: string[];
  includeWeakness: boolean;
  includeSignatures: boolean;
  onUseGlobalPackFilterChange: (value: boolean) => void;
  onPackToggle: (pack: string) => void;
  onSelectAll: () => void;
  onFilterAll: () => void;
  onIncludeWeaknessChange: (value: boolean) => void;
  onIncludeSignaturesChange: (value: boolean) => void;
  includeBondedCard: boolean;
  onIncludeBondedCardChange: (value: boolean) => void;
}

export default function InvestigatordleSection({
  isOpen,
  onToggle,
  packs,
  useGlobalPackFilter,
  filteredPacks,
  includeWeakness,
  includeSignatures,
  onUseGlobalPackFilterChange,
  onPackToggle,
  onSelectAll,
  onFilterAll,
  onIncludeWeaknessChange,
  onIncludeSignaturesChange,
  includeBondedCard,
  onIncludeBondedCardChange,
}: InvestigatordleSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Investigatordle</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content settings-column">
          <PackFilterControls
            packs={packs}
            useGlobalFilter={useGlobalPackFilter}
            filteredPacks={filteredPacks}
            includeWeakness={includeWeakness}
            includeSignatures={includeSignatures}
            onUseGlobalFilterChange={onUseGlobalPackFilterChange}
            onPackToggle={onPackToggle}
            onSelectAll={onSelectAll}
            onFilterAll={onFilterAll}
            onIncludeWeaknessChange={onIncludeWeaknessChange}
            onIncludeSignaturesChange={onIncludeSignaturesChange}
            includeBondedCard={includeBondedCard}
            onIncludeBondedCardChange={onIncludeBondedCardChange}
            title="Card Filters"
          />
        </div>
      )}
    </div>
  );
}
