import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useGameContext } from "../../hooks/useGameContext";
import { filterDuplicateOfCode } from "../../services/CardFilter";
import type { TypeName } from "../../types";
import { TypeName as TypeNameEnum } from "../../types/arkham";
import PackFilterControls from "./PackFilterControls";

interface TraitGuesserSectionProps {
  minCards: number;
  maxCards: number;
  requirementType: 'All' | 'Percentage' | 'Fixed Number';
  requirementValue: number;
  typeFilters: Record<TypeName, boolean>;
  isOpen: boolean;
  onToggle: () => void;
  onMinCardsChange: (value: number) => void;
  onMaxCardsChange: (value: number) => void;
  onRequirementTypeChange: (value: 'All' | 'Percentage' | 'Fixed Number') => void;
  onRequirementValueChange: (value: number) => void;
  onTypeFilterChange: (typeCode: TypeName, include: boolean) => void;
  // Pack Filter Props
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

export default function TraitGuesserSection({
  minCards,
  maxCards,
  requirementType,
  requirementValue,
  typeFilters,
  isOpen,
  onToggle,
  onMinCardsChange,
  onMaxCardsChange,
  onRequirementTypeChange,
  onRequirementValueChange,
  onTypeFilterChange,
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
}: TraitGuesserSectionProps) {
  const { filteredCards } = useGameContext();
  const [showTopTraits, setShowTopTraits] = useState(false);

  const topTraits = useMemo(() => {
    if (!isOpen || !showTopTraits) return [];
    
    const uniqueCards = filterDuplicateOfCode(filteredCards);
    const allOptions = uniqueCards.filter(c => typeFilters[c.typeName] ?? true);

    const traitCountMap = new Map<string, Set<string>>();
    allOptions.forEach(item => {
      item.traits.forEach(t => {
        if (!traitCountMap.has(t)) traitCountMap.set(t, new Set());
        traitCountMap.get(t)!.add(item.name);
      });
    });

    const sorted = Array.from(traitCountMap.entries())
      .map(([trait, names]) => ({ trait, count: names.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
    return sorted;
  }, [filteredCards, typeFilters, isOpen, showTopTraits]);

  const typeCodes: TypeName[] = [
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
    TypeNameEnum.OTHER,
  ];

  const impossibleValidation = 
    requirementType === 'Fixed Number' && 
    maxCards > 0 && 
    requirementValue > maxCards;

  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Trait Guesser</h3>
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

          <hr className="settings-divider" />

          <div>
            <h4>Game Rules</h4>
            <p className="settings-text">Configure rules for the Trait Guesser mode.</p>
            
            <div className="settings-group">
              <label className="settings-text">Min Cards with Trait</label>
              <input
                type="number"
                min="1"
                value={minCards}
                onChange={(e) => onMinCardsChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="premium-input"
              />
            </div>

            <div className="settings-group">
              <label className="settings-text">Max Cards with Trait (0 for no limit)</label>
              <p className="settings-text small">under 20 will start getting quite challenging</p>
              <input
                type="number"
                min="0"
                value={maxCards}
                onChange={(e) => onMaxCardsChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="premium-input"
              />
            </div>

            <div className="settings-group">
              <label className="settings-text">Requirement Type</label>
              <select 
                value={requirementType}
                onChange={(e) => onRequirementTypeChange(e.target.value as 'All' | 'Percentage' | 'Fixed Number')}
                className="premium-input"
              >
                <option value="Fixed Number">Fixed Number</option>
                <option value="Percentage">Percentage</option>
                <option value="All">Name All</option>
              </select>
            </div>

            {requirementType !== 'All' && (
              <div className="settings-group">
                <label className="settings-text">
                  {requirementType === 'Percentage' ? 'Percentage Required (%)' : 'Number Required'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={requirementType === 'Percentage' ? "100" : undefined}
                  value={requirementValue}
                  onChange={(e) => onRequirementValueChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="premium-input"
                />
                {impossibleValidation && (
                  <div className="settings-warning">
                    Warning: You require guessing {requirementValue} cards, but the maximum trait size is set to {maxCards}. This makes the game impossible to win.
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="settings-divider" />

          <div>
            <h4>Card Types</h4>
            <p className="settings-text small mb-8">
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

          <div className="mt-10">
            <button 
              className="premium-btn full-width mb-10" 
              onClick={() => setShowTopTraits(!showTopTraits)}
            >
              {showTopTraits ? "Hide Most Common Traits" : "Show Top 50 Most Common Traits"}
            </button>
            
            {showTopTraits && (
              <p className="settings-text small mb-8">
                Note that it is not 100% accurate based on other filters
              </p>
            )}
            {showTopTraits && (
              <div className="trait-table-container">
                <table className="trait-table">
                  <thead>
                    <tr>
                      <th>Trait</th>
                      <th className="text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTraits.map(({ trait, count }) => (
                      <tr key={trait}>
                        <td>{trait}</td>
                        <td className="text-right">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
