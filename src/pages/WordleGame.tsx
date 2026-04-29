import React, { useState, useEffect } from 'react';
import { useGameContext } from '../context/GameContext';
import type { TransformedCard } from '../types';
import './Guesses.scss';
import './WordleGame.scss';

const ATTRIBUTES = ['typeName', 'class', 'xp', 'traits', 'slot', 'cost', 'agility', 'combat', 'intellect', 'wild', 'willpower'] as const;

export default function WordleGame() {
  const { filteredCards } = useGameContext();
  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [guesses, setGuesses] = useState<TransformedCard[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [win, setWin] = useState(false);
  const [suggestions, setSuggestions] = useState<TransformedCard[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (filteredCards.length > 0 && !answer) {
      setAnswer(filteredCards[Math.floor(Math.random() * filteredCards.length)]);
    }
  }, [filteredCards, answer]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setSelectedIdx(-1);
    if (val.trim() === '') {
      setSuggestions([]);
    } else {
      const filtered = filteredCards.filter(c => 
        c.name.toLowerCase().includes(val.toLowerCase()) && 
        !guesses.some(g => g.id === c.id)
      ).slice(0, 5);
      setSuggestions(filtered);
    }
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
        submitGuess(suggestions[selectedIdx]);
      } else if (suggestions.length === 1) {
        submitGuess(suggestions[0]);
      }
    }
  };

  const submitGuess = (card: TransformedCard) => {
    if (guesses.some(g => g.id === card.id)) return;
    setGuesses([card, ...guesses]);
    setSearchValue('');
    setSuggestions([]);
    setSelectedIdx(-1);
    if (card.id === answer?.id) {
      setWin(true);
    }
  };

  const resetGame = () => {
    setWin(false);
    setGaveUp(false);
    setGuesses([]);
    setAnswer(filteredCards[Math.floor(Math.random() * filteredCards.length)]);
  };

  const getAttributeClass = (guess: TransformedCard, attr: typeof ATTRIBUTES[number]) => {
    if (!answer) return '';
    const ansVal = answer[attr] as (string | number)[];
    const guessVal = guess[attr] as (string | number)[];

    const common = ansVal.filter(el => guessVal.includes(el as never));
    const areEqual = ansVal.length === guessVal.length && common.length === guessVal.length;

    if (areEqual) return 'makeGreen';
    if (common.length > 0) return 'makeYellow';

    if (['xp', 'cost', 'wild', 'intellect', 'willpower', 'combat', 'agility'].includes(attr)) {
      if ((ansVal[0] as number) < (guessVal[0] as number)) return 'makeRed yearBefore';
      if ((ansVal[0] as number) > (guessVal[0] as number)) return 'makeRed yearAfter';
    }
    return 'makeRed';
  };

  return (
    <div className="wordle-container">
      <div className="wordle-header">
        <h1>Classic Mode</h1>
        <p>Guess the Arkham Horror LCG Card</p>
      </div>

      {win || gaveUp ? (
        <div className="glass-panel fade-in wordle-result-panel" style={{ borderColor: win ? 'var(--correct-color)' : 'var(--wrong-color)' }}>
          <h2 className={win ? 'win' : 'lose'}>
            {win ? 'Correct!' : 'Game Over'}
          </h2>
          <img src={`https://arkhamdb.com${answer?.imagesrc}`} alt={answer?.name} />
          <p>{answer?.fullName}</p>
          <button className="premium-btn" onClick={resetGame} autoFocus>Play Again</button>
        </div>
      ) : (
        <div className="wordle-input-section">
          <input
            type="text"
            className="premium-input"
            placeholder="Type card name..."
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
          {suggestions.length > 0 && (
            <div className="wordle-suggestions">
              {suggestions.map((s, idx) => (
                <div 
                  key={s.id} 
                  className={`wordle-suggestion-item ${idx === selectedIdx ? 'selected' : ''}`}
                  onClick={() => submitGuess(s)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  onMouseLeave={() => setSelectedIdx(-1)}
                >
                  {s.fullName}
                </div>
              ))}
            </div>
          )}
          
          {guesses.length >= 5 && (
            <button 
              className="premium-btn wordle-give-up" 
              onClick={() => setGaveUp(true)} 
            >
              Give Up
            </button>
          )}
        </div>
      )}

      {guesses.length > 0 && (
        <div style={{ width: '100%', paddingBottom: '1rem' }}>
          {/* Desktop Table View */}
          <div className="desktop-only" style={{ overflowX: 'auto' }}>
            <table className="wordle-table">
              <thead>
                <tr>
                  <th>Card</th>
                  <th>Type</th>
                  <th>Class</th>
                  <th>XP</th>
                  <th>Traits</th>
                  <th>Slot</th>
                  <th>Cost</th>
                  <th>Agi</th>
                  <th>Cmb</th>
                  <th>Int</th>
                  <th>Wld</th>
                  <th>Wil</th>
                </tr>
              </thead>
              <tbody>
                {guesses.map((g, i) => (
                  <tr key={`${g.id}-${i}`} className="fade-in">
                    <td className="wordle-guess-cell wordle-name-cell">{g.fullName}</td>
                    {ATTRIBUTES.map(attr => (
                      <td key={attr} className={`wordle-guess-cell ${getAttributeClass(g, attr)}`}>
                        {Array.isArray(g[attr]) && g[attr].length > 1 ? g[attr].join(', ') : g[attr]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/iPad Grid View */}
          <div className="mobile-only guesses-container">
            {guesses.map((g, i) => (
              <div key={`${g.id}-${i}`} className="guess-card wordle-grid fade-in">
                <div className="guess-cell name-cell">
                  <span className="label">Card</span>
                  {g.fullName}
                </div>
                {ATTRIBUTES.map(attr => (
                  <div key={attr} className={`guess-cell ${getAttributeClass(g, attr)}`}>
                    <span className="label">{attr === 'typeName' ? 'Type' : attr}</span>
                    {Array.isArray(g[attr]) && (g[attr] as any[]).length > 1 ? (g[attr] as any[]).join(', ') : g[attr]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
