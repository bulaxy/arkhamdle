import React, { useState, useEffect } from 'react';
import { useGameContext } from '../context/GameContext';
import type { TransformedCard } from '../types';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Classic Mode</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Guess the Arkham Horror LCG Card</p>
      </div>

      {win || gaveUp ? (
        <div className="glass-panel fade-in" style={{ textAlign: 'center', borderColor: win ? 'var(--correct-color)' : 'var(--wrong-color)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ color: win ? 'var(--correct-color)' : 'var(--wrong-color)', marginBottom: '1rem' }}>
            {win ? 'Correct!' : 'Game Over'}
          </h2>
          <img src={`https://arkhamdb.com${answer?.imagesrc}`} alt={answer?.name} style={{ width: '100%', borderRadius: '0.5rem', marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>{answer?.fullName}</p>
          <button className="premium-btn" onClick={resetGame} autoFocus>Play Again</button>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '400px', position: 'relative', textAlign: 'center' }}>
          <input
            type="text"
            className="premium-input"
            placeholder="Type card name..."
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', marginTop: '0.5rem', zIndex: 10, textAlign: 'left' }}>
              {suggestions.map((s, idx) => (
                <div 
                  key={s.id} 
                  style={{ 
                    padding: '0.75rem 1rem', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid var(--glass-border)',
                    background: idx === selectedIdx ? 'rgba(255,255,255,0.1)' : 'transparent'
                  }}
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
              className="premium-btn" 
              onClick={() => setGaveUp(true)} 
              style={{ marginTop: '1rem', background: 'var(--wrong-color)', width: '100%' }}
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
            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'separate', borderSpacing: '0.5rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', fontSize: '0.875rem' }}>
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
                    <td style={{ padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '0.25rem', whiteSpace: 'nowrap' }}>{g.fullName}</td>
                    {ATTRIBUTES.map(attr => (
                      <td key={attr} className={getAttributeClass(g, attr)} style={{ padding: '0.5rem', borderRadius: '0.25rem', textAlign: 'center', transition: 'all 0.3s' }}>
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
