import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import { type TransformedCard, type GameProps, type TrueOrFalseSettings, TypeName } from '../../types';
import { filterBySettings, filterDuplicateOfCode, getCardFactionColors } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import falseTraitsData from '../../data/false_traits.json';
import { buildPackCodeToGroupMap, packSameOrNewerThan } from '../../data/packStructure';
import { cardHasKeyword } from '../shared/trivia/triviaTemplates';
import './TrueOrFalse.scss';

const packCodeToGroup = buildPackCodeToGroupMap();

function getPackGroup(packCode: string): string {
  return (packCodeToGroup.get(packCode) || 'OTHER').toLowerCase();
}

type QuestionType = 
  | 'Fight' | 'Horror' | 'Damage' | 'Evade' | 'Health' 
  | 'Retaliate' | 'Hunter' | 'Alert' | 'Aloof' | 'Elusive' | 'Victory'
  | 'Prey' | 'Massive' | 'Spawn' | 'Traits';

interface GameQuestion {
  card: TransformedCard;
  isTrue: boolean;
  questionText: string;
  displayedValue: string;
  type: QuestionType;
}

function generateFalseStatValue(
  val: number,
  type: QuestionType,
  isElite: boolean
): number | null {
  const isPlus = Math.random() >= 0.5;
  let fakeValue = val + (isPlus ? 1 : -1);

  if (type === 'Damage' || type === 'Horror') {
    if (fakeValue < 0) fakeValue = val + 1;
    if (fakeValue > 3) fakeValue = val - 1;
    if (!isElite && fakeValue > 2) fakeValue = Math.min(fakeValue, 2);
    // If it's still same as val (e.g. non-elite val 2, +1 became 3 then capped to 2)
    if (fakeValue === val) fakeValue = val - 1;
    if (fakeValue < 0 || fakeValue > (isElite ? 3 : 2)) return null;
  } else if (type === 'Fight' || type === 'Health' || type === 'Evade') {
    if (fakeValue <= 0) fakeValue = val + 1;
    if (!isElite && fakeValue > 5) fakeValue = val - 1;
    if (fakeValue === val) return null; // No valid +/-1 within bounds
    if (fakeValue <= 0 || (!isElite && fakeValue > 5)) return null;
  } else if (type === 'Victory') {
    if (fakeValue <= 0) fakeValue = val + 1;
    if (isElite && fakeValue === 2) {
      // Special elite victory rule: can't be 2. If it was 1, go to 3 (if possible)
      fakeValue = val === 1 ? 3 : 1; 
    }
    if (fakeValue === val || fakeValue <= 0) return null;
  }

  return fakeValue === val ? null : fakeValue;
}

