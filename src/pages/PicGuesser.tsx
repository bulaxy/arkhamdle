import React, { useState, useEffect } from 'react';
import { useGameContext } from '../context/GameContext';
import type { TransformedCard } from '../types';
import { Eye, EyeOff } from 'lucide-react';
import './PicGuesser.scss';

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
    <div className="pic-container">
      <div className="pic-header">
        <h1>Pic Guesser</h1>
        <p>Identify the card from a zoomed-in image.</p>
      </div>

      <div className="glass-panel pic-panel">
        <div className="pic-image-container">
          {answer && answer.imagesrc ? (
             <img
              src={`https://arkhamdb.com${answer.imagesrc}`}
              alt="Guess this card"
              className={showFull ? 'pic-image-full' : 'pic-image-zoomed'}
              style={
                !showFull ? {
                  transform: `scale(${sizeMultiplier}) translateX(${offsetX / sizeMultiplier}px) translateY(${offsetY / sizeMultiplier}px)`
                } : {}
              }
            />
          ) : (
            <div className="pic-image-unavailable">Image not available</div>
          )}
        </div>

        {win || gaveUp ? (
          <div className="fade-in pic-result">
            <h2 className={win ? 'win' : 'lose'}>
              {win ? 'Correct!' : 'Game Over'}
            </h2>
            <p>{answer?.fullName}</p>
            <div className="pic-result-buttons">
              <button className="premium-btn pic-result-button" onClick={() => setShowFull(!showFull)}>
                {showFull ? <><EyeOff size={18}/> Hide Full</> : <><Eye size={18}/> Show Full</>}
              </button>
              <button className="premium-btn" onClick={resetGame} autoFocus>Play Again</button>
            </div>
          </div>
        ) : (
          <div className={`pic-input-wrapper ${animation}`}>
            <input
              type="text"
              className="premium-input"
              placeholder="Type card name..."
              value={searchValue}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
            {suggestions.length > 0 && (
              <div className="pic-suggestions">
                {suggestions.map((s, idx) => (
                  <div 
                    key={s.id} 
                    className={`pic-suggestion-item ${idx === selectedIdx ? 'selected' : ''}`}
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
                className="premium-btn pic-give-up" 
                onClick={() => { setGaveUp(true); setShowFull(true); }} 
              >
                Give Up
              </button>
            )}
          </div>
        )}
      </div>

      <div className="pic-guesses-container">
        {guesses.map((g, i) => (
          <div key={`${g.id}-${i}`} className={`glass-panel pic-guess-item fade-in ${g.id === answer?.id ? 'correct' : 'incorrect'}`}>
            <span>{g.fullName}</span>
            <span className="result-text">{g.id === answer?.id ? 'Correct' : 'Incorrect'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
