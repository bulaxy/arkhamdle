import { ChevronDown, ChevronUp } from "lucide-react";

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
}: StoryGuesserSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Story Guesser</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content">
          <p className="settings-text">Configure how the text is scrambled.</p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={scrambleWords}
              onChange={(e) => onScrambleWordsChange(e.target.checked)}
            />
            <span>Scramble Word Order (Shuffle paragraphs)</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={scrambleLetters}
              onChange={(e) => onScrambleLettersChange(e.target.checked)}
            />
            <span>Scramble Letters (Inside each word)</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hideName}
              onChange={(e) => onHideNameChange(e.target.checked)}
            />
            <span>Hide Investigator Name in Text</span>
          </label>
          <div className="range-container">
            <span>Text Display Length: {Math.round(sliceScale * 100)}%</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={sliceScale}
              onChange={(e) => onSliceScaleChange(parseFloat(e.target.value))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