export default function TrueOrFalse({ onPlayAgainOverride }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const tfSettings = settings.trueOrFalse as TrueOrFalseSettings;

  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [win, setWin] = useState(false);
  const [lose, setLose] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const traitPool = useMemo(() => {
    let filtered = filterBySettings(cards, settings, 'trueOrFalse');
    filtered = filterDuplicateOfCode(filtered);
    filtered = filtered.filter(c => c.traits && c.traits.length > 0);
    const falseTraitsRecord = falseTraitsData as Record<string, string[]>;
    filtered = filtered.filter(c => !!falseTraitsRecord[c.id] && falseTraitsRecord[c.id].length > 0);
    return filtered;
  }, [cards, settings]);

  const enemyPool = useMemo(() => {
    let filtered = filterBySettings(cards, settings, 'trueOrFalse');
    filtered = filterDuplicateOfCode(filtered);
    filtered = filtered.filter(c => c.typeName === TypeName.ENEMY);
    return filtered;
  }, [cards, settings]);

  const resetGame = useCallback(() => {
    setWin(false);
    setLose(false);
    setImageLoaded(false);

    const generateQuestion = (): GameQuestion | null => {
      const availableModes: QuestionType[] = [];
      if (tfSettings.traitMode && traitPool.length > 0) availableModes.push('Traits');
      if (tfSettings.enemyStatsMode && enemyPool.length > 0) availableModes.push('Fight'); 

      if (availableModes.length === 0) return null;

      const selectedMode = availableModes[Math.floor(Math.random() * availableModes.length)];

      if (selectedMode === 'Traits') {
        const randomCard = traitPool[Math.floor(Math.random() * traitPool.length)];
        const isTrue = Math.random() >= 0.5;
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
      } else {
        // Enemy Stats Mode
        const randomCard = enemyPool[Math.floor(Math.random() * enemyPool.length)];
        const isElite = randomCard.traits.some(t => t.toLowerCase() === 'elite');
        const group = getPackGroup(randomCard.pack_code);

        const options: { type: QuestionType; weight: number }[] = [
          { type: 'Fight', weight: 1 },
          { type: 'Horror', weight: 1 },
          { type: 'Damage', weight: 1 },
          { type: 'Evade', weight: 1 },
          { type: 'Retaliate', weight: 1.5 },
          { type: 'Hunter', weight: 1.5 },
          { type: 'Spawn', weight: 1.5 }
        ];

        if (randomCard.health !== 0) {
          options.push({ type: 'Health', weight: 1 });
        }
        if (packSameOrNewerThan(group, 'tfa')) options.push({ type: 'Alert', weight: 1.5 });
        if (packSameOrNewerThan(group, 'dwl')) options.push({ type: 'Aloof', weight: 0.5 });
        if (packSameOrNewerThan(group, 'fhv')) options.push({ type: 'Elusive', weight: 1.5 });
        if (randomCard.victory !== undefined || isElite) options.push({ type: 'Victory', weight: 0.5 });
        
        if (isElite) {
          options.push({ type: 'Prey', weight: 1.5 });
          options.push({ type: 'Massive', weight: 1.5 });
        }

        // Weighted selection
        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        let selectedOption = options[0].type;
        for (const opt of options) {
          if (randomWeight < opt.weight) {
            selectedOption = opt.type;
            break;
          }
          randomWeight -= opt.weight;
        }

        const isTrue = Math.random() >= 0.5;
        let questionText: string;
        let displayedValue: string;

        const keywordTraits = ['Retaliate', 'Alert', 'Hunter', 'Elusive', 'Prey', 'Massive', 'Aloof', 'Spawn'];
        
        if (keywordTraits.includes(selectedOption)) {
          // Get only keywords allowed for this card's pack
          const allowedKeywords = keywordTraits.filter(k => {
            if (k === 'Alert') return packSameOrNewerThan(group, 'tfa');
            if (k === 'Aloof') return packSameOrNewerThan(group, 'dwl');
            if (k === 'Elusive') return packSameOrNewerThan(group, 'fhv');
            return true;
          });

          const hasKeywords = allowedKeywords.filter(k => cardHasKeyword(randomCard, k));
          const hasNotKeywords = allowedKeywords.filter(k => !cardHasKeyword(randomCard, k));

          if (isTrue) {
            if (hasKeywords.length === 0) return null;
            displayedValue = hasKeywords.includes(selectedOption) 
              ? selectedOption 
              : hasKeywords[Math.floor(Math.random() * hasKeywords.length)];
          } else {
            if (hasNotKeywords.length === 0) return null;
            displayedValue = hasNotKeywords.includes(selectedOption) 
              ? selectedOption 
              : hasNotKeywords[Math.floor(Math.random() * hasNotKeywords.length)];
          }
          questionText = `Does this enemy have the ${displayedValue} keyword?`;
          displayedValue = '';
        } else {
          // Stats logic
          let actualValue: number | undefined;
          let label: string = selectedOption;
          
          switch (selectedOption) {
            case 'Fight': actualValue = randomCard.enemy_fight; break;
            case 'Evade': actualValue = randomCard.enemy_evade; break;
            case 'Health': 
              actualValue = randomCard.health; 
              if (randomCard.health_per_investigator) label = 'Health (per investigator)';
              break;
            case 'Damage': actualValue = randomCard.enemy_damage; break;
            case 'Horror': actualValue = randomCard.enemy_horror; break;
            case 'Victory': actualValue = randomCard.victory ?? 0; break;
          }

          const val = actualValue ?? 0;
          let fakeValue = val;

          if (!isTrue) {
            const result = generateFalseStatValue(val, selectedOption, isElite);
            if (result === null) return null; // Failure, try again
            fakeValue = result;
          }

          questionText = `Is the ${label.toLowerCase()} value of this enemy ${fakeValue}?`;
          displayedValue = ''; 
        }

        return {
          card: randomCard,
          isTrue,
          questionText,
          displayedValue,
          type: selectedOption
        };
      }
    };

    // Try to find a valid question
    let attempts = 0;
    while (attempts < 50) {
      const q = generateQuestion();
      if (q) {
        setQuestion(q);
        return;
      }
      attempts++;
      if (attempts % 10 === 0) {
        console.error(`TrueOrFalse: Failed to generate question after ${attempts} attempts. Retrying with new random selection...`);
      }
    }
    
    console.error('TrueOrFalse: Failed to generate question after 50 attempts. Giving up.');
  }, [tfSettings, traitPool, enemyPool]);

  const hasInitialized = useRef(false);
  useEffect(() => {
    const poolReady = (tfSettings.traitMode && traitPool.length > 0) || (tfSettings.enemyStatsMode && enemyPool.length > 0);
    if (poolReady && !hasInitialized.current) {
      resetGame();
      hasInitialized.current = true;
    }
  }, [traitPool, enemyPool, resetGame, tfSettings]);

  useEffect(() => {
    if (hasInitialized.current && (win || lose)) {
      // Game over
    } else {
      const poolReady = (tfSettings.traitMode && traitPool.length > 0) || (tfSettings.enemyStatsMode && enemyPool.length > 0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (poolReady) resetGame();
    }
  }, [
    settings.trueOrFalse,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    resetGame,
    win,
    lose,
    tfSettings.enemyStatsMode,
    tfSettings.traitMode,
    traitPool.length,
    enemyPool.length
  ]);

  const handleGuess = (guessTrue: boolean) => {
    console.log(question)
    if (win || lose) return;
    if (guessTrue === question?.isTrue) {
      setWin(true);
    } else {
      setLose(true);
    }
  };

  const poolReady = (tfSettings.traitMode && traitPool.length > 0) || (tfSettings.enemyStatsMode && enemyPool.length > 0);
  if (!poolReady) {
    return (
      <div className="true-or-false-container">
        <div className="trivia-header">
          <h1>True Or False</h1>
          <p>No cards match your current filters and mode settings. Please adjust your settings.</p>
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
              howToPlay: "We will show you a card's name, subname, pack, and XP. You must guess if the displayed information is true or false."
            }}
          />
        </div>
      </div>

      <div className="trivia-question-section">
        <div className="card-info">
          <h2>{question.card.name}</h2>
          {question.card.subname && <div className="subname">{question.card.subname}</div>}
          
          <div className="card-details">
            <span className="detail-badge">{question.card.pack_name}</span>
            {question.type === 'Traits' && question.card.xp !== undefined && question.card.xp !== null && (
              <span className="xp-badge" style={{ background: xpBackground }}>
                XP: {question.card.xp}
              </span>
            )}
          </div>
        </div>

        {!isGameOver && question.type !== 'Traits' && question.card.imagesrc && (
          <div className="enemy-image-wrapper">
            {!imageLoaded && (
              <div className="image-loading-placeholder">
                <div className="spinner" />
              </div>
            )}
            <img 
              src={`https://arkhamdb.com${question.card.imagesrc}`} 
              alt={question.card.name} 
              className="enemy-preview-image"
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
            <div className="image-obscure-box" />
          </div>
        )}

        <div className="question-box">
          <p>{question.questionText}</p>
          <div className="traits-display">{question.displayedValue}</div>
        </div>

        {!isGameOver && (
          <div className="true-false-actions">
            <button className="tf-btn btn-true" onClick={() => handleGuess(true)}>True</button>
            <button className="tf-btn btn-false" onClick={() => handleGuess(false)}>False</button>
          </div>
        )}
      </div>

      {isGameOver && (
        <ResultPanel
          win={win}
          item={{ fullName: question.card.fullName, imagesrc: question.card.imagesrc }}
          onPlayAgain={onPlayAgainOverride || resetGame}
        >
          {question.type === 'Traits' ? (
            <p>The actual traits are: <strong>{question.card.traits.join('. ') + '.'}</strong></p>
          ) : (
            <p>The correct answer was: <strong>{question.isTrue ? 'True' : 'False'}</strong></p>
          )}
        </ResultPanel>
      )}
    </div>
  );
}
