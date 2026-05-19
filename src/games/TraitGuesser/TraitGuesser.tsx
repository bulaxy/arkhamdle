import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import { useStats } from '../../context/StatsContext';
import type { TransformedCard, GameProps } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, filterDuplicateOfCode, findDuplicateNames, getCardFactionColors, filterBySettings } from '../../services/CardFilter';
import { useGameSync } from '../../hooks/useGameSync';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import './TraitGuesser.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

export default function TraitGuesser({ onPlayAgainOverride, streakModeName }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const { reportResult } = useStats();
  const modeName = 'Trait Guesser';
  const maxGuesses = settings.traitGuesser.maxGuesses ?? 6;
  const [trait, setTrait] = useState<string>('');
  const [win, setWin] = useState(false);
  const [correctGuesses, setCorrectGuesses] = useState<TransformedCard[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<TransformedCard[]>([]);
  const [gaveUp, setGaveUp] = useState(false);
  const [hasReportedStreakLoss, setHasReportedStreakLoss] = useState(false);

  const { isClientWaiting, syncedData, syncData, isHost, isMultiplayer } = useGameSync<{ answerId: string; optionIds: string[] }>();

  // 1. Generate local options (never depends on syncedData)
  const localPossibleOptions = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'traitGuesser');
    const uniqueCards = filterDuplicateOfCode(baseFiltered);
    return uniqueCards.filter(c => settings.traitGuesser.typeFilters[c.typeName] ?? true);
  }, [cards, settings]);

  // 2. Options list used in dropdown/gameplay (depends on syncedData for clients)
  const allPossibleOptions = useMemo(() => {
    if (syncedData?.optionIds) {
      return syncedData.optionIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as TransformedCard[];
    }
    return localPossibleOptions;
  }, [cards, syncedData, localPossibleOptions]);

  // 3. Local traits (independent of syncedData)
  const localTraits = useMemo(() => {
    const traitCountMap = new Map<string, Set<string>>();
    localPossibleOptions.forEach(item => {
      item.traits.forEach(t => {
        if (!traitCountMap.has(t)) traitCountMap.set(t, new Set());
        traitCountMap.get(t)!.add(item.name);
      });
    });
    
    return Array.from(traitCountMap.entries())
      .filter(([, names]) => {
        const count = names.size;
        return count >= settings.traitGuesser.minCards && 
               (settings.traitGuesser.maxCards === 0 || count <= settings.traitGuesser.maxCards);
      })
      .map(([trait]) => trait);
  }, [localPossibleOptions, settings.traitGuesser.minCards, settings.traitGuesser.maxCards]);


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
    setHasReportedStreakLoss(false);
    setCorrectGuesses([]);
    setWrongGuesses([]);

    if (isMultiplayer && !isHost) {
      return; // wait for sync
    }

    if (localTraits.length > 0) {
      const selected = localTraits[Math.floor(Math.random() * localTraits.length)];      
      syncData({
        answerId: selected, // answerId is the trait name here
        optionIds: localPossibleOptions.map(c => c.id)
      });
    } else {
      syncData({ answerId: '', optionIds: [] });
    }
  }, [localTraits, localPossibleOptions, isMultiplayer, isHost, syncData]);

  useEffect(() => {
    if (syncedData) {
      setTrait(syncedData.answerId);
    }
  }, [syncedData]);

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
          reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
          window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
            detail: { mode: modeName, solved: true, wrongGuesses: wrongGuesses.length }
          }));
        }
      }
    } else {
      if (!wrongGuesses.find(c => c.name === item.name)) {
        const newWrong = [item, ...wrongGuesses];
        setWrongGuesses(newWrong);
        if (!hasReportedStreakLoss && newWrong.length >= maxGuesses) {
          reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
          setHasReportedStreakLoss(true);
        }
      }
    }
  };

  const handleGiveUp = () => {
    setGaveUp(true);
    if (!hasReportedStreakLoss) {
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
      setHasReportedStreakLoss(true);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: false, wrongGuesses: maxGuesses }
      }));
    }
  };

  return (
    <div className="trait-container">
      <div className="trait-header">
        <h1>Trait Guesser</h1>
        <div className="game-header-row">
          <p>Identify cards that share a specific trait under various conditions.</p>
          <GameInfoButton
            gameRules={{
              title: 'Trait Guesser',
              cardTypes: 'Configurable via Type Filters in Settings',
              answerEvaluation: 'Must match: Name, Pack, Class',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter, Type filters',
              howToPlay: 'A trait (e.g., "Ally", "Cursed", or "Silver Twilight") is displayed. You must identify a specified number of cards that possess this trait. You can adjust the required count and difficulty in the settings.'
            }}
          />
        </div>
      </div>

      <div className="glass-panel trait-panel">
        {(isClientWaiting || !trait) ? (
          <div className="waiting-for-host">Waiting for Host...</div>
        ) : (
          <>
            <div className="trait-name">
              {trait || 'No traits match your current filters. Try adjusting them in Settings.'}
            </div>

            {win || gaveUp ? (
          <ResultPanel win={win} item={null} onPlayAgain={onPlayAgainOverride || resetGame} className="trait-result">
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
              onGiveUp={handleGiveUp}
              giveUpThreshold={maxGuesses}
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
          </>
        )}
      </div>
    </div>
  );
}
