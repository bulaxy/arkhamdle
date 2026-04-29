import React, { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../context/GameContext';
import type { TransformedCard } from '../types';
import './FlavourGuesser.scss';

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
    <div className="flavour-container">
      <div className="flavour-header">
        <h1>Flavour Text Guesser</h1>
        <p>Guess the card by its flavour text!</p>
      </div>

      <div className="glass-panel flavour-panel">
        <div className="flavour-text">
          "{answer?.flavor}"
        </div>

        {wrongGuesses.length >= 3 && !win && answer && (
          <div className="flavour-hint">
            💡 Hint — Class: {answer.class.join(', ')}
          </div>
        )}

        {win || gaveUp ? (
          <div className="fade-in flavour-result">
            <h2 className={win ? 'win' : 'lose'}>
              {win ? 'Correct!' : 'Game Over'}
            </h2>
            <img src={`https://arkhamdb.com${answer?.imagesrc}`} alt={answer?.fullName} />
            <p>{answer?.fullName}</p>
            <div>
              <button className="premium-btn" onClick={resetGame} autoFocus>Play Again</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flavour-input-wrapper">
              <input
                type="text"
                className="premium-input"
                placeholder="Type card name..."
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              {suggestions.length > 0 && (
                <div className="flavour-suggestions">
                  {suggestions.map((s, idx) => (
                    <div 
                      key={s.id} 
                      className={`flavour-suggestion-item ${idx === selectedIdx ? 'selected' : ''}`}
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
                className="premium-btn flavour-give-up" 
                onClick={() => setGaveUp(true)} 
              >
                Give Up
              </button>
            )}

            {wrongGuesses.length > 0 && (
              <div className="flavour-wrong-guesses">
                {wrongGuesses.map(g => (
                  <div key={g.id} className="flavour-wrong-badge">
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
