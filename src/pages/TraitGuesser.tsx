import React, { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../context/GameContext';
import type { TransformedCard, TransformedInvestigator } from '../types';
import './TraitGuesser.scss';

type Mode = 'Investigator' | 'Player Cards';

export default function TraitGuesser() {
  const { filteredCards, filteredInvestigators } = useGameContext();
  const [mode, setMode] = useState<Mode>('Investigator');
  const [trait, setTrait] = useState<string>('');
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<(TransformedCard | TransformedInvestigator)[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [win, setWin] = useState(false);
  const [cardGuesses, setCardGuesses] = useState<TransformedCard[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<(TransformedCard | TransformedInvestigator)[]>([]);
  const [gaveUp, setGaveUp] = useState(false);

  const investigatorTraits = useMemo(() => {
    const allTraits = new Set<string>();
    filteredInvestigators.forEach(inv => inv.traits.forEach(t => allTraits.add(t)));
    return Array.from(allTraits);
  }, [filteredInvestigators]);

  const cardTraits = useMemo(() => {
    const traitCountMap = new Map<string, Set<string>>();
    filteredCards.forEach(card => {
      card.traits.forEach(t => {
        if (!traitCountMap.has(t)) traitCountMap.set(t, new Set());
        traitCountMap.get(t)!.add(card.name);
      });
    });
    
    // Only return traits that have at least 3 unique card names
    return Array.from(traitCountMap.entries())
      .filter(([_, names]) => names.size >= 3)
      .map(([trait]) => trait);
  }, [filteredCards]);

  useEffect(() => {
    resetGame();
  }, [mode, filteredCards, filteredInvestigators]);

  const resetGame = () => {
    setWin(false);
    setGaveUp(false);
    setSearchValue('');
    setSuggestions([]);
    setSelectedIdx(-1);
    setCardGuesses([]);
    setWrongGuesses([]);

    if (mode === 'Investigator' && investigatorTraits.length > 0) {
      setTrait(investigatorTraits[Math.floor(Math.random() * investigatorTraits.length)]);
    } else if (mode === 'Player Cards' && cardTraits.length > 0) {
      setTrait(cardTraits[Math.floor(Math.random() * cardTraits.length)]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setSelectedIdx(-1);
    if (val.trim() === '') {
      setSuggestions([]);
    } else {
      if (mode === 'Investigator') {
        const filtered = filteredInvestigators.filter(c => 
          c.fullName.toLowerCase().includes(val.toLowerCase()) && 
          !wrongGuesses.some(g => g.id === c.id)
        ).slice(0, 5);
        setSuggestions(filtered);
      } else {
        const filtered = filteredCards.filter(c => 
          c.fullName.toLowerCase().includes(val.toLowerCase()) && 
          !cardGuesses.some(g => g.name === c.name) &&
          !wrongGuesses.some(g => g.id === c.id)
        ).slice(0, 5);
        setSuggestions(filtered);
      }
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

  const submitGuess = (item: TransformedCard | TransformedInvestigator) => {
    setSearchValue('');
    setSuggestions([]);
    setSelectedIdx(-1);

    const hasTrait = item.traits.includes(trait);

    if (mode === 'Investigator') {
      if (hasTrait) {
        setWin(true);
      } else {
        setWrongGuesses([item, ...wrongGuesses]);
      }
    } else {
      if (hasTrait) {
        const newCardGuesses = [...cardGuesses, item as TransformedCard];
        setCardGuesses(newCardGuesses);
        if (newCardGuesses.length === 3) {
          setWin(true);
        }
      } else {
        setWrongGuesses([item, ...wrongGuesses]);
      }
    }
  };

  return (
    <div className="trait-container">
      <div className="trait-header">
        <h1>Trait Guesser</h1>
        <div className="trait-mode-buttons">
          {(['Investigator', 'Player Cards'] as Mode[]).map(m => (
            <button 
              key={m} 
              className={`premium-btn trait-mode-button ${mode === m ? 'active' : 'inactive'}`}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel trait-panel">
        <div className="trait-name">
          {trait || 'Loading...'}
        </div>

        {win || gaveUp ? (
          <div className="fade-in trait-result">
            <h2 className={win ? 'win' : 'lose'}>
              {win ? 'Correct!' : 'Game Over'}
            </h2>
            {mode === 'Player Cards' && win && (
              <div className="trait-card-display">
                {cardGuesses.map(g => (
                  <div key={g.id} className="trait-card">
                    <img src={`https://arkhamdb.com${g.imagesrc}`} alt={g.name} />
                    <div className="card-name">{g.name}</div>
                  </div>
                ))}
              </div>
            )}
            <button className="premium-btn" onClick={resetGame} autoFocus>Play Again</button>
          </div>
        ) : (
          <div>
            {mode === 'Player Cards' && (
              <div className="trait-guessed-count">
                Guessed: {cardGuesses.length} / 3
              </div>
            )}
            
            <div className="trait-input-wrapper">
              <input
                type="text"
                className="premium-input"
                placeholder={mode === 'Investigator' ? "Type investigator name..." : "Type card name..."}
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              {suggestions.length > 0 && (
                <div className="trait-suggestions">
                  {suggestions.map((s, idx) => (
                    <div 
                      key={s.id} 
                      className={`trait-suggestion-item ${idx === selectedIdx ? 'selected' : ''}`}
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
                className="premium-btn trait-give-up" 
                onClick={() => setGaveUp(true)} 
              >
                Give Up
              </button>
            )}

            {cardGuesses.length > 0 && (
              <div className="trait-correct-guesses">
                {cardGuesses.map(g => (
                  <div key={g.id} className="trait-correct-badge">
                    {g.fullName}
                  </div>
                ))}
              </div>
            )}

            {wrongGuesses.length > 0 && (
              <div className="trait-wrong-guesses">
                {wrongGuesses.map(g => (
                  <div key={g.id} className="trait-wrong-badge">
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
