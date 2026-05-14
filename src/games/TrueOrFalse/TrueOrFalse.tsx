import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import { type TransformedCard, type GameProps, type TrueOrFalseSettings, TypeName } from '../../types';
import { filterBySettings, filterDuplicateOfCode, getCardFactionColors } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import falseTraitsData from '../../data/false_traits.json';
import { buildPackCodeToGroupMap, packSameOrNewerThan, getPackDisplayName } from '../../data/packStructure';
import { cardHasKeyword } from '../shared/trivia/triviaTemplates';
import './TrueOrFalse.scss';

const packCodeToGroup = buildPackCodeToGroupMap();

function getPackGroup(packCode: string): string {
  return (packCodeToGroup.get(packCode) || 'OTHER').toLowerCase();
}

type EnemyQuestionType = 
  | 'Fight' | 'Horror' | 'Damage' | 'Evade' | 'Health' 
  | 'Retaliate' | 'Hunter' | 'Alert' | 'Aloof' | 'Elusive' | 'Victory'
  | 'Prey' | 'Massive' | 'Spawn' | 'Forced' | 'Revelation';

type LocationQuestionType = 'Clues' | 'Shroud' | 'Forced' | 'Resign' | 'Victory';
type ActQuestionType = 'Clues' | 'Forced' | 'Objective' | 'Resign';
type AgendaQuestionType = 'Doom' | 'Forced' | 'Resign';
type TreacheryQuestionType = 'Forced'| 'Surge' ;

type AnyQuestionType = EnemyQuestionType | LocationQuestionType | ActQuestionType | AgendaQuestionType | TreacheryQuestionType | 'Traits';

interface GameQuestion {
  card: TransformedCard;
  isTrue: boolean;
  questionText: string;
  displayedValue: string;
  type: AnyQuestionType;
}

const ENEMY_KEYWORD_TRAITS = ['Retaliate', 'Hunter', 'Alert', 'Aloof', 'Elusive', 'Prey', 'Massive', 'Spawn', 'Forced', 'Revelation'];
const LOCATION_KEYWORD_TRAITS = ['Forced', 'Resign', 'Victory'];
const ACT_KEYWORD_TRAITS = ['Forced', 'Objective', 'Resign'];
const AGENDA_KEYWORD_TRAITS = ['Forced', 'Resign'];
const TREACHERY_KEYWORD_TRAITS = ['Forced', 'Surge'];

function generateFalseStatValue(
  val: number,
  type: AnyQuestionType,
  isElite?: boolean
): number | null {
  const isPlus = Math.random() >= 0.5;
  let fakeValue = val + (isPlus ? 1 : -1);

  if (type === 'Damage' || type === 'Horror') {
    if (fakeValue < 0) fakeValue = val + 1;
    if (fakeValue > 3) fakeValue = val - 1;
    if (!isElite && fakeValue > 2) fakeValue = Math.min(fakeValue, 2);
    if (fakeValue === val) fakeValue = val - 1;
    if (fakeValue < 0 || fakeValue > (isElite ? 3 : 2)) return null;
  } else if (type === 'Fight' || type === 'Health' || type === 'Evade') {
    if (fakeValue <= 0) fakeValue = val + 1;
    if (!isElite && fakeValue > 5) fakeValue = val - 1;
    if (fakeValue === val || fakeValue <= 0 || (!isElite && fakeValue > 5)) return null;
  } else if (type === 'Victory') {
    if (fakeValue <= 0) fakeValue = val + 1;
    if (isElite && fakeValue === 2) fakeValue = val === 1 ? 3 : 1; 
    if (fakeValue === val || fakeValue <= 0) return null;
  } else if (type === 'Clues') {
    if (fakeValue < 0) fakeValue = val + 1;
    if (fakeValue > 6) fakeValue = val - 1;
    if (fakeValue < 0 || fakeValue > 6) return null;
  } else if (type === 'Doom') {
    if (fakeValue < 1) fakeValue = val + 1;
    if (fakeValue < 1) return null;
  } else if (type === 'Shroud') {
    if (fakeValue < 0) fakeValue = val + 1;
    if (fakeValue > 7) fakeValue = val - 1;
    if (fakeValue < 0 || fakeValue > 7) return null;
  }

  return fakeValue === val ? null : fakeValue;
}

// Helper: Get a random value based on given weights
function getWeightedRandom<T>(options: { type: T; weight: number }[]): T {
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  let randomVal = Math.random() * totalWeight;
  for (const opt of options) {
    randomVal -= opt.weight;
    if (randomVal <= 0) return opt.type;
  }
  return options[0].type; // Fallback
}

// Helper: Filter and return random displayed keyword for questions
function getKeywordDisplayValue(
  card: TransformedCard,
  isTrue: boolean,
  selectedOption: string,
  allowedKeywords: string[]
): string | null {
  const hasKeywords = allowedKeywords.filter(k => cardHasKeyword(card, k));
  const hasNotKeywords = allowedKeywords.filter(k => !cardHasKeyword(card, k));
  const pool = isTrue ? hasKeywords : hasNotKeywords;
  if (pool.length === 0) return null;
  return pool.includes(selectedOption) 
    ? selectedOption 
    : pool[Math.floor(Math.random() * pool.length)];
}

