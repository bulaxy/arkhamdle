import React, { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../context/GameContext';
import type { TransformedInvestigator } from '../types';

export default function StoryGuesser() {
  const { filteredInvestigators, settings } = useGameContext();

  const uniqueInvestigators = useMemo(() => {
    const unique: TransformedInvestigator[] = [];
    const seen = new Set<string>();
    
    for (const inv of filteredInvestigators) {
      if (!inv.back_flavor) continue;
      
      if (!seen.has(inv.back_flavor)) {
        seen.add(inv.back_flavor);
        unique.push(inv);
      }
    }
    return unique;
  }, [filteredInvestigators]);

  const [answer, setAnswer] = useState<TransformedInvestigator | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [win, setWin] = useState(false);
  const [suggestions, setSuggestions] = useState<TransformedInvestigator[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [wrongGuesses, setWrongGuesses] = useState<TransformedInvestigator[]>([]);
  const [scrambledFlavor, setScrambledFlavor] = useState('');
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (uniqueInvestigators.length > 0 && !answer) {
      setAnswer(uniqueInvestigators[Math.floor(Math.random() * uniqueInvestigators.length)]);
    }
  }, [uniqueInvestigators, answer]);

  useEffect(() => {
    if (!answer || !answer.back_flavor) {
      setScrambledFlavor('');
      return;
    }
    
    let text = answer.back_flavor.replace(/<\/?[^>]+(>|$)/g, ""); // strip HTML
    
    const scrambleWord = (word: string) => {
      const lettersMatch = word.match(/[a-zA-ZÀ-ÿ]+/); // include accents if any
      if (!lettersMatch) return word;
      
      const letters = lettersMatch[0].split('');
      if (letters.length <= 1) return word;
      
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      
      return word.replace(/[a-zA-ZÀ-ÿ]+/, letters.join(''));
    };

    if (settings.storyGuesserScrambleLetters) {
      text = text.split(/(\s+)/).map(part => {
        if (/\s+/.test(part)) return part;
        return scrambleWord(part);
      }).join('');
    }

    if (settings.storyGuesserScrambleWords) {
      const wordsAndSpaces = text.split(/(\s+)/);
      const justWords = wordsAndSpaces.filter(w => !/\s+/.test(w) && w.trim().length > 0);
      
      for (let i = justWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [justWords[i], justWords[j]] = [justWords[j], justWords[i]];
      }
      
      // Reconstruct with spaces
      let wordIdx = 0;
      text = wordsAndSpaces.map(part => {
        if (/\s+/.test(part)) return part;
        if (part.trim().length === 0) return part;
        return justWords[wordIdx++];
      }).join('');
    }

    if (settings.storyGuesserHideName) {
      // Split name by spaces and match each part, including possessives
      const nameParts = answer.name.split(' ');
      nameParts.forEach(part => {
        if (part.length < 2) return; // Skip very short parts
        const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escapedPart}(['’]s)?`, 'gi');
        text = text.replace(regex, '___');
      });
    }

    if (settings.storyGuesserSliceScale < 1) {
      const sliceIdx = Math.floor(text.length * settings.storyGuesserSliceScale);
      text = text.slice(0, sliceIdx) + '...';
    }

    setScrambledFlavor(text);
  }, [answer, settings.storyGuesserScrambleLetters, settings.storyGuesserScrambleWords, settings.storyGuesserHideName, settings.storyGuesserSliceScale]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setSelectedIdx(-1);
    if (val.trim() === '') {
      setSuggestions([]);
    } else {
      const filtered = uniqueInvestigators.filter(c => 
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
      } else {
        const exactMatch = uniqueInvestigators.find(
          c => c.fullName.toLowerCase() === searchValue.toLowerCase()
        );
        if (exactMatch) submitGuess(exactMatch);
      }
    }
  };

  const submitGuess = (card: TransformedInvestigator) => {
    if (wrongGuesses.some(g => g.id === card.id)) return;
    
    setSearchValue('');
    setSuggestions([]);
    setSelectedIdx(-1);
    
    if (card.id === answer?.id) {
      setWin(true);
    } else {
      setWrongGuesses([card, ...wrongGuesses]);
    }
  };

  const resetGame = () => {
    setWin(false);
    setGaveUp(false);
    setWrongGuesses([]);
    setAnswer(uniqueInvestigators[Math.floor(Math.random() * uniqueInvestigators.length)]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Story Guesser</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Guess the Investigator by their scrambled story!</p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
        {win || gaveUp ? (
          <div className="fade-in">
            <h2 style={{ color: win ? 'var(--correct-color)' : 'var(--wrong-color)', marginBottom: '1rem' }}>
              {win ? 'Correct!' : 'Game Over'}
            </h2>
            <img src={`https://arkhamdb.com${answer?.imagesrc}`} alt={answer?.fullName} style={{ width: '100%', maxWidth: '300px', borderRadius: '0.5rem', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>{answer?.fullName}</p>
            <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>
              {answer?.back_flavor?.replace(/<\/?[^>]+(>|$)/g, "")}
            </div>
            <button className="premium-btn" onClick={resetGame} autoFocus>Play Again</button>
          </div>
        ) : null}
          <div>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem', fontStyle: 'italic', padding: '1rem', background: 'var(--glass-bg)', borderRadius: '0.5rem', whiteSpace: 'pre-wrap' }}>
              {scrambledFlavor}
            </div>
            
            <div style={{ width: '100%', position: 'relative', marginBottom: '1rem' }}>
              <input
                type="text"
                className="premium-input"
                placeholder="Type investigator name..."
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
              
              {wrongGuesses.length >= 5 && !win && !gaveUp &&(
                <button 
                  className="premium-btn" 
                  onClick={() => setGaveUp(true)} 
                  style={{ marginTop: '1rem', background: 'var(--wrong-color)', width: '100%' }}
                >
                  Give Up
                </button>
              )}
            </div>
            
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
      </div>
    </div>
  );
}
