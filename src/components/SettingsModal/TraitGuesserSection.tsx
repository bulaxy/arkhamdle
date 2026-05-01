import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useGameContext } from "../../context/GameContext";
import { filterDuplicateOfCode } from "../../services/CardFilter";
import type { TypeCode } from "../../types";
import { TypeCode as TypeCodeEnum } from "../../types/arkham";

interface TraitGuesserSectionProps {
  minCards: number;
  maxCards: number;
  requirementType: 'All' | 'Percentage' | 'Fixed Number';
  requirementValue: number;
  typeFilters: Record<TypeCode, boolean>;
  isOpen: boolean;
  onToggle: () => void;
  onMinCardsChange: (value: number) => void;
  onMaxCardsChange: (value: number) => void;
  onRequirementTypeChange: (value: 'All' | 'Percentage' | 'Fixed Number') => void;
  onRequirementValueChange: (value: number) => void;
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
}: TraitGuesserSectionProps) {
  const { filteredCards, filteredInvestigators } = useGameContext();
  const [showTopTraits, setShowTopTraits] = useState(false);

  const topTraits = useMemo(() => {
    if (!isOpen || !showTopTraits) return [];
    
    const cards = filterDuplicateOfCode(filteredCards);
    const investigators = filterDuplicateOfCode(filteredInvestigators);
    
    const allOptions = [
      ...cards.filter(c => typeFilters[c.type_code] ?? true),
      ...investigators.filter(_ => typeFilters['investigator'] ?? true)
    ];

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
  }, [filteredCards, filteredInvestigators, typeFilters, isOpen, showTopTraits]);

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
        <div className="settings-section-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p className="settings-text">Configure rules for the Trait Guesser mode.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="settings-text">Min Cards with Trait</label>
            <input
              type="number"
              min="1"
              value={minCards}
              onChange={(e) => onMinCardsChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="premium-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="settings-text">Max Cards with Trait (0 for no limit)</label>
            <p className="settings-text" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '-4px' }}>under 20 will start getting quite challenging</p>
            <input
              type="number"
              min="0"
              value={maxCards}
              onChange={(e) => onMaxCardsChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="premium-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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

          <div style={{ marginTop: '5px' }}>
            <label className="settings-text">Type Filters</label>
            <p className="settings-text" style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '8px' }}>
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

          {requirementType !== 'All' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
                <div style={{ color: '#ff4444', fontSize: '0.9em', marginTop: '4px' }}>
                  Warning: You require guessing {requirementValue} cards, but the maximum trait size is set to {maxCards}. This makes the game impossible to win.
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '10px' }}>
            <button 
              className="premium-btn" 
              onClick={() => setShowTopTraits(!showTopTraits)}
              style={{ width: '100%', marginBottom: '10px' }}
            >
              {showTopTraits ? "Hide Most Common Traits" : "Show Top 50 Most Common Traits"}
            </button>
            
            {showTopTraits && (
              <p className="settings-text" style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '8px' }}>
                Note that it is not 100% accurate based on other filters
              </p>
            )}
            {showTopTraits && (
              <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <th style={{ padding: '4px' }}>Trait</th>
                      <th style={{ padding: '4px', textAlign: 'right' }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTraits.map(({ trait, count }) => (
                      <tr key={trait} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '4px' }}>{trait}</td>
                        <td style={{ padding: '4px', textAlign: 'right' }}>{count}</td>
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