export default function TrueOrFalse({ onPlayAgainOverride }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const tfSettings = settings.trueOrFalse as TrueOrFalseSettings;

  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [win, setWin] = useState(false);
  const [lose, setLose] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { setSettings, refreshData } = useGameContext();
  
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

  const isPoolReady = 
    (tfSettings.traitMode && traitPool.length > 0) || 
    (tfSettings.enemyStatsMode && enemyPool.length > 0) || 
    (tfSettings.locationTraitsMode && locationPool.length > 0) || 
    (tfSettings.actTraitsMode && actPool.length > 0) || 
    (tfSettings.agendaTraitsMode && agendaPool.length > 0) || 
    (tfSettings.treacheryTraitsMode && treacheryPool.length > 0);

  const resetGame = useCallback(() => {
    setWin(false);
    setLose(false);
    setImageLoaded(false);

    const generateQuestion = (): GameQuestion | null => {
      type GameMode = 'Traits' | 'Enemy' | 'Location' | 'Act' | 'Agenda' | 'Treachery';
      const availableModes: { type: GameMode; weight: number }[] = [];
      
      if (tfSettings.traitMode && traitPool.length > 0) availableModes.push({ type: 'Traits', weight: 10 });
      if (tfSettings.enemyStatsMode && enemyPool.length > 0) availableModes.push({ type: 'Enemy', weight: 5 }); 
      if (tfSettings.locationTraitsMode && locationPool.length > 0) availableModes.push({ type: 'Location', weight: 20 }); 
      if (tfSettings.actTraitsMode && actPool.length > 0) availableModes.push({ type: 'Act', weight: 20 }); 
      if (tfSettings.agendaTraitsMode && agendaPool.length > 0) availableModes.push({ type: 'Agenda', weight:20 });
      if (tfSettings.treacheryTraitsMode && treacheryPool.length > 0) availableModes.push({ type: 'Treachery', weight: 20 }); 

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

        case 'Enemy': {
          const randomCard = enemyPool[Math.floor(Math.random() * enemyPool.length)];
          const isElite = randomCard.traits.some(t => t.toLowerCase() === 'elite');
          const group = getPackGroup(randomCard.pack_code);
          const options: { type: EnemyQuestionType; weight: number }[] = [
            { type: 'Fight', weight: 1 }, { type: 'Horror', weight: 1 }, { type: 'Damage', weight: 1 },
            { type: 'Evade', weight: 1 }, { type: 'Retaliate', weight: 1.5 }, { type: 'Hunter', weight: 1.5 },
            { type: 'Spawn', weight: 1.5 }, { type: 'Forced', weight: 0.5 },
            { type: 'Revelation', weight: 0.5 }
          ];

          if (randomCard.health !== 0) options.push({ type: 'Health', weight: 1 });
          if (packSameOrNewerThan(group, 'tfa')) options.push({ type: 'Alert', weight: 1.5 });
          if (packSameOrNewerThan(group, 'dwl')) options.push({ type: 'Aloof', weight: 0.5 });
          if (packSameOrNewerThan(group, 'fhv')) options.push({ type: 'Elusive', weight: 1.5 });
          if (randomCard.victory !== undefined || isElite) options.push({ type: 'Victory', weight: 0.5 });
          
          if (isElite) {
            options.push({ type: 'Prey', weight: 1.5 });
            options.push({ type: 'Massive', weight: 1.5 });
          }

          const selectedOption = getWeightedRandom(options);
          
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
            {type: 'Clues', weight: 1}, 
            {type: 'Forced', weight: 1}, {type: 'Objective', weight: 0.2}, 
            {type: 'Resign', weight: 0.2}
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
            {type: 'Doom', weight: 1}, {type: 'Forced', weight: 1}, {type: 'Resign', weight: 0.2}, 
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
            {type: 'Clues', weight: 1}, {type: 'Shroud', weight: 1}, {type: 'Forced', weight: 0.5},
            {type: 'Resign', weight: 0.1},
          ];
          
          const selectedOption = getWeightedRandom(options);

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
            {type: 'Forced', weight: 1}, {type: 'Surge', weight: 1}, 
          ];
          
          const selectedOption = getWeightedRandom(options);
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

    let attempts = 0;
    while (attempts < 100) {
      const q = generateQuestion();
      if (q) {
        setQuestion(q);
        return;
      }
      attempts++;
    }
  }, [tfSettings, traitPool, enemyPool, locationPool, actPool, agendaPool, treacheryPool]);

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
    tfSettings,
    resetGame,
    win,
    lose,
    isPoolReady
  ]);

  const handleGuess = (guessTrue: boolean) => {
    if (win || lose) return;
    if (guessTrue === question?.isTrue) {
      setWin(true);
    } else {
      setLose(true);
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
        <div className="card-info">
          <h2>{question.card.name}</h2>
          {question.card.subname && <div className="subname">{question.card.subname}</div>}
          
          <div className="card-details">
            <span className="detail-badge">{getPackDisplayName(question.card.pack_code, question.card.pack_name)}</span>
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
            <div className={`image-obscure-box-${question.card.typeName}`} />
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