import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import { useStats } from '../../context/StatsContext';
import type { TransformedCard, GameProps } from '../../types';
import { filterBySettings, filterForIconGuesser } from '../../services/CardFilter';
import { useGameSync } from '../../hooks/useGameSync';
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

export default function IconGuesser({ onPlayAgainOverride, streakModeName }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const { reportResult } = useStats();
  const modeName = 'Icon Guesser';
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

  const { isClientWaiting, syncedData, syncData, isHost, isMultiplayer } = useGameSync<{ answerId: string }>();

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

    if (isMultiplayer && !isHost) {
      return; // wait for sync
    }

    if (gameCardsWithPic.length > 0) {
      const newAnswer = gameCardsWithPic[Math.floor(Math.random() * gameCardsWithPic.length)];
      syncData({ answerId: newAnswer.id });
    } else {
      syncData({ answerId: '' });
    }
  }, [gameCardsWithPic, isMultiplayer, isHost, syncData]);

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
      setSkillGuesses((prev: Record<SkillKey, string>) => ({ ...prev, [skill]: value }));
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
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: true }
      }));
    } else {
      setLose(true);
      setShowFull(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: false }
      }));
    }
  };

  return (
    <div className="icon-container">
      <div className="icon-header">
        <h1>Icon Guesser</h1>
        <div className="game-header-row">
          <div className="game-description">
            <p>Prove your familiarity with card commitment values by identifying hidden skill icons.</p>
            <p className="small-note">Note: Some cards may not have images available yet.</p>
          </div>
          <GameInfoButton
            gameRules={{
              title: 'Icon Guesser',
              cardTypes: 'Asset, Event, Skill (only)',
              answerEvaluation: 'Must match all 5 skill icon values exactly',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: 'A card is displayed with its skill icon panel obscured. Enter the exact number of icons for each of the five skills (Willpower, Intellect, Combat, Agility, and Wild). You have only one chance to get all five correct!'
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
        ) : isClientWaiting ? (
          <div className="waiting-for-host">Waiting for Host...</div>
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
                    className={`${showFull ? 'icon-image-full' : 'icon-image-normal'} opacity-transition ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
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
