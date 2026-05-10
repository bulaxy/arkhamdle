import { useCallback, useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import type { TransformedCard, GameProps } from '../../types';
import { filterBySettings, filterForIconGuesser } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import { Eye, EyeOff } from 'lucide-react';
import './IconGuesser.scss';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

const SKILL_KEYS = ['willpower', 'intellect', 'combat', 'agility', 'wild'] as const;
type SkillKey = typeof SKILL_KEYS[number];

const SKILL_LABELS: Record<SkillKey, string> = {
  willpower: '👁️ Will',
  intellect: '📖 Int',
  combat: '👊 Com',
  agility: '🦶 Agi',
  wild: '⭐ Wild',
};

export default function IconGuesser({ onPlayAgainOverride }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [win, setWin] = useState(false);
  const [lose, setLose] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [skillGuesses, setSkillGuesses] = useState<Record<SkillKey, string>>({
    willpower: '',
    intellect: '',
    combat: '',
    agility: '',
    wild: '',
  });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Icon Guesser: Asset/Event/Skill only, NO deduplication
  const gameCards = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'iconGuesser');
    const filtered = filterForIconGuesser(baseFiltered);
    return filtered as TransformedCard[];
  }, [cards, settings]);

  const gameCardsWithPic = useMemo(() => {
    return gameCards.filter(c => c.imagesrc && c.imagesrc.trim().length > 0);
  }, [gameCards]);

  const resetGame = useCallback(() => {
    setWin(false);
    setLose(false);
    setSubmitted(false);
    setShowFull(false);
    setSkillGuesses({
      willpower: '',
      intellect: '',
      combat: '',
      agility: '',
      wild: '',
    });
    setImageLoaded(false);
    setAnswer(gameCardsWithPic[Math.floor(Math.random() * gameCardsWithPic.length)]);
  }, [gameCardsWithPic]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    settings.iconGuesser,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    cards,
    resetGame
  ]);

  const handleSkillChange = (skill: SkillKey, value: string) => {
    // Allow empty string or non-negative integers only
    if (value === '' || /^\d+$/.test(value)) {
      setSkillGuesses(prev => ({ ...prev, [skill]: value }));
    }
  };

  const submitGuess = () => {
    if (!answer || submitted) return;
    setSubmitted(true);

    const isCorrect = SKILL_KEYS.every(skill => {
      const guessed = skillGuesses[skill] === '' ? 0 : parseInt(skillGuesses[skill], 10);
      return guessed === (answer[skill] ?? 0);
    });

    if (isCorrect) {
      setWin(true);
      setShowFull(true);
    } else {
      setLose(true);
      setShowFull(true);
    }
  };

  return (
    <div className="icon-container">
      <div className="icon-header">
        <h1>Icon Guesser</h1>
        <div className="game-header-row">
          <p>Guess the skill icons on this card.</p>
          <p className="small-note">Note: Some cards may not have images available yet.</p>
          <GameInfoButton
            gameRules={{
              title: 'Icon Guesser',
              cardTypes: 'Asset, Event, Skill (only)',
              answerEvaluation: 'Must match all 5 skill icon values exactly',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: 'A card image is shown with the skill icons hidden behind a black box. Enter the values for each of the 5 skill icons (Willpower, Intellect, Combat, Agility, Wild). You only get 1 attempt!'
            }}
          />
        </div>
      </div>

      <div className="glass-panel icon-panel">
        {gameCardsWithPic.length < 10 ? (
          <div className="icon-error-panel">
            <p className="settings-text error-title">
              Not enough cards with pictures available ({gameCardsWithPic.length}/10 required).
            </p>
            <p className="settings-text error-desc">
              Please increase your card pool in the Settings (e.g., enable more expansion packs or card types) to play this mode.
            </p>
          </div>
        ) : (
          <>
            <div className="icon-image-container">
              {answer && answer.imagesrc ? (
                <>
                  {!imageLoaded && (
                    <div className="icon-image-loading">
                      <div className="spinner" />
                    </div>
                  )}
                  <img
                    src={`https://arkhamdb.com${answer.imagesrc}`}
                    alt="Guess the skill icons"
                    className={showFull ? 'icon-image-full' : 'icon-image-normal'}
                    style={{ opacity: imageLoaded ? 1 : 0 }}
                    onLoad={() => setImageLoaded(true)}
                  />
                  {!showFull && <div className="icon-blackbox" />}
                </>
              ) : (
                <div className="icon-image-unavailable">Image not available</div>
              )}
            </div>

            {(win || lose) && (
              <ResultPanel win={win} item={answer} onPlayAgain={onPlayAgainOverride || resetGame} className="icon-result" showImage={false}>
                {lose && answer && (
                  <div className="icon-guess-comparison">
                    <table className="icon-comparison-table">
                      <thead>
                        <tr>
                          <th>Skill</th>
                          <th>Your Guess</th>
                          <th>Correct</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SKILL_KEYS.map(skill => {
                          const guessed = skillGuesses[skill] === '' ? 0 : parseInt(skillGuesses[skill], 10);
                          const actual = answer[skill] ?? 0;
                          const isMatch = guessed === actual;
                          return (
                            <tr key={skill} className={isMatch ? 'match' : 'mismatch'}>
                              <td>{SKILL_LABELS[skill]}</td>
                              <td className={isMatch ? 'correct-value' : 'wrong-value'}>{guessed}</td>
                              <td className="correct-value">{actual}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="icon-result-buttons">
                  <button className="premium-btn icon-result-button" onClick={() => setShowFull(!showFull)}>
                    {showFull ? <><EyeOff size={18} /> Hide Full Picture</> : <><Eye size={18} /> Show Full Picture</>}
                  </button>
                </div>
              </ResultPanel>
            )}

            {!submitted && (
              <div className="icon-gameplay">
                <div className="icon-skill-inputs">
                  {SKILL_KEYS.map(skill => (
                    <div key={skill} className="icon-skill-field">
                      <label htmlFor={`skill-${skill}`}>{SKILL_LABELS[skill]}</label>
                      <input
                        id={`skill-${skill}`}
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        max="9"
                        value={skillGuesses[skill]}
                        onChange={(e) => handleSkillChange(skill, e.target.value)}
                        placeholder="0"
                        className="icon-skill-number"
                      />
                    </div>
                  ))}
                </div>

                <button
                  className="premium-btn icon-answer-btn"
                  onClick={submitGuess}
                >
                  Answer
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
