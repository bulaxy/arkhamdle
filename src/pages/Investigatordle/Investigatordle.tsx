import { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../context/GameContext';
import type { TransformedCard } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, findDuplicateNames, getCardFactionColors, filterDuplicateOfCode } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import '../../components/GuessGrid/GuessGrid.scss';
import './Investigatordle.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

const ATTRIBUTES = ['class', 'health', 'sanity', 'agility', 'combat', 'intellect', 'willpower', 'traits'] as const;

export default function Investigatordle() {
  const { filteredCards } = useGameContext();

  const gameInvestigators = useMemo(() => {
    const investigators = filteredCards.filter(c => c.typeName === 'investigator');
    const noDupes = filterDuplicateOfCode(investigators);
    return deduplicateByEvaluationCriteria(
      noDupes,
      GAME_EVALUATION_CRITERIA.investigatordle
    );
  }, [filteredCards]);

  const dupeNames = useMemo(() => findDuplicateNames(gameInvestigators), [gameInvestigators]);

  const getDisplayText = (inv: TransformedCard): string => {
    if (!dupeNames.has(inv.name)) return inv.name;
    return `${inv.name} (${inv.subname})`;
  };

  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [guesses, setGuesses] = useState<TransformedCard[]>([]);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (gameInvestigators.length > 0 && !answer) {
      const selected = gameInvestigators[Math.floor(Math.random() * gameInvestigators.length)];
      console.log('[Investigatordle] Answer:', selected);
      setAnswer(selected);
    }
  }, [gameInvestigators, answer]);

  const submitGuess = (card: TransformedCard) => {
    console.log('[Investigatordle] Guess:', card);
    if (guesses.some(g => g.id === card.id)) return;
    setGuesses([card, ...guesses]);
    if (card.id === answer?.id) {
      setWin(true);
    }
  };

  const resetGame = () => {
    setWin(false);
    setGaveUp(false);
    setGuesses([]);
    setAnswer(gameInvestigators[Math.floor(Math.random() * gameInvestigators.length)]);
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
          <p>Guess the Arkham Horror LCG Investigator</p>
          <GameInfoButton
            gameName="Investigatordle"
            gameRules={{
              title: 'Investigatordle',
              cardTypes: 'Investigator (only)',
              answerEvaluation: 'Must match: Name, Pack, Class',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: "Similar to wordle game, but investigator only.\nNote: Cards like TCU's Disappearance at the Twilight Estate's investigators and Yithian Body are all included if other filters allow."
            }}
          />
        </div>
      </div>

      {win || gaveUp ? (
        <ResultPanel win={win} item={answer} onPlayAgain={resetGame} className="investigator-result-panel" />
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
                    {Array.isArray(g[attr]) && (g[attr] as any[]).length > 1 ? (g[attr] as any[]).join(', ') : g[attr]}
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
