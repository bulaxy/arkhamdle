import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import type { TransformedCard, GameProps } from '../../types';
import { filterBySettings, filterDuplicateOfCode, getCardFactionColors } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import MultipleChoiceGrid from '../../components/MultipleChoiceGrid/MultipleChoiceGrid';
import { generateWhichCardQuestion, type TriviaQuestion } from '../shared/trivia/triviaLogic';
import './GuessCardByTrait.scss';

export default function GuessCardByTrait({ onPlayAgainOverride }: GameProps = {}) {
  const { cards, settings } = useGameContext();

  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [showImages, setShowImages] = useState(false);

  const pool = useMemo(() => {
    let filtered = filterBySettings(cards, settings, 'guessCardByTrait');
    filtered = filterDuplicateOfCode(filtered);
    if (settings.guessCardByTrait.poolFilter === 'Player Cards Only') {
      filtered = filtered.filter(c => ['asset', 'event', 'skill', 'investigator'].includes(c.typeName));
    }
    return filtered;
  }, [cards, settings]);

  const allFilteredCards = useMemo(() => {
    const filtered = filterBySettings(cards, settings, 'guessCardByTrait');
    return filterDuplicateOfCode(filtered);
  }, [cards, settings]);

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setShowImages(false);
    
    const packsInPool = Array.from(new Set(pool.map(c => c.pack_name)));
    const useAllPacks = Math.random() > 0.5 || packsInPool.length <= 1;

    let finalPool = pool;
    let finalAllCards = allFilteredCards;

    if (useAllPacks) {
      // Use full pool
    } else {
      const randomPack = packsInPool[Math.floor(Math.random() * packsInPool.length)];
      finalPool = pool.filter(c => c.pack_name === randomPack);
      finalAllCards = allFilteredCards.filter(c => c.pack_name === randomPack);
    }

    if (finalPool.length === 0) return;

    const q = generateWhichCardQuestion(finalPool, finalAllCards);
    setQuestion(q);
  }, [pool, allFilteredCards]);

  // Initial load
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (pool.length > 0 && !hasInitialized.current) {
      resetGame();
      hasInitialized.current = true;
    }
  }, [pool, resetGame]);

  // Re-run if settings change significantly
  useEffect(() => {
    if (hasInitialized.current && (win || gaveUp)) {
      // Don't auto-reset if they're looking at a result, unless pool is empty
    } else if (pool.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetGame();
    }
  }, [
    settings.guessCardByTrait,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    resetGame,
    win,
    gaveUp,
    pool.length
  ]);

  const handleMultipleChoice = (option: string | number) => {
    if (win || gaveUp) return;
    if (option === question?.correctAnswer) {
      setWin(true);
    } else {
      setGaveUp(true);
    }
  };

  const handleCardGuess = (card: TransformedCard) => {
    if (!question) return;
    if (card.id === question.correctAnswer) {
      setWin(true);
    } else {
      setGaveUp(true);
    }
  };

  if (pool.length === 0) {
    return (
      <div className="trivia-container">
        <div className="trivia-header">
          <h1>Guess Card By Trait</h1>
          <p>No cards match your current filters. Please adjust your settings.</p>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const isGameOver = win || gaveUp;

  return (
    <div className="trivia-container">
      <div className="trivia-header">
        <h1>Guess Card By Trait</h1>
        <div className="game-header-row">
          <p>Identify the card based on its unique traits</p>
          <GameInfoButton
            gameRules={{
              title: 'Guess Card By Trait',
              cardTypes: settings.guessCardByTrait.poolFilter,
              answerEvaluation: 'Multiple Choice or Direct Input',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: "We will describe the unique combination of traits, types, and classes of a card. You get one try to identify it!"
            }}
          />
        </div>
      </div>

      <div className="trivia-question-section">
        <h2>{question.questionText}</h2>

        {!isGameOver && settings.guessCardByTrait.inputMode === 'Multiple Choice' && (
          <MultipleChoiceGrid
            options={question.options}
            onSelect={handleMultipleChoice}
            getLabel={(opt) => {
              if (typeof opt === 'string') {
                return allFilteredCards.find(c => c.id === opt)?.name || opt;
              }
              return opt;
            }}
          />
        )}

        {!isGameOver && settings.guessCardByTrait.inputMode === 'Direct Input' && (
          <div className="direct-input-section" style={{ maxWidth: '600px' }}>
            <GuessInput
              options={allFilteredCards}
              guesses={[]}
              onGuess={handleCardGuess}
              placeholder="Type card name..."
              onGiveUp={() => setGaveUp(true)}
              giveUpThreshold={1} // give up button always visible essentially
              getDisplayText={(c) => c.name}
              getOptionColors={getCardFactionColors}
            />
          </div>
        )}

        {!isGameOver && settings.guessCardByTrait.inputMode !== 'Direct Input' && (
          <div className="trivia-actions">
            <button className="premium-btn guess-give-up" onClick={() => setGaveUp(true)}>Give Up</button>
          </div>
        )}
      </div>

      {isGameOver && (
        <ResultPanel
          win={win}
          item={{ fullName: question.correctCardDisplay || '' }}
          onPlayAgain={onPlayAgainOverride || resetGame}
          className="trivia-result-panel"
          showImage={false}
        >
          <div className="matching-cards">
            {question.matchingCards.length > 0 && (
              <>
                <h4>Matching Card</h4>
                {!showImages ? (
                  <button className="premium-btn" onClick={() => setShowImages(true)} style={{ marginBottom: '1rem' }}>
                    Show Card Image
                  </button>
                ) : (
                  <div className="card-images">
                    {question.matchingCards.map(c => (
                      <img key={c.id} src={c.imagesrc.startsWith('http') ? c.imagesrc : `https://arkhamdb.com${c.imagesrc}`} alt={c.name} />
                    ))}
                  </div>
                )}
                {(!showImages) && (
                  <div className="card-list">
                    {question.matchingCards.map(c => (
                      <div key={c.id} className="card-item">{c.fullName}</div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ResultPanel>
      )}
    </div>
  );
}
