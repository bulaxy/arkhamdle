import { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../context/GameContext';
import type { TransformedCard } from '../../types';
import { filterForPicGuesser, deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, getCardFactionColors, findDuplicateNames, filterDuplicateOfCode, filterBySettings } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import { Eye, EyeOff } from 'lucide-react';
import './PicGuesser.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

export default function PicGuesser() {
  const { cards, settings } = useGameContext();
  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [guesses, setGuesses] = useState<TransformedCard[]>([]);
  const [win, setWin] = useState(false);
  const [sizeMultiplier, setSizeMultiplier] = useState(8);
  const [animation, setAnimation] = useState('');
  const [showFull, setShowFull] = useState(false);
  const [offsetX, setOffsetX] = useState(150); 
  const [offsetY, setOffsetY] = useState(150); 
  const [gaveUp, setGaveUp] = useState(false);

  // PicGuesser does NOT filter duplicate_of_code — exception per task spec
  const gameCards = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'picGuesser');
    const filtered = filterForPicGuesser(baseFiltered);
    // Apply type filters from settings
    const typeFiltered = filtered.filter(c => settings.picGuesserTypeFilters[c.typeName] ?? true);
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
    return `${card.name} (${card.pack_name} - ${card.xp}XP)`;
  };

  let zoomOutRate = 1;
  if (settings.picGuesserDifficulty === 'Normal') zoomOutRate = 1.8;
  if (settings.picGuesserDifficulty === 'Easy') zoomOutRate = 2.5;

  useEffect(() => {
    resetGame();
  }, [
    settings.picGuesserDifficulty,
    settings.picGuesserTypeFilters,
    settings.picGuesserUseGlobalPackFilter,
    settings.picGuesserFilteredPacks,
    settings.picGuesserIncludeWeakness,
    settings.picGuesserIncludeSignatures,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    cards
  ]);

  const submitGuess = (card: TransformedCard) => {
    console.log('[PicGuesser] Guess:', card);
    if (guesses.some(g => g.id === card.id)) return;
    const newGuesses = [card, ...guesses];
    setGuesses(newGuesses);
    
    if (card.id === answer?.id) {
      setWin(true);
      setShowFull(true);
    } else {
      setAnimation('shakeAnimation');
      setTimeout(() => setAnimation(''), 300);
      if (sizeMultiplier > 2) {
        setSizeMultiplier(prev => Math.max(2, prev - zoomOutRate));
      }
    }
  };

  const resetGame = () => {
    setWin(false);
    setGaveUp(false);
    setGuesses([]);
    setAnswer(gameCardsWithPic[Math.floor(Math.random() * gameCardsWithPic.length)]);
    setOffsetX(Math.floor(Math.random() * 301) - 150);
    setOffsetY(Math.floor(Math.random() * 251)+50);
    setSizeMultiplier(8);
    setShowFull(false);
  };

  return (
    <div className="pic-container">
      <div className="pic-header">
        <h1>Pic Guesser</h1>
        <div className="game-header-row">
          <p>Identify the card from a zoomed-in image.</p>
        <p className="small-note">Note: Some cards (mostly from newer expansions) may not have zoomed images supported yet.</p>
          <GameInfoButton
            gameName="PicGuesser"
            gameRules={{
              title: 'Pic Guesser',
              cardTypes: 'Asset, Event, Skill (only)',
              answerEvaluation: 'Must match: Class, Pack, Name, XP',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: 'pic guesser - a small portion of the art is shown, each guess will zoom out. Hints available after 3 wrong guesses.'
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
                 <img
                  src={`https://arkhamdb.com${answer.imagesrc}`}
                  alt="Guess this card"
                  className={showFull ? 'pic-image-full' : 'pic-image-zoomed'}
                  style={
                    !showFull ? {
                      transform: `scale(${sizeMultiplier}) translateX(${offsetX / sizeMultiplier}px) translateY(${offsetY / sizeMultiplier}px)`
                    } : {}
                  }
                />
              ) : (
                <div className="pic-image-unavailable">Image not available</div>
              )}
            </div>

            {(win || gaveUp) && (
              <ResultPanel win={win} item={answer} onPlayAgain={resetGame} className="pic-result" showImage={false}>
                <div className="pic-result-buttons">
                  <button className="premium-btn pic-result-button" onClick={() => setShowFull(!showFull)}>
                    {showFull ? <><EyeOff size={18} /> Hide Full Picture</> : <><Eye size={18} /> Show Full Picture</>}
                  </button>
                </div>
              </ResultPanel>
            )}

            {settings.enableHints && guesses.length >= 3 && !win && answer && (
              <div className="pic-hint hint-text">
                💡 Hint — Pack: {answer.pack_name}
              </div>
            )}

            {!win && !gaveUp && (
              <div className="pic-gameplay">
                <GuessInput
                  options={gameCards}
                  guesses={guesses}
                  onGuess={submitGuess}
                  placeholder="Type card name..."
                  onGiveUp={() => setGaveUp(true)}
                  giveUpThreshold={5}
                  getDisplayText={getDisplayText}
                  getOptionColors={getCardFactionColors}
                  className={`pic-input-wrapper ${animation}`}
                />
                
                <div className="pic-guesses-container">
                  {guesses.map((g, i) => (
                    <div key={`${g.id}-${i}`} className={`glass-panel pic-guess-item fade-in ${g.id === answer?.id ? 'correct' : 'incorrect'}`}>
                      <span>{g.fullName}</span>
                      <span className="result-text">{g.id === answer?.id ? 'Correct' : 'Incorrect'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
