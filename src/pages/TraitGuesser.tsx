import React, { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../context/GameContext';
import type { TransformedCard, TransformedInvestigator } from '../types';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Trait Guesser</h1>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
          {(['Investigator', 'Player Cards'] as Mode[]).map(m => (
            <button 
              key={m} 
              className="premium-btn" 
              onClick={() => setMode(m)}
              style={{ background: mode === m ? 'var(--accent-color)' : 'var(--glass-bg)', opacity: mode === m ? 1 : 0.7 }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--accent-color)' }}>
          {trait || 'Loading...'}
        </div>

        {win || gaveUp ? (
          <div className="fade-in">
            <h2 style={{ color: win ? 'var(--correct-color)' : 'var(--wrong-color)', marginBottom: '1.5rem' }}>
              {win ? 'Correct!' : 'Game Over'}
            </h2>
            {mode === 'Player Cards' && win && (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {cardGuesses.map(g => (
                  <div key={g.id} style={{ textAlign: 'center' }}>
                    <img src={`https://arkhamdb.com${g.imagesrc}`} alt={g.name} style={{ width: '100px', borderRadius: '0.25rem' }} />
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{g.name}</div>
                  </div>
                ))}
              </div>
            )}
            <button className="premium-btn" onClick={resetGame} autoFocus>Play Again</button>
          </div>
        ) : (
          <div>
            {mode === 'Player Cards' && (
              <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Guessed: {cardGuesses.length} / 3
              </div>
            )}
            
            <div style={{ width: '100%', position: 'relative', marginBottom: '1rem' }}>
              <input
                type="text"
                className="premium-input"
                placeholder={mode === 'Investigator' ? "Type investigator name..." : "Type card name..."}
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
                style={{ marginBottom: '1rem', background: 'var(--wrong-color)', width: '100%' }}
              >
                Give Up
              </button>
            )}

            {cardGuesses.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {cardGuesses.map(g => (
                  <div key={g.id} style={{ padding: '0.25rem 0.5rem', background: 'var(--correct-color)', color: 'white', borderRadius: '0.25rem', fontSize: '0.85rem' }}>
                    {g.fullName}
                  </div>
                ))}
              </div>
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
