import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import { useStats } from '../../context/StatsContext';
import { type GameProps, TypeName } from '../../types';
import { filterBySettings, filterDuplicateOfCode, getCardFactionColors } from '../../services/CardFilter';
import { useGameSync } from '../../hooks/useGameSync';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import falseTraitsData from '../../data/false_traits.json';
import { packSameOrNewerThan, getPackDisplayName } from '../../data/packStructure';
import {
  generateFalseStatValue,
  getWeightedRandom,
  getKeywordDisplayValue,
  getPackGroup,
  generatePicMismatchQuestion,
  type GameQuestion,
  type AnyQuestionType,
  type EnemyQuestionType,
  type LocationQuestionType,
  type ActQuestionType,
  type AgendaQuestionType,
  type TreacheryQuestionType
} from './trueOrFalseHelpers';
import './TrueOrFalse.scss';

const ENEMY_KEYWORD_TRAITS = ['Retaliate', 'Hunter', 'Alert', 'Aloof', 'Elusive', 'Prey', 'Massive', 'Spawn', 'Forced', 'Revelation', 'Reaction', 'Action', 'Fast'];
const LOCATION_KEYWORD_TRAITS = ['Forced', 'Resign', 'Reaction', 'Action', 'Fast', 'Revelation'];
const ACT_KEYWORD_TRAITS = ['Forced', 'Action', 'Fast'];
const AGENDA_KEYWORD_TRAITS = ['Forced', 'Action'];
const TREACHERY_KEYWORD_TRAITS = ['Forced', 'Surge'];

