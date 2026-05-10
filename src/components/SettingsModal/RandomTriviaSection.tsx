
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
    { key: 'CampaignPackGuesser', label: 'Campaign Pack Guesser' },
    { key: 'GuessCardByTrait', label: 'Guess Card By Trait' },
    { key: 'CountGuesser', label: 'Count Guesser' },
    { key: 'IconGuesser', label: 'Icon Guesser' },
    { key: 'WordleGame', label: 'Classic Mode (Wordle)' },
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
        <div className="settings-section-content fade-in">
          <p className="settings-text">
            Select which game modes are included when playing Random Trivia.
          </p>

          <div className="filter-grid">
            {GAME_MODES.map((mode) => (
              <label key={mode.key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.enabledModes[mode.key] ?? false}
                  onChange={() => handleToggleMode(mode.key)}
                />
                {mode.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
