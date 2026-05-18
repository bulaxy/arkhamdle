import { useCallback, useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import { useStats } from '../../context/StatsContext';
import type { TransformedCard, GameProps } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, findDuplicateNames, getCardFactionColors, filterDuplicateOfCode, filterBySettings } from '../../services/CardFilter';
import { useGameSync } from '../../hooks/useGameSync';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import '../../components/GuessGrid/GuessGrid.scss';
import './Investigatordle.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

const ATTRIBUTES = ['class', 'health', 'sanity', 'willpower', 'intellect', 'combat', 'agility', 'traits'] as const;


export default function Investigatordle({ onPlayAgainOverride, streakModeName }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const { reportResult } = useStats();
  const modeName = 'Investigatordle';
  const maxGuesses = settings.investigatordle.maxGuesses ?? 6;

  const { isClientWaiting, syncedData, syncData, isHost, isMultiplayer } = useGameSync<{ answerId: string; optionIds: string[] }>();

  const gameInvestigators = useMemo(() => {
    if (syncedData) {
      return syncedData.optionIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as TransformedCard[];
    }
    const baseFiltered = filterBySettings(cards, settings, 'investigatordle');
    const investigators = baseFiltered.filter(c => c.typeName === 'investigator');
    const noDupes = filterDuplicateOfCode(investigators);
    return deduplicateByEvaluationCriteria(
      noDupes,
      GAME_EVALUATION_CRITERIA.investigatordle
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, settings]);

  const dupeNames = useMemo(() => findDuplicateNames(gameInvestigators), [gameInvestigators]);

  const getDisplayText = (inv: TransformedCard): string => {
    if (!dupeNames.has(inv.name)) return inv.name;
    return `${inv.name} (${inv.pack_name})`;
  };

  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [guesses, setGuesses] = useState<TransformedCard[]>([]);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [hasReportedStreakLoss, setHasReportedStreakLoss] = useState(false);

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setHasReportedStreakLoss(false);
    setGuesses([]);

    if (isMultiplayer && !isHost) {
      return; // wait for sync
    }

    const newAnswer = gameInvestigators[Math.floor(Math.random() * gameInvestigators.length)];
    syncData({
      answerId: newAnswer?.id,
      optionIds: gameInvestigators.map(c => c.id)
    });
  }, [gameInvestigators, isMultiplayer, isHost, syncData]);

  useEffect(() => {
    if (syncedData) {
      const syncedAnswer = cards.find(c => c.id === syncedData.answerId) || null;
      setAnswer(syncedAnswer);
    }
  }, [syncedData, cards]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    settings.investigatordle,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    cards,
    resetGame
  ]);

  const submitGuess = (card: TransformedCard) => {
    console.log('[Investigatordle] Guess:', card);
    if (guesses.some(g => g.id === card.id)) return;
    if (card.id === answer?.id) {
      setGuesses([card, ...guesses]);
      setWin(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: true, guesses: guesses.length + 1 }
      }));
    } else {
      const newGuesses = [card, ...guesses];
      setGuesses(newGuesses);
      if (!hasReportedStreakLoss && newGuesses.length === maxGuesses) {
        reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
        setHasReportedStreakLoss(true);
      }
    }
  };

  const handleGiveUp = () => {
    setGaveUp(true);
    if (!hasReportedStreakLoss) {
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
      setHasReportedStreakLoss(true);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: false, guesses: maxGuesses }
      }));
    }
  };

  const getAttributeClass = (guess: TransformedCard, attr: typeof ATTRIBUTES[number]) => {
    if (!answer) return '';
    const ansVal = answer[attr];
    const guessVal = guess[attr];

    const ansArray = Array.isArray(ansVal) ? ansVal : [ansVal];
    const guessArray = Array.isArray(guessVal) ? guessVal : [guessVal];

    const common = ansArray.filter(el => guessArray.includes(el as never));
    const areEqual = ansArray.length === guessArray.length && common.length === guessArray.length;

    if (areEqual) return 'makeGreen';
    if (common.length > 0) return 'makeYellow';

    return 'makeRed';
  };

  // This was done this way as it was buggy with some mobile device not displaying the arrow correctly
  const getArrow = (guess: TransformedCard, attr: typeof ATTRIBUTES[number]) => {
    if (!answer) return '';
    if (!['health', 'sanity', 'agility', 'combat', 'intellect', 'willpower'].includes(attr)) return '';
    const ansVal = answer[attr];
    const guessVal = guess[attr];

    const ansArray = Array.isArray(ansVal) ? ansVal : [ansVal];
    const guessArray = Array.isArray(guessVal) ? guessVal : [guessVal];

    if ((ansArray[0] as number) < (guessArray[0] as number)) return ' ↓';
    if ((ansArray[0] as number) > (guessArray[0] as number)) return ' ↑';
    return '';
  };

  return (
    <div className="investigator-container">
      <div className="investigator-header">
        <h1>Investigatordle</h1>
        <div className="game-header-row">
          <p>Identify the investigator based on their stats, faction, and traits.</p>
          <GameInfoButton
            gameRules={{
              title: 'Investigatordle',
              cardTypes: 'Investigator (only)',
              answerEvaluation: 'Must match: Name, Stats, Health, Sanity, Traits',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: "Enter an investigator's name to see how their profile compares to the hidden target. Match stats (Willpower, Intellect, Combat, Agility), health, sanity, and traits. Arrows help you narrow down the exact numbers. Special investigators from certain campaigns may also be featured!"
            }}
          />
        </div>
      </div>

      {(isClientWaiting || !answer) ? (
        <div className="waiting-for-host">Waiting for Host...</div>
      ) : win || gaveUp ? (
        <ResultPanel win={win} item={answer} onPlayAgain={onPlayAgainOverride || resetGame} className="investigator-result-panel" />
      ) : (
        <div className="investigator-input-section">
          <GuessInput
            options={gameInvestigators}
            guesses={guesses}
            onGuess={submitGuess}
            placeholder="Type investigator name..."
            onGiveUp={handleGiveUp}
            giveUpThreshold={maxGuesses}
            getDisplayText={getDisplayText}
            getOptionColors={getCardFactionColors}
          />
          <div className="guess-limit-note">
            <span>Attempts: {guesses.length} / {maxGuesses}</span>
            {guesses.length >= maxGuesses - 2 && <span className="warning-text"> (Win streak lost if {maxGuesses}th guess is wrong)</span>}
          </div>
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
                  <th>Wil</th>
                  <th>Int</th>
                  <th>Cmb</th>
                  <th>Agi</th>
                  <th>Traits</th>
                </tr>
              </thead>
              <tbody>
                {guesses.map((g, i) => (
                  <tr key={`${g.id}-${i}`} className="fade-in">
                    <td className="investigator-guess-cell investigator-name-cell">{g.fullName}</td>
                    {ATTRIBUTES.map(attr => (
                      <td key={attr} className={`investigator-guess-cell ${getAttributeClass(g, attr)}`}>
                        {Array.isArray(g[attr]) && (g[attr] as (string | number)[]).length > 1 ? (g[attr] as (string | number)[]).join(', ') : (g[attr] as string | number)}
                        {getArrow(g, attr) && <span className="arrow-bold">{getArrow(g, attr)}</span>}
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
                    {Array.isArray(g[attr]) && (g[attr] as (string | number)[]).length > 1 ? (g[attr] as (string | number)[]).join(', ') : (g[attr] as string | number)}
                    {getArrow(g, attr) && <span className="arrow-bold">{getArrow(g, attr)}</span>}
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
