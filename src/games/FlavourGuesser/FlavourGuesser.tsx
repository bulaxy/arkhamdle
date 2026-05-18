import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStats } from '../../context/StatsContext';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import { filterForFlavourGuesser, filterDuplicateOfCode, deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, findDuplicateNames, getCardFactionColors, filterBySettings } from '../../services/CardFilter';
import { useGameSync } from '../../hooks/useGameSync';
import { getPackDisplayName } from '../../data/packStructure';
import { useGameContext } from '../../hooks/useGameContext';
import type { TransformedCard, GameProps } from '../../types';
import MultipleChoiceGrid from '../../components/MultipleChoiceGrid/MultipleChoiceGrid';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import './FlavourGuesser.scss';

export default function FlavourGuesser({ onPlayAgainOverride, streakModeName }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const { reportResult } = useStats();
  const modeName = 'Flavour Text Guesser';
  const maxGuesses = settings.flavourGuesser.maxGuesses ?? 6;

  const { guessableCards, answerPool } = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'flavourGuesser');
    // Apply type filters from settings
    const typeFiltered = filterForFlavourGuesser(baseFiltered, settings.flavourGuesser.typeFilters);
    // Remove duplicate_of_code cards
    const noDupes = filterDuplicateOfCode(typeFiltered);
    
    // Deduplicate by evaluation criteria for the dropdown
    const guessable = deduplicateByEvaluationCriteria(
      noDupes,
      GAME_EVALUATION_CRITERIA.flavourGuesser
    ) as TransformedCard[];

    // Only keep cards with flavour text for picking the answer
    const answers = guessable.filter(c => c.flavor && c.flavor.trim().length > 0);

    return { guessableCards: guessable, answerPool: answers };
  }, [cards, settings]);

  const { isClientWaiting, syncedData, syncData, isHost, isMultiplayer } = useGameSync<{ answerId: string; optionIds: string[] }>();

  const dupeNames = useMemo(() => findDuplicateNames(guessableCards), [guessableCards]);

  const getDisplayText = (card: TransformedCard): string => {
    if (!dupeNames.has(card.name)) return card.name;
    return `${card.name} (${card.pack_name})`;
  };

  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<TransformedCard[]>([]);
  const [win, setWin] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState<TransformedCard[]>([]);
  const [gaveUp, setGaveUp] = useState(false);
  const [hasReportedStreakLoss, setHasReportedStreakLoss] = useState(false);

  // Helper to shuffle array
  const shuffle = <T,>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setHasReportedStreakLoss(false);
    setWrongGuesses([]);

    if (isMultiplayer && !isHost) {
      return; // wait for sync
    }

    if (answerPool.length > 0) {
      const selected = answerPool[Math.floor(Math.random() * answerPool.length)];
      console.log('[FlavourGuesser] Answer:', selected);
      
      let newOptions: TransformedCard[] = [];

      // Generate Multiple Choice Options
      if (settings.flavourGuesser.inputMode === 'Multiple Choice') {
        const optionsSet = new Set<TransformedCard>();
        optionsSet.add(selected);
        
        const answerTraits = selected.traits || [];
        
        if (answerTraits.length > 0) {
          // 1. Try to find cards matching all traits
          let matchingAll = guessableCards.filter(c => 
            c.id !== selected.id && 
            c.name !== selected.name &&
            c.flavor !== selected.flavor &&
            c.traits && 
            answerTraits.every(t => c.traits!.includes(t))
          );
          matchingAll = shuffle(matchingAll);
          for (const card of matchingAll) {
            if (optionsSet.size >= 4) break;
            optionsSet.add(card);
          }

          // 2. If not enough, try finding cards matching at least 1 trait
          if (optionsSet.size < 4) {
            let matchingAny = guessableCards.filter(c => 
              c.id !== selected.id && 
              c.name !== selected.name &&
              c.flavor !== selected.flavor &&
              !optionsSet.has(c) &&
              c.traits && 
              answerTraits.some(t => c.traits!.includes(t))
            );
            matchingAny = shuffle(matchingAny);
            for (const card of matchingAny) {
              if (optionsSet.size >= 4) break;
              optionsSet.add(card);
            }
          }
        }

        // 3. Fallback to random cards
        if (optionsSet.size < 4) {
          const remaining = shuffle(guessableCards.filter(c => 
            !optionsSet.has(c) && 
            c.name !== selected.name && 
            c.flavor !== selected.flavor
          ));
          for (const card of remaining) {
            if (optionsSet.size >= 4) break;
            optionsSet.add(card);
          }
        }

        newOptions = shuffle(Array.from(optionsSet));
      }

      syncData({
        answerId: selected.id,
        optionIds: newOptions.map(c => c.id)
      });
    }
  }, [answerPool, guessableCards, settings.flavourGuesser.inputMode, isMultiplayer, isHost, syncData]);

  useEffect(() => {
    if (syncedData) {
      const syncedAnswer = cards.find(c => c.id === syncedData.answerId) || null;
      setAnswer(syncedAnswer);
      if (settings.flavourGuesser.inputMode === 'Multiple Choice') {
         setMultipleChoiceOptions(syncedData.optionIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as TransformedCard[]);
      }
    }
  }, [syncedData, cards, settings.flavourGuesser.inputMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    settings.flavourGuesser,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    cards,
    resetGame
  ]);

  const submitGuess = (card: TransformedCard) => {
    if (card.id === answer?.id) {
      setWin(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: true, wrongGuesses: wrongGuesses.length, isMultipleChoice: settings.flavourGuesser.inputMode === 'Multiple Choice' }
      }));
    } else {
      if(settings.flavourGuesser.inputMode === 'Multiple Choice'){
        setGaveUp(true);
        reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
        setHasReportedStreakLoss(true);
        window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
          detail: { mode: modeName, solved: false, isMultipleChoice: true }
        }));
      }else{
        const newWrong = [card, ...wrongGuesses];
        setWrongGuesses(newWrong);
        if (!hasReportedStreakLoss && newWrong.length >= maxGuesses) {
          reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
          setHasReportedStreakLoss(true);
          window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
            detail: { mode: modeName, solved: false, wrongGuesses: maxGuesses, isMultipleChoice: false }
          }));
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
        detail: { mode: modeName, solved: false, wrongGuesses: maxGuesses, isMultipleChoice: settings.flavourGuesser.inputMode === 'Multiple Choice' }
      }));
    }
  };

  return (
    <div className="flavour-container">
      <div className="flavour-header">
        <h1>Flavour Text Guesser</h1>
        <div className="game-header-row">
          <p>Immerse yourself in the story by identifying cards from their atmospheric flavour text.</p>
          <GameInfoButton
            gameRules={{
              title: 'Flavour Text Guesser',
              cardTypes: 'Asset, Event, Skill, Enemy, Treachery, Location, Story (Configurable via Type Filters in Settings)',
              answerEvaluation: 'Must match: Class, Pack, Name, XP',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter, Type filters',
              howToPlay: 'A quote or snippet of flavour text is presented. You must identify which card it belongs to. You can choose between Search-based entry or Multiple Choice in the settings. Faction and expansion pack hints unlock after several incorrect attempts.'
            }}
          />
        </div>
      </div>

      <div className="glass-panel flavour-panel">
        <div className="flavour-text">
          "{answer?.flavor}"
        </div>

        {settings.enableHints && wrongGuesses.length >= 3 && !win && answer && (
          <div className="flavour-hint">
            💡 Hint — Class: {answer.class.join(', ')}
            {wrongGuesses.length >= 5 && ` | Pack: ${getPackDisplayName(answer.pack_code, answer.pack_name)}`}
          </div>
        )}

        {isClientWaiting ? (
          <div className="waiting-for-host">Waiting for Host...</div>
        ) : win || gaveUp ? (
          <ResultPanel win={win} item={answer} onPlayAgain={onPlayAgainOverride || resetGame} className="flavour-result" />
        ) : (
          <div>
            {settings.flavourGuesser.inputMode === 'Multiple Choice' ? (
              <MultipleChoiceGrid
                options={multipleChoiceOptions}
                onSelect={(card) => submitGuess(card)}
                getLabel={(card) => getDisplayText(card)}
              />
            ) : (
              <GuessInput
                options={guessableCards}
                guesses={wrongGuesses}
                onGuess={submitGuess}
                placeholder="Type card name..."
                onGiveUp={handleGiveUp}
                giveUpThreshold={maxGuesses}
                className="flavour-input-wrapper"
                getDisplayText={getDisplayText}
                getOptionColors={getCardFactionColors}
              />
            )}

            {settings.flavourGuesser.inputMode !== 'Multiple Choice' && wrongGuesses.length > 0 && (
              <div className="flavour-wrong-guesses">
                {wrongGuesses.map(g => (
                  <div key={g.id} className="flavour-wrong-badge">
                    {g.fullName}
                  </div>
                ))}
              </div>
            )}

            {settings.flavourGuesser.inputMode === 'Multiple Choice' && (
              <div className="mt-1rem">
                <button className="premium-btn guess-give-up" onClick={handleGiveUp}>Give Up</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
