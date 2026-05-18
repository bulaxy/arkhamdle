import { useCallback, useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import { useStats } from '../../context/StatsContext';
import type { TransformedCard, GameProps } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, filterDuplicateOfCode, findDuplicateNames, filterForWordle, filterBySettings } from '../../services/CardFilter';
import { useGameSync } from '../../hooks/useGameSync';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import '../../components/GuessGrid/GuessGrid.scss';
import './WordleGame.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

const ATTRIBUTES = ['typeName', 'class', 'xp', 'traits', 'slot', 'cost', 'willpower', 'intellect', 'combat', 'agility', 'wild'] as const;


const parseSlot = (slotVal: string | undefined | null): string[] => {
  if (!slotVal) return [];
  return slotVal
    .split('.')
    .map(s => s.replace(/\bx2\b/gi, '').trim())
    .filter(Boolean);
};

export default function WordleGame({ onPlayAgainOverride, streakModeName }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const { reportResult } = useStats();
  const modeName = 'Classic Mode';
  const maxGuesses = settings.wordle.maxGuesses ?? 6;
  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [guesses, setGuesses] = useState<TransformedCard[]>([]);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [hasReportedStreakLoss, setHasReportedStreakLoss] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const { isClientWaiting, syncedData, syncData, isHost, isMultiplayer } = useGameSync<{ answerId: string; optionIds: string[] }>();

  const gameCards = useMemo(() => {
    if (syncedData) {
      return syncedData.optionIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as TransformedCard[];
    }
    const baseFiltered = filterBySettings(cards, settings, 'wordle');
    const noDupes = filterDuplicateOfCode(baseFiltered);
    const wordleCards = filterForWordle(noDupes);
    const deduped = deduplicateByEvaluationCriteria(
      wordleCards,
      GAME_EVALUATION_CRITERIA.wordle
    );
    return deduped as TransformedCard[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, settings]);

  // Pre-compute which names appear more than once for display text logic
  const dupeNames = useMemo(() => findDuplicateNames(gameCards), [gameCards]);

  const getDisplayText = (card: TransformedCard): string => {
    let text = card.name;
    if (dupeNames.has(card.name) && card.subname) {
      text += ` (${card.subname})`;
    }
    if (card.xp > 0) {
      text += ` (${card.xp})`;
    }
    return text;
  };

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setHasReportedStreakLoss(false);
    setDuplicateWarning(null);
    setGuesses([]);

    if (isMultiplayer && !isHost) {
      return; // wait for sync
    }

    const newAnswer = gameCards[Math.floor(Math.random() * gameCards.length)];
    syncData({
      answerId: newAnswer?.id,
      optionIds: gameCards.map(c => c.id)
    });
  }, [gameCards, isMultiplayer, isHost, syncData]);

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
    settings.wordle,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    cards,
    resetGame
  ]);

  const submitGuess = (card: TransformedCard) => {
    console.log('[WordleGame] Guess:', card);
    if (guesses.some(g => g.id === card.id)) return;
    setGuesses([card, ...guesses]);
    setDuplicateWarning(null);

    if (card.id === answer?.id) {
      setWin(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: true, guesses: guesses.length + 1 }
      }));
    } else {
      if (!hasReportedStreakLoss && guesses.length === maxGuesses - 1) { 
        reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
        setHasReportedStreakLoss(true);
      }
      if (answer) {
      // Check if all attributes match
      const allMatch = ATTRIBUTES.every(attr => {
        const ansVal = answer[attr];
        const guessVal = card[attr];

        const ansArray = Array.isArray(ansVal) ? [...ansVal].sort() : [ansVal];
        const guessArray = Array.isArray(guessVal) ? [...guessVal].sort() : [guessVal];

        if (ansArray.length !== guessArray.length) return false;
        return ansArray.every((el, idx) => el === guessArray[idx]);
      });

      if (allMatch) {
        setDuplicateWarning("There are more than 1 card that looks exactly like that");
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
        detail: { mode: modeName, solved: false, guesses: maxGuesses }
      }));
    }
  };



  const getAttributeClass = (guess: TransformedCard, attr: typeof ATTRIBUTES[number]) => {
    if (!answer) return '';
    const ansVal = answer[attr];
    const guessVal = guess[attr];

    if (attr === 'slot') {
      if (ansVal === guessVal) return 'makeGreen';

      const ansSlots = parseSlot(ansVal as string | undefined);
      const guessSlots = parseSlot(guessVal as string | undefined);

      const common = ansSlots.filter(s => guessSlots.includes(s));
      if (common.length > 0) return 'makeYellow';

      return 'makeRed';
    }

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
    if (!['xp', 'cost', 'wild', 'intellect', 'willpower', 'combat', 'agility'].includes(attr)) return '';
    const ansVal = answer[attr];
    const guessVal = guess[attr];

    const ansArray = Array.isArray(ansVal) ? ansVal : [ansVal];
    const guessArray = Array.isArray(guessVal) ? guessVal : [guessVal];

    if ((ansArray[0] as number) < (guessArray[0] as number)) return ' ↓';
    if ((ansArray[0] as number) > (guessArray[0] as number)) return ' ↑';
    return '';
  };

  return (
    <div className="wordle-container">
      <div className="wordle-header">
        <h1>Classic Mode</h1>
        <div className="game-header-row">
          <p>Deduce the identity of a player card using property-based feedback.</p>
          <GameInfoButton
            gameRules={{
              title: 'Classic Mode',
              cardTypes: 'Skill, Asset, Event, Weakness',
              answerEvaluation: 'Must match: Name, Subname, XP, Class',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: 'Start by typing any player card name. The feedback will indicate if the type, class, cost, and other stats match the target card. Green means an exact match, yellow means a partial match (like one shared class), and red means no match. Arrows indicate if the target\'s value is higher or lower.'
            }}
          />
        </div>
      </div>

      {(isClientWaiting || !answer) ? (
        <div className="waiting-for-host">Waiting for Host...</div>
      ) : win || gaveUp ? (
        <ResultPanel win={win} item={answer} onPlayAgain={onPlayAgainOverride || resetGame} className="wordle-result-panel" />
      ) : (
        <div className="wordle-input-section">
          <GuessInput
            options={gameCards}
            guesses={guesses}
            onGuess={submitGuess}
            placeholder="Type card name..."
            onGiveUp={handleGiveUp}
            giveUpThreshold={maxGuesses}
            getDisplayText={getDisplayText}
          />
          <div className="guess-limit-note">
            <span>Attempts: {guesses.length} / {maxGuesses}</span>
            {guesses.length >= maxGuesses - 2 && <span className="warning-text"> (Win streak lost if {maxGuesses}th guess is wrong)</span>}
          </div>
          {duplicateWarning && (
            <div className="wordle-warning fade-in">
              {duplicateWarning}
            </div>
          )}
        </div>
      )}

      {guesses.length > 0 && (
        <div className="wordle-guesses-wrapper">
          {/* Desktop Table View */}
          <div className="desktop-only wordle-table-container">
            <table className="wordle-table">
              <thead>
                <tr>
                  <th>Card</th>
                  <th>Type</th>
                  <th>Class</th>
                  <th>XP</th>
                  <th>Traits</th>
                  <th>Slot</th>
                  <th>Cost</th>
                  <th>Wil</th>
                  <th>Int</th>
                  <th>Cmb</th>
                  <th>Agi</th>
                  <th>Wld</th>
                </tr>
              </thead>
              <tbody>
                {guesses.map((g, i) => (
                  <tr key={`${g.id}-${i}`} className="fade-in">
                    <td className="wordle-guess-cell wordle-name-cell">{g.fullName}</td>
                    {ATTRIBUTES.map(attr => (
                      <td key={attr} className={`wordle-guess-cell ${getAttributeClass(g, attr)}`}>
                        {attr === 'slot' && !g[attr] ? 'None' : (Array.isArray(g[attr]) && g[attr].length > 1 ? g[attr].join(', ') : g[attr])}
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
              <div key={`${g.id}-${i}`} className="guess-card wordle-grid fade-in">
                <div className="guess-cell name-cell">
                  <span className="label">Card</span>
                  {g.fullName}
                </div>
                {ATTRIBUTES.map(attr => (
                  <div key={attr} className={`guess-cell ${getAttributeClass(g, attr)}`}>
                    <span className="label">{attr === 'typeName' ? 'Type' : attr}</span>
                    {attr === 'slot' && !g[attr] ? 'None' : (Array.isArray(g[attr]) && (g[attr] as (string | number)[]).length > 1 ? (g[attr] as (string | number)[]).join(', ') : (g[attr] as string | number))}
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
