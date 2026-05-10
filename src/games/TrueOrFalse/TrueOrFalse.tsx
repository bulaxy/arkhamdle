import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import type { TransformedCard, GameProps } from '../../types';
import { filterBySettings, filterDuplicateOfCode, getCardFactionColors } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import falseTraitsData from '../../data/false_traits.json';
import './TrueOrFalse.scss';

export default function TrueOrFalse({ onPlayAgainOverride }: GameProps = {}) {
  const { cards, settings } = useGameContext();

  const [question, setQuestion] = useState<{
    card: TransformedCard;
    isTrue: boolean;
    displayedTraits: string;
  } | null>(null);

  const [win, setWin] = useState(false);
  const [lose, setLose] = useState(false);

  const pool = useMemo(() => {
    let filtered = filterBySettings(cards, settings, 'trueOrFalse');
    filtered = filterDuplicateOfCode(filtered);
    
    // Only cards with traits
    filtered = filtered.filter(c => c.traits && c.traits.length > 0);
    
    // Only cards that have an entry in false_traits.json so we can reliably generate false traits
    const falseTraitsRecord = falseTraitsData as Record<string, string[]>;
    filtered = filtered.filter(c => !!falseTraitsRecord[c.id] && falseTraitsRecord[c.id].length > 0);
    
    return filtered;
  }, [cards, settings]);

  const resetGame = useCallback(() => {
    setWin(false);
    setLose(false);

    if (pool.length === 0) return;

    const randomCard = pool[Math.floor(Math.random() * pool.length)];
    const isTrue = Math.random() >= 0.5;
    
    let displayedTraits = randomCard.traits.join('. ') + '.';
    
    if (!isTrue) {
      const falseTraitsRecord = falseTraitsData as Record<string, string[]>;
      const falseOptions = falseTraitsRecord[randomCard.id];
      if (falseOptions && falseOptions.length > 0) {
        displayedTraits = falseOptions[Math.floor(Math.random() * falseOptions.length)];
      }
    }

    setQuestion({
      card: randomCard,
      isTrue: displayedTraits === (randomCard.traits.join('. ') + '.'),
      displayedTraits
    });
  }, [pool]);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (pool.length > 0 && !hasInitialized.current) {
      resetGame();
      hasInitialized.current = true;
    }
  }, [pool, resetGame]);

  useEffect(() => {
    if (hasInitialized.current && (win || lose)) {
      // Game over, don't auto-reset
    } else if (pool.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetGame();
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
    pool.length
  ]);

  const handleGuess = (guessTrue: boolean) => {
    if (win || lose) return;
    if (guessTrue === question?.isTrue) {
      setWin(true);
    } else {
      setLose(true);
    }
  };

  if (pool.length === 0) {
    return (
      <div className="true-or-false-container">
        <div className="trivia-header">
          <h1>True Or False</h1>
          <p>No cards match your current filters. Please adjust your settings.</p>
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
          <p>Does this card have these traits?</p>
          <GameInfoButton
            gameRules={{
              title: 'True Or False',
              cardTypes: 'All Cards with defined false traits',
              answerEvaluation: 'True or False',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: "We will show you a card's name, subname, pack, and XP. You must guess if the displayed traits belong to this card or not."
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
            <span className="xp-badge" style={{ background: xpBackground }}>
              {question.card.xp !== undefined && question.card.xp !== null ? `XP: ${question.card.xp}` : 'No XP'}
            </span>
          </div>
        </div>

        <div className="question-box">
          <p>Are these the correct traits for this card?</p>
          <div className="traits-display">{question.displayedTraits}</div>
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
          <p>The actual traits are: <strong>{question.card.traits.join('. ') + '.'}</strong></p>
        </ResultPanel>
      )}
    </div>
  );
}