export default function TrueOrFalse({ onPlayAgainOverride, streakModeName }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const { reportResult } = useStats();
  const modeName = 'True or False';
  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [win, setWin] = useState(false);
  const [lose, setLose] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { setSettings, refreshData } = useGameContext();
  
  const { isClientWaiting, syncedData, syncData, isHost, isMultiplayer } = useGameSync<{
    cardId: string;
    isTrue: boolean;
    questionText: string;
    displayedValue: string;
    type: AnyQuestionType;
  }>();
  
  const [showNotification, setShowNotification] = useState(() => {
    return !localStorage.getItem('arkhamdle_tf_notification');
  });

  const handleCloseNotification = () => {
    localStorage.setItem('arkhamdle_tf_notification', 'true');
    setShowNotification(false);
  };

  // Consolidate base pool generation
  const filteredBaseCards = useMemo(() => {
    return filterDuplicateOfCode(filterBySettings(cards, settings, 'trueOrFalse'));
  }, [cards, settings]);

  const traitPool = useMemo(() => {
    const falseTraitsRecord = falseTraitsData as Record<string, string[]>;
    return filteredBaseCards.filter(c => 
      c.traits && c.traits.length > 0 && 
      !!falseTraitsRecord[c.id] && falseTraitsRecord[c.id].length > 0
    );
  }, [filteredBaseCards]);

  const enemyPool = useMemo(() => filteredBaseCards.filter(c => c.typeName === TypeName.ENEMY && c.imagesrc), [filteredBaseCards]);
  const locationPool = useMemo(() => filteredBaseCards.filter(c => c.typeName === TypeName.LOCATION && c.imagesrc), [filteredBaseCards]);
  const actPool = useMemo(() => filteredBaseCards.filter(c => c.typeName === TypeName.ACT && c.imagesrc), [filteredBaseCards]);
  const agendaPool = useMemo(() => filteredBaseCards.filter(c => c.typeName === TypeName.AGENDA && c.imagesrc), [filteredBaseCards]);
  const treacheryPool = useMemo(() => filteredBaseCards.filter(c => c.typeName === TypeName.TREACHERY && c.imagesrc), [filteredBaseCards]);
  const agendaActPool = useMemo(() => [...actPool, ...agendaPool], [actPool, agendaPool]);

  const isPoolReady = 
    (settings.trueOrFalse.traitMode && traitPool.length > 0) || 
    (settings.trueOrFalse.enemyStatsMode && enemyPool.length > 0) || 
    (settings.trueOrFalse.locationTraitsMode && locationPool.length > 0) || 
    (settings.trueOrFalse.actTraitsMode && actPool.length > 0) || 
    (settings.trueOrFalse.agendaTraitsMode && agendaPool.length > 0) || 
    (settings.trueOrFalse.treacheryTraitsMode && treacheryPool.length > 0);

  const resetGame = useCallback(() => {
    setWin(false);
    setLose(false);
    setImageLoaded(false);

    const generateQuestion = (): GameQuestion | null => {
      type GameMode = 'Traits' | 'Enemy' | 'Location' | 'Act' | 'Agenda' | 'Treachery' | 'AgendaAct';
      const availableModes: { type: GameMode; weight: number }[] = [];
      
      if (settings.trueOrFalse.traitMode && traitPool.length > 0) availableModes.push({ type: 'Traits', weight: 10 });
      if (settings.trueOrFalse.enemyStatsMode && enemyPool.length > 0) availableModes.push({ type: 'Enemy', weight: 20 }); 
      if (settings.trueOrFalse.locationTraitsMode && locationPool.length > 0) availableModes.push({ type: 'Location', weight: 20 }); 
      if (settings.trueOrFalse.actTraitsMode && actPool.length > 0) availableModes.push({ type: 'Act', weight: 5 }); 
      if (settings.trueOrFalse.agendaTraitsMode && agendaPool.length > 0) availableModes.push({ type: 'Agenda', weight:5 });
      if (settings.trueOrFalse.treacheryTraitsMode && treacheryPool.length > 0) availableModes.push({ type: 'Treachery', weight: 20 }); 
      if (settings.trueOrFalse.nameAndPicMode && settings.trueOrFalse.actTraitsMode && settings.trueOrFalse.agendaTraitsMode && agendaActPool.length > 0) availableModes.push({ type: 'AgendaAct', weight: 4 }); ;

      if (availableModes.length === 0) return null;

      const selectedMode = getWeightedRandom(availableModes);
      const isTrue = Math.random() >= 0.5;
      switch(selectedMode) {
        case 'Traits': 
          // eslint-disable-next-line no-case-declarations
          const randomCard = traitPool[Math.floor(Math.random() * traitPool.length)];
          // eslint-disable-next-line no-case-declarations
          let displayedTraits = randomCard.traits.join('. ') + '.';
          
          if (!isTrue) {
            const falseTraitsRecord = falseTraitsData as Record<string, string[]>;
            const falseOptions = falseTraitsRecord[randomCard.id];
            if (falseOptions && falseOptions.length > 0) {
              displayedTraits = falseOptions[Math.floor(Math.random() * falseOptions.length)];
            }
          }

          return {
            card: randomCard,
            isTrue: displayedTraits === (randomCard.traits.join('. ') + '.'),
            questionText: 'Are these the correct traits for this card?',
            displayedValue: displayedTraits,
            type: 'Traits'
          };

        case 'AgendaAct': {
          const randomCard = agendaActPool[Math.floor(Math.random() * agendaActPool.length)];
          return generatePicMismatchQuestion(
            randomCard,
            isTrue,
            agendaActPool,
            0.75,
            true
          );
        }

        case 'Enemy': {
          const randomCard = enemyPool[Math.floor(Math.random() * enemyPool.length)];
          const isElite = randomCard.traits.some(t => t.toLowerCase() === 'elite');
          const group = getPackGroup(randomCard.pack_code);
          const options: { type: EnemyQuestionType; weight: number }[] = [
            { type: 'PicMismatch', weight: settings.trueOrFalse.nameAndPicMode ? 3.5 : 0 },
            { type: 'Retaliate', weight: 1.5 },
            { type: 'Hunter', weight: 1.5 },
            { type: 'Massive', weight: isElite ? 1.5 : 0 },
            { type: 'Fight', weight: 1 },
            { type: 'Horror', weight: 1 },
            { type: 'Damage', weight: 1 },
            { type: 'Evade', weight: 1 },
            { type: 'Health', weight: randomCard.health !== 0 ? 1 : 0 },
            { type: 'Alert', weight: packSameOrNewerThan(group, 'tfa') ? 1 : 0 },
            { type: 'Elusive', weight: packSameOrNewerThan(group, 'fhv') ? 1 : 0 },
            { type: 'Spawn', weight: 0.75 },
            { type: 'Forced', weight: 0.75 },
            { type: 'Revelation', weight: 0.75 },
            { type: 'Aloof', weight: packSameOrNewerThan(group, 'dwl') ? 0.75 : 0 },
            { type: 'Victory', weight: (randomCard.victory !== undefined || isElite) ? 0.5 : 0 },
            { type: 'Prey', weight: 0.5 },
            { type: 'Reaction', weight: 0.25 },
            { type: 'Action', weight: 0.25 },
            { type: 'Fast', weight: 0.25 }
          ];

          const selectedOption = getWeightedRandom(options);
          

          if (selectedOption === 'PicMismatch') {
            return generatePicMismatchQuestion(
              randomCard,
              isTrue,
              enemyPool
            );
          }
          if (ENEMY_KEYWORD_TRAITS.includes(selectedOption)) {
            const allowedKeywords = ENEMY_KEYWORD_TRAITS.filter(k => {
              if (k === 'Alert') return packSameOrNewerThan(group, 'tfa');
              if (k === 'Aloof') return packSameOrNewerThan(group, 'dwl');
              if (k === 'Elusive') return packSameOrNewerThan(group, 'fhv');
              return true;
            });

            const displayedValue = getKeywordDisplayValue(randomCard, isTrue, selectedOption, allowedKeywords);
            if (!displayedValue) return null;

            return {
              card: randomCard, isTrue, questionText: `Does this enemy have the ${displayedValue} keyword?`,
              displayedValue: '', type: selectedOption
            };
          } else {
            let actualValue = 0;
            let label = selectedOption as string;
            
            switch (selectedOption) {
              case 'Fight': actualValue = randomCard.enemy_fight ?? 0; break;
              case 'Evade': actualValue = randomCard.enemy_evade ?? 0; break;
              case 'Health': 
                actualValue = randomCard.health ?? 0; 
                if (randomCard.health_per_investigator) label = 'Health (per investigator)';
                break;
              case 'Damage': actualValue = randomCard.enemy_damage ?? 0; break;
              case 'Horror': actualValue = randomCard.enemy_horror ?? 0; break;
              case 'Victory': actualValue = randomCard.victory ?? 0; break;
            }

            const fakeValue = isTrue ? actualValue : generateFalseStatValue(actualValue, selectedOption, isElite);
            if (fakeValue === null) return null;

            return {
              card: randomCard, isTrue, questionText: `Is the ${label.toLowerCase()} value of this enemy ${fakeValue}?`,
              displayedValue: '', type: selectedOption
            };
          }
        }

        case 'Act': {
          const randomCard = actPool[Math.floor(Math.random() * actPool.length)];
          const options: { type: ActQuestionType; weight: number }[] = [
            { type: 'Clues', weight: 1 }, 
            { type: 'Forced', weight: 1 },
            { type: 'Action', weight: 0.5 }, 
            { type: 'Fast', weight: 0.5 }
          ];
          const selectedOption = getWeightedRandom(options);
          
          if (ACT_KEYWORD_TRAITS.includes(selectedOption)) {
            const displayedValue = getKeywordDisplayValue(randomCard, isTrue, selectedOption, ACT_KEYWORD_TRAITS);
            if (!displayedValue) return null;

            return {
              card: randomCard, isTrue, questionText: `Does this Act have the ${displayedValue} keyword?`,
              displayedValue: '', type: selectedOption
            };
          } else {
            const val = randomCard.clues ?? 0;
            const fakeValue = isTrue ? val : generateFalseStatValue(val, selectedOption);
            if (fakeValue === null) return null;

            return {
              card: randomCard, isTrue, questionText: `How many clue (per investigator) is required to advance of this Act? Is it ${fakeValue}?`,
              displayedValue: '', type: selectedOption
            };
          }
        }

        case 'Agenda': {
          const randomCard = agendaPool[Math.floor(Math.random() * agendaPool.length)];
          const options: { type: AgendaQuestionType; weight: number }[] = [
            { type: 'Doom', weight: 1 },
            { type: 'Forced', weight: 1 },
            { type: 'Action', weight: 1 }
          ];
          
          const selectedOption = getWeightedRandom(options);
          
          if (AGENDA_KEYWORD_TRAITS.includes(selectedOption)) {
            const displayedValue = getKeywordDisplayValue(randomCard, isTrue, selectedOption, AGENDA_KEYWORD_TRAITS);
            if (!displayedValue) return null;

            return {
              card: randomCard, isTrue, questionText: `Does this Agenda have the ${displayedValue} keyword?`,
              displayedValue: '', type: selectedOption
            };
          } else {
            const val = randomCard.doom ?? 0;
            const fakeValue = isTrue ? val : generateFalseStatValue(val, selectedOption);
            if (fakeValue === null) return null;

            return {
              card: randomCard, isTrue, questionText: `Is the doom value of this Agenda ${fakeValue}?`,
              displayedValue: '', type: selectedOption
            };
          }
        }

        case 'Location': {
          const randomCard = locationPool[Math.floor(Math.random() * locationPool.length)];
          const options: { type: LocationQuestionType; weight: number }[] = [
            { type: 'PicMismatch', weight: settings.trueOrFalse.nameAndPicMode ? 2.5 : 0 },
            { type: 'Clues', weight: 1 },
            { type: 'Shroud', weight: 1 },
            { type: 'Forced', weight: 0.75 },
            { type: 'Action', weight: 0.5 },
            { type: 'Revelation', weight: 0.5 },
            { type: 'Reaction', weight: 0.25 },
            { type: 'Fast', weight: 0.25 },
            { type: 'Resign', weight: 0.1 }
          ];
          
          const selectedOption = getWeightedRandom(options);

          if (selectedOption === 'PicMismatch') {
            return generatePicMismatchQuestion(
              randomCard,
              isTrue,
              locationPool
            );
          }
          if (LOCATION_KEYWORD_TRAITS.includes(selectedOption)) {
            const displayedValue = getKeywordDisplayValue(randomCard, isTrue, selectedOption, LOCATION_KEYWORD_TRAITS);
            if (!displayedValue) return null;

            return {
              card: randomCard, isTrue, questionText: `Does this Location have the ${displayedValue} keyword?`,
              displayedValue: '', type: selectedOption
            };
          } else {
            const val = selectedOption === 'Clues' ? (randomCard.clues ?? 0) : (randomCard.shroud ?? 0);
            const fakeValue = isTrue ? val : generateFalseStatValue(val, selectedOption);
            if (fakeValue === null) return null;

            return {
              card: randomCard, isTrue, questionText: `Is the ${selectedOption.toLowerCase()} value of this Location ${fakeValue}?`,
              displayedValue: '', type: selectedOption
            };
          }
        }

        case 'Treachery': {
          const randomCard = treacheryPool[Math.floor(Math.random() * treacheryPool.length)];
          const options: { type: TreacheryQuestionType; weight: number }[] = [
            { type: 'PicMismatch', weight: settings.trueOrFalse.nameAndPicMode ? 2 : 0 },
            { type: 'Forced', weight: 1 },
            { type: 'Surge', weight: 0.5 }
          ];
          
          const selectedOption = getWeightedRandom(options);

          if (selectedOption === 'PicMismatch') {
            return generatePicMismatchQuestion(
              randomCard,
              isTrue,
              treacheryPool,
              0.65
            );
          }

          const displayedValue = getKeywordDisplayValue(randomCard, isTrue, selectedOption, TREACHERY_KEYWORD_TRAITS);
          if (!displayedValue) return null;
          return {
            card: randomCard, isTrue, questionText: `Does this Treachery have the ${displayedValue} keyword?`,
            displayedValue: '', type: selectedOption
          };
        }

        default:
          return null;
      }
    };

    if (isMultiplayer && !isHost) {
      return; // wait for sync
    }

    let attempts = 0;
    while (attempts < 100) {
      const q = generateQuestion();
      if (q) {
        syncData({
          cardId: q.card.id,
          isTrue: q.isTrue,
          questionText: q.questionText,
          displayedValue: q.displayedValue,
          type: q.type
        });
        return;
      }
      attempts++;
    }
  }, [settings.trueOrFalse, traitPool, enemyPool, locationPool, actPool, agendaPool, treacheryPool, agendaActPool, isMultiplayer, isHost, syncData]);

  useEffect(() => {
    if (syncedData) {
      const syncedCard = cards.find(c => c.id === syncedData.cardId);
      if (syncedCard) {
        setQuestion({
          card: syncedCard,
          isTrue: syncedData.isTrue,
          questionText: syncedData.questionText,
          displayedValue: syncedData.displayedValue,
          type: syncedData.type
        });
      }
    }
  }, [syncedData, cards]);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isPoolReady && !hasInitialized.current) {
      resetGame();
      hasInitialized.current = true;
    }
  }, [isPoolReady, resetGame]);

  useEffect(() => {
    if (hasInitialized.current && !win && !lose && isPoolReady) {
      resetGame();
    }
  }, [
    settings,
    settings.trueOrFalse,
    resetGame,
    win,
    lose,
    isPoolReady
  ]);

  const handleGuess = (guessTrue: boolean) => {
    if (win || lose) return;
    const isCorrect = guessTrue === question?.isTrue;
    if (isCorrect) {
      setWin(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: true }
      }));
    } else {
      setLose(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: false }
      }));
    }
  };

  if (!isPoolReady) {
    return (
      <div className="true-or-false-container fade-in">
        <div className="trivia-header">
          <h1>True Or False</h1>
          <p>No cards match your current filters and mode settings. Please adjust your settings.</p>
          
          {!settings.includeEncounter && (
            <div className="variety-prompt">
              <h3>Want more variety?</h3>
              <p className="variety-prompt-text">
                True/False mode relies heavily on encounter cards (Enemies, Locations, Treacheries). Enabling campaign cards will provide enough cards to play!
              </p>
              <button 
                className="premium-btn"
                onClick={() => {
                  setSettings({ ...settings, includeEncounter: true });
                  refreshData(true);
                }}
              >
                Download & Enable Campaign Cards (11MB)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!question) return null;

  const isGameOver = win || lose;
  const cardColors = getCardFactionColors(question.card);
  const xpBackground = cardColors.length > 1 
    ? `linear-gradient(135deg, ${cardColors.join(', ')})`
    : cardColors[0];

  return (
    <div className="true-or-false-container fade-in">
      <div className="trivia-header">
        <h1>True Or False</h1>
        <div className="game-header-row">
          <p>{question.type === 'Traits' ? 'Does this card have these traits?' : 'Is this stat or keyword correct for this enemy?'}</p>
          <GameInfoButton
            gameRules={{
              title: 'True Or False',
              cardTypes: 'Enemies and cards with traits',
              answerEvaluation: 'True or False',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: `We will show you a card's name, subname, pack, and XP. You must guess if the displayed information is true or false.${!settings.includeEncounter ? " Note: Enabling campaign cards in the Settings greatly enhances this game mode!" : ""}`
            }}
          />
        </div>
      </div>

      <div className="trivia-question-section">
        {(isClientWaiting || !question) ? (
          <div className="waiting-for-host">Waiting for Host...</div>
        ) : (
          <>
            <div className="card-info">
              {question.type !== 'PicMismatch' && <>
              <h2>{question.card.name}</h2>
              {question.card.subname && <div className="subname">{question.card.subname}</div>}
              </>}
              
              <div className="card-details">
                {question.type !== 'PicMismatch' && (
                  <span className="detail-badge">
                    {getPackDisplayName(question.card.pack_code, question.card.pack_name)}
                  </span>
                )}
                {question.type === 'Traits' && question.card.xp !== undefined && question.card.xp !== null && (
                  <span className="xp-badge" style={{ background: xpBackground }}>
                    XP: {question.card.xp}
                  </span>
                )}
              </div>
            </div>

            {!isGameOver && question.type !== 'Traits' && question.card.imagesrc && (
              <div className="card-image-wrapper">
                {!imageLoaded && (
                  <div className="image-loading-placeholder">
                    <div className="spinner" />
                  </div>
                )}
                <img 
                  src={`https://arkhamdb.com${question.card.backimagesrc && question.card.typeName==="location"?question.card.backimagesrc : question.card.imagesrc}`} 
                  alt={question.card.name} 
                  className={`${['agenda', 'act'].includes(question.card.typeName) ? 'card-preview-image-side' : 'card-preview-image'} ${imageLoaded ? 'loaded' : ''}`}
                  onLoad={() => setImageLoaded(true)}
                />
                <div className={`image-obscure-box-${question.card.typeName} ${question.type === 'PicMismatch' ? 'pic-mismatch' : ''}`} />
                {question.type === 'PicMismatch' && ['location', 'enemy', 'treachery'].includes(question.card.typeName) && (
                  <div className="image-obscure-box-top" />
                )}
              </div>
            )}

            <div className="question-box">
              <p>{question.questionText}</p>
              <div className="traits-display">{question.displayedValue}</div>
            </div>

            {!isGameOver && (
              <div className="true-false-actions">
                <button className="tf-btn btn-true" onClick={() => handleGuess(true)} autoFocus>True</button>
                <button className="tf-btn btn-false" onClick={() => handleGuess(false)}>False</button>
              </div>
            )}
          </>
        )}
      </div>

      {isGameOver && (
        <ResultPanel
          win={win}
          item={{ 
            fullName: question.card.fullName, 
            imagesrc: question.card.imagesrc,
            backimagesrc: question.card.backimagesrc,
            typeName: question.card.typeName
          }}
          onPlayAgain={onPlayAgainOverride || resetGame}
        >
          {question.type === 'Traits' ? (
            <p>The actual traits are: <strong>{question.card.traits.join('. ') + '.'}</strong></p>
          ) : question.fakeCard ? (
            <>
              <p>The correct answer was: <strong>{question.isTrue ? 'True' : 'False'}</strong>{!question.isTrue && `. It is the art work for ${question.card.name}`}</p>
            </>
          ) : (
            <p>The correct answer was: <strong>{question.isTrue ? 'True' : 'False'}</strong></p>
          )}
        </ResultPanel>
      )}
      
      {showNotification && !settings.includeEncounter && (
        <div className="modal-overlay" onClick={handleCloseNotification}>
          <div className="modal-content notification-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-with-icon">
                <h2>True / False Mode</h2>
              </div>
            </div>
            <div className="modal-body">
              <p className="settings-text notification-text-primary">
                True/False game mode is best experienced with campaign cards enabled!
              </p>
              <p className="settings-text notification-text-secondary">
                Including campaign cards greatly enhances this game mode by providing more variety. Note: this requires downloading 11MB of data. You can toggle these cards off at any time after downloading in Settings.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="premium-btn notification-btn-primary"
                onClick={() => {
                  setSettings({ ...settings, includeEncounter: true });
                  refreshData(true);
                  handleCloseNotification();
                }}
              >
                Download Now
              </button>
              <button
                className="premium-btn notification-btn-secondary"
                onClick={handleCloseNotification}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}