import { ChevronDown, ChevronUp } from "lucide-react";

type Difficulty = "Hard" | "Normal" | "Easy";

interface PicGuesserSectionProps {
  difficulty: Difficulty;
  isOpen: boolean;
  onToggle: () => void;
  onDifficultyChange: (diff: Difficulty) => void;
}

export default function PicGuesserSection({
  difficulty,
  isOpen,
  onToggle,
  onDifficultyChange,
}: PicGuesserSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Game: Pic Guesser</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content">
          <p className="settings-text">
            How much it zooms out each time you guess incorrectly.
          </p>
          <div className="button-row tight">
            {(["Hard", "Normal", "Easy"] as const).map((diff) => (
              <button
                key={diff}
                className={`premium-btn difficulty-btn ${difficulty === diff ? "active" : ""}`}
                onClick={() => onDifficultyChange(diff)}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
