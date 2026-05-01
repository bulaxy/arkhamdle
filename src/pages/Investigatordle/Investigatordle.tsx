import { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../context/GameContext';
import type { TransformedInvestigator } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, findDuplicateNames, getInvestigatorFactionColors, filterDuplicateOfCode } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import '../../components/GuessGrid/GuessGrid.scss';
import './Investigatordle.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

const ATTRIBUTES = ['faction_code', 'health', 'sanity', 'agility', 'combat', 'intellect', 'willpower', 'traits'] as const;

export default function Investigatordle() {
  const { filteredInvestigators } = useGameContext();

  const gameInvestigators = useMemo(() => {
    const noDupes = filterDuplicateOfCode(filteredInvestigators);
    return deduplicateByEvaluationCriteria(
      noDupes,
      GAME_EVALUATION_CRITERIA.investigatordle
    ) as TransformedInvestigator[];
  }, [filteredInvestigators]);

  const dupeNames = useMemo(() => findDuplicateNames(gameInvestigators), [gameInvestigators]);

  const getDisplayText = (inv: TransformedInvestigator): string => {
    if (!dupeNames.has(inv.name)) return inv.name;
    return `${inv.name} (${inv.subname})`;
  };

  const [answer, setAnswer] = useState<TransformedInvestigator | null>(null);
  const [guesses, setGuesses] = useState<TransformedInvestigator[]>([]);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (gameInvestigators.length > 0 && !answer) {
      setAnswer(gameInvestigators[Math.floor(Math.random() * gameInvestigators.length)]);
    }
  }, [gameInvestigators, answer]);

  const submitGuess = (card: TransformedInvestigator) => {
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

  const getAttributeClass = (guess: TransformedInvestigator, attr: typeof ATTRIBUTES[number]) => {
    if (!answer) return '';
    const ansVal = answer[attr];
    const guessVal = guess[attr];

    const ansArray = Array.isArray(ansVal) ? ansVal : [ansVal];
    const guessArray = Array.isArray(guessVal) ? guessVal : [guessVal];

    const common = ansArray.filter(el => guessArray.includes(el as never));
    const areEqual = ansArray.length === guessArray.length && common.length === guessArray.length;

    if (areEqual) return 'makeGreen';
    if (common.length > 0) return 'makeYellow';

    if (['health', 'sanity', 'agility', 'combat', 'intellect', 'willpower'].includes(attr)) {
      if ((ansArray[0] as number) < (guessArray[0] as number)) return 'makeRed yearBefore';
      if ((ansArray[0] as number) > (guessArray[0] as number)) return 'makeRed yearAfter';
    }
    return 'makeRed';
  };

  return (
    <div className="investigator-container">
      <div className="investigator-header">
        <h1>Investigatordle</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <p>Guess the Arkham Horror LCG Investigator</p>
          <GameInfoButton
            gameName="Investigatordle"
            gameRules={{
              title: 'Investigatordle',
              cardTypes: 'Investigator (only)',
              answerEvaluation: 'Must match: Name, Pack, Class',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
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
            getOptionColors={getInvestigatorFactionColors}
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
