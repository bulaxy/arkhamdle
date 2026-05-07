import { useCallback, useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import type { TransformedCard } from '../../types';
import { filterForEncounterGuesser, filterBySettings } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import './EncounterGuesser.scss';

export default function EncounterGuesser() {
  const { cards, settings } = useGameContext();
  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [animation, setAnimation] = useState('');
  
  const [selectedPack, setSelectedPack] = useState<string>('');
  const [selectedEncounter, setSelectedEncounter] = useState<string>('');

  const gameCards = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'encounterGuesser');
    return filterForEncounterGuesser(baseFiltered);
  }, [cards, settings]);

  const availablePacks = useMemo(() => {
    const packs = new Set<string>();
    gameCards.forEach(c => {
      if (c.pack_name) packs.add(c.pack_name);
    });
    return Array.from(packs).sort();
  }, [gameCards]);

  const availableEncountersForPack = useMemo(() => {
    if (!selectedPack) return [];
    const encounters = new Set<string>();
    gameCards.forEach(c => {
      if (c.pack_name === selectedPack && c.encounter_name) {
        encounters.add(c.encounter_name);
      }
    });
    return Array.from(encounters).sort();
  }, [gameCards, selectedPack]);


  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setGuesses([]);
    setSelectedPack('');
    setSelectedEncounter('');
    if (gameCards.length > 0) {
      setAnswer(gameCards[Math.floor(Math.random() * gameCards.length)]);
    } else {
      setAnswer(null);
    }
  }, [gameCards]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    settings.encounterGuesserUseGlobalPackFilter,
    settings.encounterGuesserFilteredPacks,
    settings.encounterGuesserIncludeWeakness,
    settings.encounterGuesserIncludeSignatures,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    cards,
    resetGame
  ]);

  const submitGuess = () => {
    if (!selectedEncounter) return;
    if (guesses.includes(selectedEncounter)) return;
    
    const newGuesses = [selectedEncounter, ...guesses];
    setGuesses(newGuesses);
    
    if (selectedEncounter === answer?.encounter_name) {
      setWin(true);
    } else {
      setAnimation('shakeAnimation');
      setTimeout(() => setAnimation(''), 300);
      setSelectedEncounter('');
    }
  };

  const hasNoCardsError = !settings.includeEncounter || gameCards.length === 0;

  return (
    <div className="encounter-container">
      <div className="encounter-header">
        <h1>Encounter Guesser</h1>
        <div className="game-header-row">
          <p>Identify the encounter set of the card from the blurred image.</p>
          <GameInfoButton
            gameRules={{
              title: 'Encounter Guesser',
              cardTypes: 'Encounter Cards',
              answerEvaluation: 'Must guess the Encounter Set Name',
              currentFilters: 'Applied: Pack filters, Include Encounter Cards required',
              howToPlay: 'A blurred encounter card is shown. Select the pack and encounter set it belongs to. After 3 wrong guesses, the pack name will be revealed as a hint.'
            }}
          />
        </div>
        <p className="small-note">Note: Some encounter cards appear in multiple sets (e.g., Rotting Remains in Blood on the Altar and in Core Set). Make sure you pick the encounter set for the specific card version shown!</p>
      </div>

      <div className="glass-panel encounter-panel">
        {hasNoCardsError ? (
          <div className="encounter-error-panel">
            <p className="settings-text error-title">
              No encounter cards available.
            </p>
            <p className="settings-text error-desc">
              Please go to General Settings and ensure "Include Encounter Cards" is enabled, and that you have packs with encounter cards selected.
            </p>
          </div>
        ) : (
          <>
            <div className="encounter-image-container">
              {answer && answer.imagesrc ? (
                <img
                  src={`https://arkhamdb.com${answer.imagesrc}`}
                  alt="Guess this encounter card"
                  className={win || gaveUp ? 'encounter-image-full' : 'encounter-image-blurred'}
                  style={{
                    filter: (!win && !gaveUp) ? `blur(${settings.encounterGuesserBlurAmount}px)` : 'none',
                    transition: 'filter 0.5s ease-out'
                  }}
                />
              ) : (
                <div className="encounter-image-unavailable">Image not available</div>
              )}
            </div>

            {(win || gaveUp) && (
              <ResultPanel win={win} item={answer} onPlayAgain={resetGame} className="encounter-result" showImage={false}>
                <div className="encounter-answer-details">
                  <p><strong>Encounter Set:</strong> {answer?.encounter_name}</p>
                  <p><strong>Pack:</strong> {answer?.pack_name}</p>
                  <p><strong>Card:</strong> {answer?.name}</p>
                </div>
              </ResultPanel>
            )}

            {settings.enableHints && guesses.length >= 3 && !win && answer && (
              <div className="encounter-hint hint-text">
                💡 Hint — Pack: {answer.pack_name}
              </div>
            )}

            {!win && !gaveUp && (
              <div className="encounter-gameplay">
                <div className={`encounter-inputs ${animation}`}>
                  <select
                    value={selectedPack}
                    onChange={(e) => {
                      setSelectedPack(e.target.value);
                      setSelectedEncounter('');
                    }}
                    className="encounter-select"
                  >
                    <option value="">-- Select Pack --</option>
                    {availablePacks.map(pack => (
                      <option key={pack} value={pack}>{pack}</option>
                    ))}
                  </select>

                  <select
                    value={selectedEncounter}
                    onChange={(e) => setSelectedEncounter(e.target.value)}
                    className="encounter-select"
                    disabled={!selectedPack}
                  >
                    <option value="">-- Select Encounter Set --</option>
                    {availableEncountersForPack.map(enc => (
                      <option key={enc} value={enc}>{enc}</option>
                    ))}
                  </select>

                  <button
                    className="premium-btn guess-btn"
                    onClick={submitGuess}
                    disabled={!selectedEncounter}
                  >
                    Guess
                  </button>

                  {guesses.length >= 5 && (
                    <button
                      className="premium-btn give-up-btn"
                      onClick={() => setGaveUp(true)}
                    >
                      Give Up
                    </button>
                  )}
                </div>
                
                <div className="encounter-guesses-container">
                  {guesses.map((g, i) => (
                    <div key={`${g}-${i}`} className="glass-panel encounter-guess-item fade-in incorrect">
                      <span>{g}</span>
                      <span className="result-text">Incorrect</span>
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
