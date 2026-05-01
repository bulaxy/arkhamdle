import { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../context/GameContext';
import type { TransformedCard } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, filterDuplicateOfCode, findDuplicateNames } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import '../../components/GuessGrid/GuessGrid.scss';
import './WordleGame.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

const ATTRIBUTES = ['typeName', 'class', 'xp', 'traits', 'slot', 'cost', 'agility', 'combat', 'intellect', 'wild', 'willpower'] as const;

export default function WordleGame() {
  const { filteredCards } = useGameContext();
  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [guesses, setGuesses] = useState<TransformedCard[]>([]);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const gameCards = useMemo(() => {
    const noDupes = filterDuplicateOfCode(filteredCards);
    const deduped = deduplicateByEvaluationCriteria(
      noDupes,
      GAME_EVALUATION_CRITERIA.wordle
    );
    return deduped as TransformedCard[];
  }, [filteredCards]);

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

  useEffect(() => {
    if (gameCards.length > 0 && !answer) {
      setAnswer(gameCards[Math.floor(Math.random() * gameCards.length)]);
    }
  }, [gameCards, answer]);

  const submitGuess = (card: TransformedCard) => {
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
    setAnswer(gameCards[Math.floor(Math.random() * gameCards.length)]);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <p>Guess the Arkham Horror LCG Card</p>
          <GameInfoButton
            gameName="Wordle"
            gameRules={{
              title: 'Classic Mode',
              cardTypes: 'Skill, Asset, Event, Weakness',
              answerEvaluation: 'Must match: Name, Subname, XP, Class',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
            }}
          />
        </div>
      </div>

      {win || gaveUp ? (
        <ResultPanel win={win} item={answer} onPlayAgain={resetGame} className="wordle-result-panel" />
      ) : (
        <div className="wordle-input-section">
          <GuessInput
            options={gameCards}
            guesses={guesses}
            onGuess={submitGuess}
            placeholder="Type card name..."
            onGiveUp={() => setGaveUp(true)}
            giveUpThreshold={5}
            getDisplayText={getDisplayText}
          />
        </div>
      )}

      {guesses.length > 0 && (
        <div style={{ width: '100%', paddingBottom: '1rem' }}>
          {/* Desktop Table View */}
          <div className="desktop-only" style={{ overflowX: 'auto' }}>
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
                  <th>Agi</th>
                  <th>Cmb</th>
                  <th>Int</th>
                  <th>Wld</th>
                  <th>Wil</th>
                </tr>
              </thead>
              <tbody>
                {guesses.map((g, i) => (
                  <tr key={`${g.id}-${i}`} className="fade-in">
                    <td className="wordle-guess-cell wordle-name-cell">{g.fullName}</td>
                    {ATTRIBUTES.map(attr => (
                      <td key={attr} className={`wordle-guess-cell ${getAttributeClass(g, attr)}`}>
                        {Array.isArray(g[attr]) && g[attr].length > 1 ? g[attr].join(', ') : g[attr]}
                        {getArrow(g, attr) && <span style={{ fontWeight: 'bold' }}>{getArrow(g, attr)}</span>}
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
                    {Array.isArray(g[attr]) && (g[attr] as any[]).length > 1 ? (g[attr] as any[]).join(', ') : g[attr]}
                    {getArrow(g, attr) && <span style={{ fontWeight: 'bold' }}>{getArrow(g, attr)}</span>}
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
