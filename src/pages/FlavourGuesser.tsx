import React, { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../context/GameContext';
import type { TransformedCard } from '../types';

export default function FlavourGuesser() {
  const { filteredCards } = useGameContext();
  
  const flavourCards = useMemo(() => {
    return filteredCards.filter(c => c.flavor && c.flavor.trim().length > 0);
  }, [filteredCards]);

  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<TransformedCard[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [win, setWin] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState<TransformedCard[]>([]);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    resetGame();
  }, [flavourCards]);

  const resetGame = () => {
    setWin(false);
    setGaveUp(false);
    setSearchValue('');
    setSuggestions([]);
    setSelectedIdx(-1);
    setWrongGuesses([]);
    if (flavourCards.length > 0) {
      setAnswer(flavourCards[Math.floor(Math.random() * flavourCards.length)]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setSelectedIdx(-1);
    if (val.trim() === '') {
      setSuggestions([]);
    } else {
      const filtered = flavourCards.filter(c => 
        c.fullName.toLowerCase().includes(val.toLowerCase()) && 
        !wrongGuesses.some(g => g.id === c.id)
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
    setSearchValue('');
    setSuggestions([]);
    setSelectedIdx(-1);

    if (card.id === answer?.id) {
      setWin(true);
    } else {
      setWrongGuesses([card, ...wrongGuesses]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Flavour Text Guesser</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Guess the card by its flavour text!</p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '2rem', padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '0.5rem', color: 'var(--text-secondary)' }}>
          "{answer?.flavor}"
        </div>

        {wrongGuesses.length >= 3 && !win && answer && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid var(--accent-color)', borderRadius: '0.5rem', color: 'var(--accent-color)', fontSize: '0.95rem' }}>
            💡 Hint — Class: {answer.class.join(', ')}
          </div>
        )}

        {win || gaveUp ? (
          <div className="fade-in">
            <h2 style={{ color: win ? 'var(--correct-color)' : 'var(--wrong-color)', marginBottom: '1rem' }}>
              {win ? 'Correct!' : 'Game Over'}
            </h2>
            <img src={`https://arkhamdb.com${answer?.imagesrc}`} alt={answer?.fullName} style={{ width: '100%', maxWidth: '300px', borderRadius: '0.5rem', marginBottom: '1.5rem' }} />
            <div>
              <button className="premium-btn" onClick={resetGame} autoFocus>Play Again</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ width: '100%', position: 'relative', marginBottom: '1rem' }}>
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
            </div>

            {wrongGuesses.length >= 5 && (
              <button 
                className="premium-btn" 
                onClick={() => setGaveUp(true)} 
                style={{ marginTop: '1rem', background: 'var(--wrong-color)', width: '100%' }}
              >
                Give Up
              </button>
            )}

            {wrongGuesses.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {wrongGuesses.map(g => (
                  <div key={g.id} style={{ padding: '0.25rem 0.5rem', background: 'var(--wrong-color)', color: 'white', borderRadius: '0.25rem', fontSize: '0.85rem' }}>
                    {g.fullName}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
