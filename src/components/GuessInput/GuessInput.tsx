import React, { useState } from 'react';
import './GuessInput.scss';

export interface GuessInputProps<T> {
  options: T[];
  guesses: T[];
  onGuess: (guess: T) => void;
  placeholder?: string;
  onGiveUp?: () => void;
  giveUpThreshold?: number;
  className?: string;
  disabled?: boolean;
  /** Custom display text for each option in dropdown. Falls back to fullName. */
  getDisplayText?: (item: T) => string;
  /** Return an array of CSS color strings for faction/class background. 
   *  If omitted, no class color is shown. */
  getOptionColors?: (item: T) => string[];
}

/**
 * Build a CSS background style from an array of faction colors.
 * Single color = solid, 2 = 50/50 split, 3 = 33/33/33 split.
 */
function buildFactionGradient(colors: string[]): React.CSSProperties {
  if (colors.length === 0) return {};
  if (colors.length === 1) {
    return { background: colors[0] };
  }
  if (colors.length === 2) {
    return {
      background: `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`,
    };
  }
  return {
    background: `linear-gradient(to right, ${colors[0]} 33.33%, ${colors[1]} 33.33%, ${colors[1]} 66.67%, ${colors[2]} 66.67%)`,
  };
}

export default function GuessInput<T extends { id: string; fullName: string }>({
  options,
  guesses,
  onGuess,
  placeholder = "Type name...",
  onGiveUp,
  giveUpThreshold = 5,
  className = '',
  disabled = false,
  getDisplayText,
  getOptionColors,
}: GuessInputProps<T>) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const displayText = (item: T) => getDisplayText ? getDisplayText(item) : item.fullName;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setSelectedIdx(-1);
    if (val.trim() === '') {
      setSuggestions([]);
    } else {
      const filtered = options.filter(c => 
        c.fullName.toLowerCase().includes(val.toLowerCase()) && 
        !guesses.some(g => g.id === c.id)
      ).slice(0, 5);
      setSuggestions(filtered);
    }
  };

  const submit = (item: T) => {
    onGuess(item);
    setSearchValue('');
    setSuggestions([]);
    setSelectedIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIdx(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIdx(prev => (prev > 0 ? prev - 1 : prev));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && selectedIdx < suggestions.length) {
        submit(suggestions[selectedIdx]);
      } else if (suggestions.length === 1) {
        submit(suggestions[0]);
      } else {
        const exactMatch = options.find(
          c => c.fullName.toLowerCase() === searchValue.toLowerCase()
        );
        if (exactMatch && !guesses.some(g => g.id === exactMatch.id)) {
          submit(exactMatch);
        }
      }
    }
  };

  return (
    <div className={`guess-input-wrapper ${className}`}>
      <input
        type="text"
        className="premium-input guess-input-field"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      {suggestions.length > 0 && (
        <div className="guess-suggestions">
          {suggestions.map((s, idx) => {
            const colorStyle = getOptionColors
              ? buildFactionGradient(getOptionColors(s))
              : {};
            const hasColors = getOptionColors && getOptionColors(s).length > 0;
            return (
              <div 
                key={s.id} 
                className={`guess-suggestion-item ${idx === selectedIdx ? 'selected' : ''} ${hasColors ? 'has-faction-color' : ''}`}
                style={hasColors ? colorStyle : undefined}
                onClick={() => submit(s)}
                onMouseEnter={() => setSelectedIdx(idx)}
                onMouseLeave={() => setSelectedIdx(-1)}
              >
                {displayText(s)}
              </div>
            );
          })}
        </div>
      )}
      
      {onGiveUp && guesses.length >= giveUpThreshold && (
        <button 
          className="premium-btn guess-give-up" 
          onClick={onGiveUp} 
          disabled={disabled}
        >
          Give Up
        </button>
      )}
    </div>
  );
}
