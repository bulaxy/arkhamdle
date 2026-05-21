import { useCallback, useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { useGameContext } from '../../hooks/useGameContext';
import { useStats } from '../../context/StatsContext';
import type { TransformedCard, GameProps } from '../../types';
import { filterForCampaignPackGuesser, filterBySettings } from '../../services/CardFilter';
import { useGameSync } from '../../hooks/useGameSync';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import { getPackDisplayName } from '../../data/packStructure';
import './CampaignPackGuesser.scss';

export default function CampaignPackGuesser({ onPlayAgainOverride, streakModeName }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const { reportResult } = useStats();
  const modeName = 'Campaign Pack Guesser';
  const maxGuesses = settings.campaignPackGuesser.maxGuesses ?? 6;
  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [hasReportedStreakLoss, setHasReportedStreakLoss] = useState(false);
  const [animation, setAnimation] = useState('');
  
  const [selectedPack, setSelectedPack] = useState<string>('');
  const [selectedEncounter, setSelectedEncounter] = useState<string>('');
  const [encounterSearch, setEncounterSearch] = useState<string>('');
  const [showEncounterDropdown, setShowEncounterDropdown] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { isClientWaiting, syncedData, syncData, isHost, isMultiplayer } = useGameSync<{ answerId: string }>();

  const gameCards = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'campaignPackGuesser');
    return filterForCampaignPackGuesser(baseFiltered);
  }, [cards, settings]);

  const gameCardsWithPic = useMemo(() => {
    return gameCards.filter(c => c.imagesrc && c.imagesrc.trim().length > 0);
  }, [gameCards]);

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

  const fuse = useMemo(() => {
    return new Fuse(availableEncountersForPack, {
      threshold: 0.4,
    });
  }, [availableEncountersForPack]);

  const encounterSuggestions = useMemo(() => {
    if (!encounterSearch.trim()) return availableEncountersForPack;
    return fuse.search(encounterSearch.trim()).map(res => res.item);
  }, [fuse, encounterSearch, availableEncountersForPack]);

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setHasReportedStreakLoss(false);
    setGuesses([]);
    setSelectedPack('');
    setSelectedEncounter('');
    setEncounterSearch('');
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
    settings.campaignPackGuesser,
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
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: true, wrongGuesses: guesses.length }
      }));
    } else {
      setAnimation('shakeAnimation');
      setTimeout(() => setAnimation(''), 300);
      setSelectedEncounter('');
      setEncounterSearch('');
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
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: false, wrongGuesses: maxGuesses }
      }));
    }
  };

  const hasNoCardsError = !settings.includeEncounter || gameCardsWithPic.length === 0;

  return (
    <div className="campaign-pack-container">
      <div className="campaign-pack-header">
        <h1>Campaign Pack Guesser</h1>
        <div className="game-header-row">
          <p>Test your knowledge of the mythos by identifying encounter sets from blurred artwork.</p>
          <GameInfoButton
            gameRules={{
              title: 'Campaign Pack Guesser',
              cardTypes: 'Encounter Cards',
              answerEvaluation: 'Must guess the Encounter Set Name',
              currentFilters: 'Applied: Pack filters, Include Encounter Cards required',
              howToPlay: 'Examine the blurred encounter card artwork. Select the correct expansion pack and then the specific encounter set it belongs to. If you\'re stuck, a pack name hint will appear after three incorrect guesses.'
            }}
          />
        </div>
        <p className="small-note">Note: Some encounter cards appear in multiple sets (e.g., Rotting Remains in Blood on the Altar and in Core Set). Make sure you pick the encounter set for the specific card version shown!</p>
      </div>

      <div className={`glass-panel campaign-pack-panel ${answer && answer.typeName === 'location' && answer.backimagesrc && answer.backimagesrc.trim().length > 0 ? 'has-double-image' : ''}`}>
        {hasNoCardsError ? (
          <div className="campaign-pack-error-panel">
            <p className="settings-text error-title">
              No encounter cards available.
            </p>
            <p className="settings-text error-desc">
              Please go to General Settings and ensure "Include Encounter Cards" is enabled, and that you have packs with encounter cards selected.
            </p>
          </div>
        ) : isClientWaiting ? (
          <div className="waiting-for-host">Waiting for Host...</div>
        ) : (
          <>
            <div className={`campaign-pack-image-container ${answer && answer.typeName === 'location' && answer.backimagesrc && answer.backimagesrc.trim().length > 0 ? 'double-image' : 'standard-image'}`}>
              {answer && answer.imagesrc ? (
                answer.typeName === 'location' && answer.backimagesrc && answer.backimagesrc.trim().length > 0 ? (
                  <>
                    <div className="campaign-pack-double-image-wrapper">
                      <img
                        src={`https://arkhamdb.com${answer.imagesrc}`}
                        alt="Guess this encounter card front"
                        className={`campaign-pack-image ${win || gaveUp ? 'campaign-pack-image-full' : 'campaign-pack-image-blurred'} loaded`}
                        style={{
                          filter: (!win && !gaveUp) ? `blur(${settings.campaignPackGuesser.blurAmount}px)` : 'none',
                        }}
                      />
                    </div>
                    <div className="campaign-pack-double-image-wrapper">
                      <img
                        src={`https://arkhamdb.com${answer.backimagesrc}`}
                        alt="Guess this encounter card back"
                        className={`campaign-pack-image ${win || gaveUp ? 'campaign-pack-image-full' : 'campaign-pack-image-blurred'} loaded`}
                        style={{
                          filter: (!win && !gaveUp) ? `blur(${settings.campaignPackGuesser.blurAmount}px)` : 'none',
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {!imageLoaded && (
                      <div className="campaign-pack-image-loading">
                        <div className="spinner" />
                      </div>
                    )}
                    <img
                      src={`https://arkhamdb.com${answer.imagesrc}`}
                      alt="Guess this encounter card"
                      className={`campaign-pack-image ${win || gaveUp ? 'campaign-pack-image-full' : 'campaign-pack-image-blurred'} ${imageLoaded ? 'loaded' : ''}`}
                      style={{
                        filter: (!win && !gaveUp) ? `blur(${settings.campaignPackGuesser.blurAmount}px)` : 'none',
                      }}
                      onLoad={() => setImageLoaded(true)}
                    />
                  </>
                )
              ) : (
                <div className="campaign-pack-image-unavailable">Image not available</div>
              )}
            </div>

            {(win || gaveUp) && (
              <ResultPanel win={win} item={answer} onPlayAgain={onPlayAgainOverride || resetGame} className="campaign-pack-result" showImage={false}>
                <div className="campaign-pack-answer-details">
                  <p><strong>Encounter Set:</strong> {answer?.encounter_name}</p>
                  <p><strong>Pack:</strong> {answer ? getPackDisplayName(answer.pack_code, answer.pack_name) : 'Unknown'}</p>
                  <p><strong>Card:</strong> {answer?.name}</p>
                </div>
              </ResultPanel>
            )}

            {settings.enableHints && guesses.length >= 3 && !win && answer && (
              <div className="campaign-pack-hint hint-text">
                💡 Hint — Pack: {getPackDisplayName(answer.pack_code, answer.pack_name)}
              </div>
            )}

            {!win && !gaveUp && (
              <div className="campaign-pack-gameplay">
                <div className={`campaign-pack-inputs ${animation}`}>

                  <select
                    value={selectedPack}
                    onChange={(e) => {
                      setSelectedPack(e.target.value);
                      setSelectedEncounter('');
                      setEncounterSearch('');
                    }}
                    className="campaign-pack-select"
                  >
                    <option value="">-- Select Pack --</option>
                    {availablePacks.map(pack => (
                      <option key={pack} value={pack}>{pack}</option>
                    ))}
                  </select>

                  <div className="encounter-search-wrapper">
                    <input
                      type="text"
                      className="campaign-pack-select search-input"
                      placeholder={selectedPack ? "-- Search Encounter Set --" : "-- Select Pack First --"}
                      value={encounterSearch}
                      onChange={(e) => {
                        setEncounterSearch(e.target.value);
                        setSelectedEncounter('');
                        setShowEncounterDropdown(true);
                      }}
                      onFocus={() => setShowEncounterDropdown(true)}
                      onBlur={() => setTimeout(() => setShowEncounterDropdown(false), 200)}
                      disabled={!selectedPack}
                    />
                    {showEncounterDropdown && selectedPack && (
                      <div className="guess-suggestions">
                        {encounterSuggestions.map(enc => (
                          <div
                            key={enc}
                            className="guess-suggestion-item"
                            onClick={() => {
                              setSelectedEncounter(enc);
                              setEncounterSearch(enc);
                              setShowEncounterDropdown(false);
                            }}
                          >
                            {enc}
                          </div>
                        ))}
                        {encounterSuggestions.length === 0 && (
                          <div className="guess-suggestion-item no-match">No results found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    className="premium-btn guess-btn"
                    onClick={submitGuess}
                    disabled={!selectedEncounter}
                  >
                    Guess
                  </button>

                  {guesses.length >= maxGuesses && (
                    <button
                      className="premium-btn give-up-btn"
                      onClick={handleGiveUp}
                    >
                      Give Up
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {guesses.length > 0 && (
              <div className="campaign-pack-guesses-container">
                {guesses.map((g, i) => {
                  const isCorrect = g === answer?.encounter_name;
                  return (
                    <div key={`${g}-${i}`} className={`glass-panel campaign-pack-guess-item fade-in ${isCorrect ? 'correct' : 'incorrect'}`}>
                      <span>{g}</span>
                      <span className={`result-text ${isCorrect ? 'correct' : 'incorrect'}`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
