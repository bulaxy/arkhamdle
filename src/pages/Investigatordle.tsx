import React, { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../context/GameContext';
import type { TransformedInvestigator } from '../types';
import './Guesses.scss';
import './Investigatordle.scss';

const ATTRIBUTES = ['faction_code', 'health', 'sanity', 'agility', 'combat', 'intellect', 'willpower', 'traits'] as const;

export default function Investigatordle() {
  const { filteredInvestigators } = useGameContext();

  const uniqueInvestigators = useMemo(() => {
    const unique: TransformedInvestigator[] = [];
    const seen = new Set<string>();
    
    for (const inv of filteredInvestigators) {
      const statsKey = JSON.stringify([
        inv.faction_code,
        inv.health,
        inv.sanity,
        inv.agility,
        inv.combat,
        inv.intellect,
        inv.willpower,
        [...inv.traits].sort()
      ]);
      
      if (!seen.has(statsKey)) {
        seen.add(statsKey);
        unique.push(inv);
      }
    }
    return unique;
  }, [filteredInvestigators]);

  const [answer, setAnswer] = useState<TransformedInvestigator | null>(null);
  const [guesses, setGuesses] = useState<TransformedInvestigator[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [win, setWin] = useState(false);
  const [suggestions, setSuggestions] = useState<TransformedInvestigator[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (uniqueInvestigators.length > 0 && !answer) {
      setAnswer(uniqueInvestigators[Math.floor(Math.random() * uniqueInvestigators.length)]);
    }
  }, [uniqueInvestigators, answer]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setSelectedIdx(-1);
    if (val.trim() === '') {
      setSuggestions([]);
    } else {
      const filtered = uniqueInvestigators.filter(c => 
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
      } else {
        const exactMatch = uniqueInvestigators.find(
          c => c.fullName.toLowerCase() === searchValue.toLowerCase()
        );
        if (exactMatch) submitGuess(exactMatch);
      }
    }
  };

  const submitGuess = (card: TransformedInvestigator) => {
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
    setAnswer(uniqueInvestigators[Math.floor(Math.random() * uniqueInvestigators.length)]);
  };

  const getAttributeClass = (guess: TransformedInvestigator, attr: typeof ATTRIBUTES[number]) => {
    if (!answer) return '';
    const ansVal = answer[attr] as (string | number)[];
    const guessVal = guess[attr] as (string | number)[];

    const common = ansVal.filter(el => guessVal.includes(el as never));
    const areEqual = ansVal.length === guessVal.length && common.length === guessVal.length;

    if (areEqual) return 'makeGreen';
    if (common.length > 0) return 'makeYellow';

    if (['health', 'sanity', 'agility', 'combat', 'intellect', 'willpower'].includes(attr)) {
      if ((ansVal[0] as number) < (guessVal[0] as number)) return 'makeRed yearBefore';
      if ((ansVal[0] as number) > (guessVal[0] as number)) return 'makeRed yearAfter';
    }
    return 'makeRed';
  };

  return (
    <div className="investigator-container">
      <div className="investigator-header">
        <h1>Investigatordle</h1>
        <p>Guess the Arkham Horror LCG Investigator</p>
      </div>

      {win || gaveUp ? (
        <div className="glass-panel fade-in investigator-result-panel" style={{ borderColor: win ? 'var(--correct-color)' : 'var(--wrong-color)' }}>
          <h2 className={win ? 'win' : 'lose'}>
            {win ? 'Correct!' : 'Game Over'}
          </h2>
          <img src={`https://arkhamdb.com${answer?.imagesrc}`} alt={answer?.fullName} />
          <p>{answer?.fullName}</p>
          <button className="premium-btn" onClick={resetGame} autoFocus>Play Again</button>
        </div>
      ) : (
        <div className="investigator-input-section">
          <input
            type="text"
            className="premium-input"
            placeholder="Type investigator name..."
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
          {suggestions.length > 0 && (
            <div className="investigator-suggestions">
              {suggestions.map((s, idx) => (
                <div 
                  key={s.id} 
                  className={`investigator-suggestion-item ${idx === selectedIdx ? 'selected' : ''}`}
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
              className="premium-btn investigator-give-up" 
              onClick={() => setGaveUp(true)} 
            >
              Give Up
            </button>
          )}
        </div>
      )}

      {guesses.length > 0 && (
        <div className="investigator-guesses">
          {/* Desktop Table View */}
          <div className="desktop-only">
            <table className="investigator-table">
              <thead>
                <tr>
                  <th>Investigator</th>
                  <th>Faction</th>
                  <th>Health</th>
                  <th>Sanity</th>
                  <th>Agi</th>
                  <th>Cmb</th>
                  <th>Int</th>
                  <th>Wil</th>
                  <th>Traits</th>
                </tr>
              </thead>
              <tbody>
                {guesses.map((g, i) => (
                  <tr key={`${g.id}-${i}`} className="fade-in">
                    <td className="investigator-guess-cell investigator-name-cell">{g.fullName}</td>
                    {ATTRIBUTES.map(attr => (
                      <td key={attr} className={`investigator-guess-cell ${getAttributeClass(g, attr)}`}>
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
              <div key={`${g.id}-${i}`} className="guess-card investigator-grid fade-in">
                <div className="guess-cell name-cell">
                  <span className="label">Investigator</span>
                  {g.fullName}
                </div>
                {ATTRIBUTES.map(attr => (
                  <div key={attr} className={`guess-cell ${getAttributeClass(g, attr)}`}>
                    <span className="label">{attr.replace('_', ' ')}</span>
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
