import { useCallback, useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import type { TransformedCard, GameProps } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, findDuplicateNames, getCardFactionColors, filterDuplicateOfCode, filterBySettings } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import '../../components/GuessGrid/GuessGrid.scss';
import './Investigatordle.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

const ATTRIBUTES = ['class', 'health', 'sanity', 'willpower', 'intellect', 'combat', 'agility', 'traits'] as const;


export default function Investigatordle({ onPlayAgainOverride }: GameProps = {}) {
  const { cards, settings } = useGameContext();

  const gameInvestigators = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'investigatordle');
    const investigators = baseFiltered.filter(c => c.typeName === 'investigator');
    const noDupes = filterDuplicateOfCode(investigators);
    return deduplicateByEvaluationCriteria(
      noDupes,
      GAME_EVALUATION_CRITERIA.investigatordle
    );
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

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setGuesses([]);
    setAnswer(gameInvestigators[Math.floor(Math.random() * gameInvestigators.length)]);
  }, [gameInvestigators]);

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
    setGuesses([card, ...guesses]);
    if (card.id === answer?.id) {
      setWin(true);
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

      {win || gaveUp ? (
        <ResultPanel win={win} item={answer} onPlayAgain={onPlayAgainOverride || resetGame} className="investigator-result-panel" />
      ) : (
        <div className="investigator-input-section">
          <GuessInput
            options={gameInvestigators}
            guesses={guesses}
            onGuess={submitGuess}
            placeholder="Type investigator name..."
            onGiveUp={() => setGaveUp(true)}
            giveUpThreshold={5}
            getDisplayText={getDisplayText}
            getOptionColors={getCardFactionColors}
          />
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
