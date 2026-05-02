import { ChevronDown, ChevronUp } from "lucide-react";
import PackFilterControls from "./PackFilterControls";

interface StoryGuesserSectionProps {
  scrambleWords: boolean;
  scrambleLetters: boolean;
  hideName: boolean;
  sliceScale: number;
  isOpen: boolean;
  onToggle: () => void;
  onScrambleWordsChange: (value: boolean) => void;
  onScrambleLettersChange: (value: boolean) => void;
  onHideNameChange: (value: boolean) => void;
  onSliceScaleChange: (value: number) => void;
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
}

export default function StoryGuesserSection({
  scrambleWords,
  scrambleLetters,
  hideName,
  sliceScale,
  isOpen,
  onToggle,
  onScrambleWordsChange,
  onScrambleLettersChange,
  onHideNameChange,
  onSliceScaleChange,
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
}: StoryGuesserSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Story Guesser</h3>
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
            title="Card Filters"
          />

          <hr className="settings-divider" />

          <div>
            <h4>Game Rules</h4>
            <p className="settings-text">Configure how the text is scrambled.</p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={scrambleWords}
                onChange={(e) => onScrambleWordsChange(e.target.checked)}
              />
              <span className="bold">Scramble Word Order (Shuffle paragraphs)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={scrambleLetters}
                onChange={(e) => onScrambleLettersChange(e.target.checked)}
              />
              <span className="bold">Scramble Letters (Inside each word)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hideName}
                onChange={(e) => onHideNameChange(e.target.checked)}
              />
              <span className="bold">Hide Investigator Name in Text</span>
            </label>
            <div className="range-container mt-16">
              <span className="bold">Text Display Length: {Math.round(sliceScale * 100)}%</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={sliceScale}
                onChange={(e) => onSliceScaleChange(parseFloat(e.target.value))}
                className="settings-slider"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
