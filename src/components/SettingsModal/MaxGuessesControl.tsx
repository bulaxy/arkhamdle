import type { BaseGameSettings } from "../../types";

interface MaxGuessesControlProps<T extends BaseGameSettings> {
  settings: T;
  onChange: (settings: T) => void;
}

const GUESS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function MaxGuessesControl<T extends BaseGameSettings>({ settings, onChange }: MaxGuessesControlProps<T>) {
  const current = settings.maxGuesses ?? 6;

  return (
    <div className="setting-item no-cursor stacked">
      <div className="setting-label">
        <span>Max Guesses Before Streak Loss: {current}</span>
        <span className="setting-description">
          How many wrong guesses are allowed before your win streak is broken
        </span>
      </div>
      <div className="setting-toggle-group">
        {GUESS_OPTIONS.map((n) => (
          <button
            key={n}
            className={`toggle-btn ${current === n ? "active" : ""}`}
            onClick={() => onChange({ ...settings, maxGuesses: n })}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
