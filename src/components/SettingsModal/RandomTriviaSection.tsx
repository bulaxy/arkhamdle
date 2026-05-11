import type { RandomTriviaSettings } from '../../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RandomTriviaSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  settings: RandomTriviaSettings;
  onChange: (settings: RandomTriviaSettings) => void;
}

export default function RandomTriviaSection({
  isOpen,
  onToggle,
  settings,
  onChange
}: RandomTriviaSectionProps) {
  
  const handleToggleMode = (mode: string) => {
    onChange({
      ...settings,
      enabledModes: {
        ...settings.enabledModes,
        [mode]: !settings.enabledModes[mode]
      }
    });
  };

  const GAME_MODES = [
    { key: 'StoryGuesser', label: 'Story Guesser' },
    { key: 'TraitGuesser', label: 'Trait Guesser' },
    { key: 'FlavourGuesser', label: 'Flavour Guesser' },
    { key: 'CampaignPackGuesser', label: 'Campaign Pack' },
    { key: 'GuessCardByTrait', label: 'Guess Trait' },
    { key: 'CountGuesser', label: 'Count Guesser' },
    { key: 'IconGuesser', label: 'Icon Guesser' },
    { key: 'TrueOrFalse', label: 'True Or False' },
    { key: 'WordleGame', label: 'Classic' },
    { key: 'PicGuesser', label: 'Pic Guesser' },
    { key: 'Investigatordle', label: 'Investigatordle' }
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={onToggle}>
        <h3>Random Trivia Settings</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content settings-column fade-in">
          <p className="settings-text">
            Select which game modes are included when playing Random Trivia.
          </p>

          <div className="pack-grid">
            {GAME_MODES.map((mode) => {
              const isActive = settings.enabledModes[mode.key] ?? false;
              return (
                <button
                  key={mode.key}
                  className={`pack-btn ${isActive ? "active" : ""}`}
                  onClick={() => handleToggleMode(mode.key)}
                  title={mode.label}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
