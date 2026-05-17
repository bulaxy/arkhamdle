import { useCallback, useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import { useStats } from '../../context/StatsContext';
import type { TransformedCard, GameProps } from '../../types';
import { filterForPicGuesser, deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, getCardFactionColors, findDuplicateNames, filterDuplicateOfCode, filterBySettings } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import { Eye, EyeOff } from 'lucide-react';
import './PicGuesser.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import { getPackDisplayName } from '../../data/packStructure';

const OUTLIER_CARDS = ['Holy Rosary'];

export default function PicGuesser({ onPlayAgainOverride, streakModeName }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const { reportResult } = useStats();
  const modeName = 'Pic Guesser';
  const maxGuesses = settings.picGuesser.maxGuesses ?? 6;
  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [guesses, setGuesses] = useState<TransformedCard[]>([]);
  const [win, setWin] = useState(false);
  const [sizeMultiplier, setSizeMultiplier] = useState(8);
  const [animation, setAnimation] = useState('');
  const [showFull, setShowFull] = useState(false);
  const [offsetX, setOffsetX] = useState(150); 
  const [offsetY, setOffsetY] = useState(150); 
  const [gaveUp, setGaveUp] = useState(false);
  const [hasReportedStreakLoss, setHasReportedStreakLoss] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [outlierLogicUsed, setOutlierLogicUsed] = useState(false);

  // PicGuesser does NOT filter duplicate_of_code — exception per task spec
  const gameCards = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'picGuesser');
    const filtered = filterForPicGuesser(baseFiltered);
    // Apply type filters from settings
    const typeFiltered = filtered.filter(c => settings.picGuesser.typeFilters[c.typeName] ?? true);
    const noDupes = filterDuplicateOfCode(typeFiltered);
    const deduped = deduplicateByEvaluationCriteria(
      noDupes,
      GAME_EVALUATION_CRITERIA.picGuesser
    );
    return deduped as TransformedCard[];
  }, [cards, settings]);

  const gameCardsWithPic = useMemo(()=>{
    return gameCards.filter(c => c.imagesrc && c.imagesrc.trim().length > 0)
  }, [gameCards  ])
  const dupeNames = useMemo(() => findDuplicateNames(gameCards), [gameCards]);

  const getDisplayText = (card: TransformedCard): string => {
    if (!dupeNames.has(card.name)) return card.name;
    return `${card.name} (${getPackDisplayName(card.pack_code, card.pack_name)} - ${card.xp}XP)`;
  };

  let zoomOutRate = 1;
  if (settings.picGuesser.difficulty === 'Normal') zoomOutRate = 1.8;
  if (settings.picGuesser.difficulty === 'Easy') zoomOutRate = 2.5;

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setHasReportedStreakLoss(false);
    setOutlierLogicUsed(false);
    setGuesses([]);

    // setAnswer(gameCards.find(c => c.id === '01059'));
    setAnswer(gameCardsWithPic[Math.floor(Math.random() * gameCardsWithPic.length)]);
    setOffsetX(Math.floor(Math.random() * 301) - 150);
    setOffsetY(Math.floor(Math.random() * 251)+50);
    setSizeMultiplier(8);
    setShowFull(false);
    setImageLoaded(false);
  }, [gameCardsWithPic]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    settings.picGuesser,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    cards,
    resetGame
  ]);

  const submitGuess = (card: TransformedCard) => {
    console.log('[PicGuesser] Guess:', card);
    if (guesses.some(g => g.id === card.id)) return;
    const newGuesses = [card, ...guesses];
    setGuesses(newGuesses);
    
    const isOutlier = OUTLIER_CARDS.some(oc => oc.toLowerCase() === card.name.toLowerCase());
    const isNameMatch = card.name.toLowerCase() === answer?.name.toLowerCase();

    if (card.id === answer?.id) {
      setWin(true);
      setShowFull(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
    } else if (isOutlier && isNameMatch) {
      setWin(true);
      setShowFull(true);
      setOutlierLogicUsed(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
    } else {
      setAnimation('shakeAnimation');
      setTimeout(() => setAnimation(''), 300);
      if (sizeMultiplier > 2) {
        setSizeMultiplier(prev => Math.max(2, prev - zoomOutRate));
      }
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
    }
  };



  return (
    <div className="pic-container">
      <div className="pic-header">
        <h1>Pic Guesser</h1>
        <div className="game-header-row">
          <div className="game-description">  
            <p>Guess the card identity based on a zoomed-in fragment of its artwork.</p>
            <p className="small-note">Note: Some cards (mostly from newer expansions) may not have zoomed images supported yet.</p>
          </div>
          <GameInfoButton
            gameRules={{
              title: 'Pic Guesser',
              cardTypes: 'Asset, Event, Skill (only)',
              answerEvaluation: 'Must match: Class, Pack, Name, XP',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: 'A tiny portion of a card\'s illustration is displayed. With each incorrect guess, the view zooms out further, revealing more of the art. Difficulty settings affect how quickly it zooms out. Expansion pack hints appear after three wrong guesses.'
            }}
          />
        </div>
      </div>

      <div className="glass-panel pic-panel">
        {gameCardsWithPic.length < 10 ? (
          <div className="pic-error-panel">
            <p className="settings-text error-title">
              Not enough cards with pictures available ({gameCardsWithPic.length}/10 required).
            </p>
            <p className="settings-text error-desc">
              Please increase your card pool in the Settings (e.g., enable more expansion packs or card types) to play this mode.
            </p>
          </div>
        ) : (
          <>
            <div className="pic-image-container">
              {answer && answer.imagesrc ? (
                <>
                  {!imageLoaded && (
                    <div className="pic-image-loading">
                      <div className="spinner" />
                    </div>
                  )}
                  <img
                    src={`https://arkhamdb.com${answer.imagesrc}`}
                    alt="Guess this card"
                    className={`${showFull ? 'pic-image-full' : 'pic-image-zoomed'} opacity-transition ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={
                      !showFull ? {
                        transform: `scale(${sizeMultiplier}) translateX(${offsetX / sizeMultiplier}px) translateY(${offsetY / sizeMultiplier}px)`
                      } : undefined
                    }
                    onLoad={() => setImageLoaded(true)}
                  />
                </>
              ) : (
                <div className="pic-image-unavailable">Image not available</div>
              )}
            </div>

            {(win || gaveUp) && (
              <ResultPanel win={win} item={answer} onPlayAgain={onPlayAgainOverride || resetGame} className="pic-result" showImage={false}>
                {win && outlierLogicUsed && (
                  <div className="outlier-notice">
                    💡 Outlier logic applied. Both card got the same art work
                  </div>
                )}
                <div className="pic-result-buttons">
                  <button className="premium-btn pic-result-button" onClick={() => setShowFull(!showFull)}>
                    {showFull ? <><EyeOff size={18} /> Hide Full Picture</> : <><Eye size={18} /> Show Full Picture</>}
                  </button>
                </div>
              </ResultPanel>
            )}

            {settings.enableHints && guesses.length >= 3 && !win && answer && (
              <div className="pic-hint hint-text">
                💡 Hint — Pack: {getPackDisplayName(answer.pack_code, answer.pack_name)}
              </div>
            )}

            {!win && !gaveUp && (
              <div className="pic-gameplay">
                <GuessInput
                  options={gameCards}
                  guesses={guesses}
                  onGuess={submitGuess}
                  placeholder="Type card name..."
                  onGiveUp={handleGiveUp}
                  giveUpThreshold={maxGuesses}
                  getDisplayText={getDisplayText}
                  getOptionColors={getCardFactionColors}
                  className={`pic-input-wrapper ${animation}`}
                />
                
                <div className="pic-guesses-container">
                  {guesses.map((g, i) => {
                    const isOutlier = OUTLIER_CARDS.some(oc => oc.toLowerCase() === g.name.toLowerCase());
                    const isNameMatch = g.name.toLowerCase() === answer?.name.toLowerCase();
                    const isGuessCorrect = g.id === answer?.id || (isOutlier && isNameMatch);
                    const usedOutlierLogic = isGuessCorrect && g.id !== answer?.id;

                    return (
                      <div key={`${g.id}-${i}`} className={`glass-panel pic-guess-item fade-in ${isGuessCorrect ? 'correct' : 'incorrect'}`}>
                        <span>{g.fullName}</span>
                        <span className="result-text">
                          {isGuessCorrect
                            ? (usedOutlierLogic ? 'Basically Correct (Outlier Rule)' : 'Correct')
                            : 'Incorrect'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
