import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import type { TransformedCard } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, filterDuplicateOfCode, findDuplicateNames, getCardFactionColors, filterBySettings } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import './TraitGuesser.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

export default function TraitGuesser() {
  const { cards, settings } = useGameContext();
  const [trait, setTrait] = useState<string>('');
  const [win, setWin] = useState(false);
  const [correctGuesses, setCorrectGuesses] = useState<TransformedCard[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<TransformedCard[]>([]);
  const [gaveUp, setGaveUp] = useState(false);

  const allPossibleOptions = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'traitGuesser');
    const uniqueCards = filterDuplicateOfCode(baseFiltered);
    return uniqueCards.filter(c => settings.traitGuesser.typeFilters[c.typeName] ?? true);
  }, [cards, settings]);

  const gameTraits = useMemo(() => {
    const traitCountMap = new Map<string, Set<string>>();
    allPossibleOptions.forEach(item => {
      item.traits.forEach(t => {
        if (!traitCountMap.has(t)) traitCountMap.set(t, new Set());
        traitCountMap.get(t)!.add(item.name);
      });
    });
    
    // Filter based on settings min and max cards
    return Array.from(traitCountMap.entries())
      .filter(([, names]) => {
        const count = names.size;
        return count >= settings.traitGuesser.minCards && 
               (settings.traitGuesser.maxCards === 0 || count <= settings.traitGuesser.maxCards);
      })
      .map(([trait]) => trait);
  }, [allPossibleOptions, settings.traitGuesser.minCards, settings.traitGuesser.maxCards]);

  const gameOptions = useMemo(() => {
    return deduplicateByEvaluationCriteria(
      allPossibleOptions,
      GAME_EVALUATION_CRITERIA.traitGuesserCard // Use consistent criteria
    );
  }, [allPossibleOptions]);

  const dupeNames = useMemo(() => findDuplicateNames(gameOptions), [gameOptions]);

  const getDisplayText = (item: TransformedCard): string => {
    if (!dupeNames.has(item.name)) return item.name;
    return `${item.name} (${item.pack_name})`;
  };

  const possibleAnswers = useMemo(() => {
    if (!trait) return [];
    return gameOptions.filter(item => item.traits.includes(trait));
  }, [trait, gameOptions]);

  const requiredGuesses = useMemo(() => {
    const total = possibleAnswers.length;
    if (settings.traitGuesser.requirementType === 'All') return total;
    if (settings.traitGuesser.requirementType === 'Percentage') {
      return Math.max(1, Math.ceil(total * (settings.traitGuesser.requirementValue / 100)));
    }
    return Math.min(total, settings.traitGuesser.requirementValue);
  }, [possibleAnswers.length, settings]);

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setCorrectGuesses([]);
    setWrongGuesses([]);

    if (gameTraits.length > 0) {
      const selected = gameTraits[Math.floor(Math.random() * gameTraits.length)];
      console.log('[TraitGuesser] Trait:', selected, '| Possible answers:', gameOptions.filter(c => c.traits.includes(selected)).map(c => c.fullName));
      setTrait(selected);
    } else {
      setTrait('');
    }
  }, [gameTraits, gameOptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    settings.traitGuesser,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    cards,
    resetGame
  ]);

  const submitGuess = (item: TransformedCard) => {
    console.log('[TraitGuesser] Guess:', item);
    const hasTrait = item.traits.includes(trait);

    if (hasTrait) {
      if (!correctGuesses.find(c => c.name === item.name)) {
        const newGuesses = [...correctGuesses, item];
        setCorrectGuesses(newGuesses);
        if (newGuesses.length >= requiredGuesses) {
          setWin(true);
        }
      }
    } else {
      if (!wrongGuesses.find(c => c.name === item.name)) {
        setWrongGuesses([item, ...wrongGuesses]);
      }
    }
  };

  return (
    <div className="trait-container">
      <div className="trait-header">
        <h1>Trait Guesser</h1>
        <div className="game-header-row">
          <p>Guess the cards and investigators by their shared traits!</p>
          <GameInfoButton
            gameRules={{
              title: 'Trait Guesser',
              cardTypes: 'Configurable via Type Filters in Settings',
              answerEvaluation: 'Must match: Name, Pack, Class',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter, Type filters',
              howToPlay: 'A trait is shown (from any card based on filter) and name the specified number of cards (configurable in setting)'
            }}
          />
        </div>
      </div>

      <div className="glass-panel trait-panel">
        <div className="trait-name">
          {trait || 'No traits match your current filters. Try adjusting them in Settings.'}
        </div>

        {win || gaveUp ? (
          <ResultPanel win={win} item={null} onPlayAgain={resetGame} className="trait-result">
            <div className="trait-all-answers">
              <h3>All matches with "{trait}"</h3>
              <div className="trait-card-display">
                {possibleAnswers.map(ans => {
                  const isGuessed = correctGuesses.some(g => g.name === ans.name);
                  return (
                    <div 
                      key={ans.id} 
                      className={`trait-card ${isGuessed ? 'guessed' : 'missed'}`}
                    >
                      <img 
                        src={`https://arkhamdb.com${ans.imagesrc}`} 
                        alt={ans.name} 
                        className={isGuessed ? 'guessed' : ''}
                      />
                      <div className={`card-name ${isGuessed ? 'guessed' : ''}`}>
                        {ans.name}
                      </div>
                      {!isGuessed && (
                        <div className="missed-overlay">
                          MISSED
                        </div>
                      )}
                      {isGuessed && (
                        <div className="guessed-checkmark">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ResultPanel>
        ) : (
          <div>
            <div className="trait-guessed-count">
              Guessed: {correctGuesses.length} / {requiredGuesses}
            </div>
            
            <GuessInput
              options={gameOptions}
              guesses={[...correctGuesses, ...wrongGuesses]}
              onGuess={submitGuess}
              placeholder="Type name..."
              onGiveUp={() => setGaveUp(true)}
              giveUpThreshold={5}
              className="trait-input-wrapper"
              getDisplayText={getDisplayText}
              getOptionColors={getCardFactionColors}
            />

            {correctGuesses.length > 0 && (
              <div className="trait-correct-guesses">
                {correctGuesses.map(g => (
                  <div key={g.id} className="trait-correct-badge">
                    ✓ {g.fullName}
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
