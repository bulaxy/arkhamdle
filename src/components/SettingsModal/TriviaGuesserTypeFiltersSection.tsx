import { ChevronDown, ChevronUp } from "lucide-react";
import PackFilterControls from "./PackFilterControls";

interface TriviaGuesserTypeFiltersSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  // Game Modes
  questionType: 'Mixed' | 'Only How Many' | 'Only Which Card';
  onQuestionTypeChange: (type: 'Mixed' | 'Only How Many' | 'Only Which Card') => void;
  inputMode: 'Multiple Choice' | 'Direct Input';
  onInputModeChange: (mode: 'Multiple Choice' | 'Direct Input') => void;
  poolFilter: 'Player Cards Only' | 'All Cards';
  onPoolFilterChange: (filter: 'Player Cards Only' | 'All Cards') => void;
  // Pack Filter Props
  packs: string[];
  useGlobalPackFilter: boolean;
  filteredPacks: string[];
  includeWeakness: boolean;
  includeSignatures: boolean;
  includeBondedCard: boolean;
  onUseGlobalPackFilterChange: (value: boolean) => void;
  onPackToggle: (pack: string) => void;
  onSelectAll: () => void;
  onFilterAll: () => void;
  onIncludeWeaknessChange: (value: boolean) => void;
  onIncludeSignaturesChange: (value: boolean) => void;
  onIncludeBondedCardChange: (value: boolean) => void;
}

export default function TriviaGuesserTypeFiltersSection({
  isOpen,
  onToggle,
  questionType,
  onQuestionTypeChange,
  inputMode,
  onInputModeChange,
  poolFilter,
  onPoolFilterChange,
  packs,
  useGlobalPackFilter,
  filteredPacks,
  includeWeakness,
  includeSignatures,
  includeBondedCard,
  onUseGlobalPackFilterChange,
  onPackToggle,
  onSelectAll,
  onFilterAll,
  onIncludeWeaknessChange,
  onIncludeSignaturesChange,
  onIncludeBondedCardChange,
}: TriviaGuesserTypeFiltersSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Trivia Guesser</h3>
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
            includeBondedCard={includeBondedCard}
            onUseGlobalFilterChange={onUseGlobalPackFilterChange}
            onPackToggle={onPackToggle}
            onSelectAll={onSelectAll}
            onFilterAll={onFilterAll}
            onIncludeWeaknessChange={onIncludeWeaknessChange}
            onIncludeSignaturesChange={onIncludeSignaturesChange}
            onIncludeBondedCardChange={onIncludeBondedCardChange}
            title="Card Filters"
          />

          <hr className="settings-divider" />

          <div>
            <h4>Game Mode</h4>
            <p className="settings-text mb-8">
              Select what type of trivia questions you want.
            </p>
            <div className="setting-toggle-group">
              <button
                className={`toggle-btn ${questionType === "Mixed" ? "active" : ""}`}
                onClick={() => onQuestionTypeChange("Mixed")}
              >
                Mixed
              </button>
              <button
                className={`toggle-btn ${questionType === "Only How Many" ? "active" : ""}`}
                onClick={() => onQuestionTypeChange("Only How Many")}
              >
                How Many of X
              </button>
              <button
                className={`toggle-btn ${questionType === "Only Which Card" ? "active" : ""}`}
                onClick={() => onQuestionTypeChange("Only Which Card")}
              >
                Which Card is X
              </button>
            </div>
          </div>
          
          <hr className="settings-divider" />

          <div>
            <h4>Input Mode</h4>
            <p className="settings-text mb-8">
              Select how you want to answer questions.
            </p>
            <div className="setting-toggle-group">
              <button
                className={`toggle-btn ${inputMode === "Multiple Choice" ? "active" : ""}`}
                onClick={() => onInputModeChange("Multiple Choice")}
              >
                Multiple Choice
              </button>
              <button
                className={`toggle-btn ${inputMode === "Direct Input" ? "active" : ""}`}
                onClick={() => onInputModeChange("Direct Input")}
              >
                Direct Input
              </button>
            </div>
          </div>
          
          <hr className="settings-divider" />

          <div>
            <h4>Card Pool Filtering</h4>
            <p className="settings-text mb-8">
              Select which cards to include in trivia questions.
            </p>
            <div className="setting-toggle-group">
              <button
                className={`toggle-btn ${poolFilter === "Player Cards Only" ? "active" : ""}`}
                onClick={() => onPoolFilterChange("Player Cards Only")}
              >
                Player Cards Only
              </button>
              <button
                className={`toggle-btn ${poolFilter === "All Cards" ? "active" : ""}`}
                onClick={() => onPoolFilterChange("All Cards")}
              >
                All Cards
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
