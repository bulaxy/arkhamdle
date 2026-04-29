import React, { useState, useEffect } from 'react';
import { useGameContext } from '../context/GameContext';
import type { TransformedCard } from '../types';
import { Eye, EyeOff } from 'lucide-react';

export default function PicGuesser() {
  const { filteredCards, settings } = useGameContext();
  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [guesses, setGuesses] = useState<TransformedCard[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [win, setWin] = useState(false);
  const [suggestions, setSuggestions] = useState<TransformedCard[]>([]);
  const [sizeMultiplier, setSizeMultiplier] = useState(8);
  const [animation, setAnimation] = useState('');
  const [showFull, setShowFull] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [offsetX, setOffsetX] = useState(150); 
  const [offsetY, setOffsetY] = useState(150); 
  const [gaveUp, setGaveUp] = useState(false);

  let zoomOutRate = 1;
  if (settings.picGuesserDifficulty === 'Normal') zoomOutRate = 1.8;
  if (settings.picGuesserDifficulty === 'Easy') zoomOutRate = 2.5;

  useEffect(() => {
    if (filteredCards.length > 0 && !answer) {
      setAnswer(filteredCards[Math.floor(Math.random() * filteredCards.length)]);
      setOffsetX(Math.floor(Math.random() * 301) - 150);
      setOffsetY(Math.floor(Math.random() * 301));
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
        c.fullName.toLowerCase().includes(val.toLowerCase()) && 
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
    const newGuesses = [card, ...guesses];
    setGuesses(newGuesses);
    setSearchValue('');
    setSuggestions([]);
    setSelectedIdx(-1);
    
    if (card.id === answer?.id) {
      setWin(true);
      setShowFull(true);
    } else {
      setAnimation('shakeAnimation');
      setTimeout(() => setAnimation(''), 300);
      if (sizeMultiplier > 2) {
        setSizeMultiplier(prev => Math.max(2, prev - zoomOutRate));
      }
    }
  };

  const resetGame = () => {
    setWin(false);
    setGaveUp(false);
    setGuesses([]);
    setAnswer(filteredCards[Math.floor(Math.random() * filteredCards.length)]);
    setOffsetX(Math.floor(Math.random() * 301) - 150);
    setOffsetY(Math.floor(Math.random() * 251)+50);
    setSizeMultiplier(8);
    setShowFull(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Pic Guesser</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Identify the card from a zoomed-in image.</p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', overflow: 'hidden' }}>
        <div style={{ 
          width: '300px', 
          height: '420px', 
          overflow: 'hidden', 
          position: 'relative',
          borderRadius: '0.5rem',
          background: '#000',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {answer && answer.imagesrc ? (
             <img
              src={`https://arkhamdb.com${answer.imagesrc}`}
              alt="Guess this card"
              style={
                showFull ? {
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  margin: 0
                } : {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${sizeMultiplier}) translateX(${offsetX / sizeMultiplier}px) translateY(${offsetY / sizeMultiplier}px)`,
                  transition: 'transform 0.3s ease'
                }
              }
            />
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>Image not available</div>
          )}
        </div>

        {win || gaveUp ? (
          <div className="fade-in" style={{ width: '100%', textAlign: 'center' }}>
            <h2 style={{ color: win ? 'var(--correct-color)' : 'var(--wrong-color)', marginBottom: '0.5rem' }}>
              {win ? 'Correct!' : 'Game Over'}
            </h2>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>{answer?.fullName}</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button className="premium-btn" onClick={() => setShowFull(!showFull)} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                {showFull ? <><EyeOff size={18}/> Hide Full</> : <><Eye size={18}/> Show Full</>}
              </button>
              <button className="premium-btn" onClick={resetGame} autoFocus>Play Again</button>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', position: 'relative', textAlign: 'center' }} className={animation}>
            <input
              type="text"
              className="premium-input"
              placeholder="Type card name..."
              value={searchValue}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', marginBottom: '0.5rem', zIndex: 10, textAlign: 'left' }}>
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
                onClick={() => { setGaveUp(true); setShowFull(true); }} 
                style={{ marginTop: '1rem', background: 'var(--wrong-color)', width: '100%' }}
              >
                Give Up
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {guesses.map((g, i) => (
          <div key={`${g.id}-${i}`} className="glass-panel fade-in" style={{ padding: '1rem', borderColor: g.id === answer?.id ? 'var(--correct-color)' : 'var(--wrong-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{g.fullName}</span>
              {g.id === answer?.id ? <span style={{ color: 'var(--correct-color)' }}>Correct</span> : <span style={{ color: 'var(--wrong-color)' }}>Incorrect</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
