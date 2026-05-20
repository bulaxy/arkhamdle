import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import { useStats } from '../../context/StatsContext';
import type { TransformedCard, GameProps } from '../../types';
import { filterBySettings, filterDuplicateOfCode, getCardFactionColors } from '../../services/CardFilter';
import { useGameSync } from '../../hooks/useGameSync';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import MultipleChoiceGrid from '../../components/MultipleChoiceGrid/MultipleChoiceGrid';
import { generateWhichCardQuestion, type TriviaQuestion } from '../shared/trivia/triviaLogic';
import './GuessCardByTrait.scss';

export default function GuessCardByTrait({ onPlayAgainOverride, streakModeName }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const { reportResult } = useStats();
  const modeName = 'Guess Card By Trait';

  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | number | undefined>(undefined);

  const { isClientWaiting, syncedData, syncData, isHost, isMultiplayer } = useGameSync<{
    questionText: string;
    correctAnswer: string | number;
    options: (string | number)[];
    correctCardDisplay: string;
    matchingCardIds: string[];
  }>();

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
    setSelectedOption(undefined);
    
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

    if (finalPool.length === 0) {
      if (isHost || !isMultiplayer) {
         // handle empty pool?
      }
      return;
    }

    if (isMultiplayer && !isHost) {
      return; // wait for sync
    }

    const q = generateWhichCardQuestion(finalPool, finalAllCards);
    syncData({
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      options: q.options,
      correctCardDisplay: q.correctCardDisplay || '',
      matchingCardIds: q.matchingCards.map(c => c.id)
    });
  }, [pool, allFilteredCards, isMultiplayer, isHost, syncData]);

  useEffect(() => {
    if (syncedData) {
      setQuestion({
        questionText: syncedData.questionText,
        correctAnswer: syncedData.correctAnswer,
        options: syncedData.options,
        correctCardDisplay: syncedData.correctCardDisplay,
        matchingCards: syncedData.matchingCardIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as TransformedCard[],
        mode: 'Which Card'
      });
    }
  }, [syncedData, cards]);

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
    setSelectedOption(option);
    if (option === question?.correctAnswer) {
      setWin(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: true, isMultipleChoice: true }
      }));
    } else {
      setGaveUp(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: false, isMultipleChoice: true }
      }));
    }
  };

  const handleCardGuess = (card: TransformedCard) => {
    if (!question || win || gaveUp) return;
    if (card.id === question.correctAnswer) {
      setWin(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, true);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: true, isMultipleChoice: false }
      }));
    } else {
      setGaveUp(true);
      reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
        detail: { mode: modeName, solved: false, isMultipleChoice: false }
      }));
    }
  };

  const handleGiveUp = () => {
    setGaveUp(true);
    reportResult(streakModeName ? [modeName, streakModeName] : modeName, false);
    window.dispatchEvent(new CustomEvent('MULTIPLAYER_STATS_UPDATE', {
      detail: { mode: modeName, solved: false, isMultipleChoice: false }
    }));
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

  if (!question && !isMultiplayer) return null;

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
        {(isClientWaiting || !question) ? (
          <div className="waiting-for-host">Waiting for Host...</div>
        ) : (
          <>
            <h2>{question.questionText}</h2>

            {settings.guessCardByTrait.inputMode === 'Multiple Choice' && (
              <MultipleChoiceGrid
                options={question.options}
                onSelect={handleMultipleChoice}
                getLabel={(opt) => {
                  if (typeof opt === 'string') {
                    const card = allFilteredCards.find(c => c.id === opt);
                    if (card) {
                      return card.subname ? `${card.name} - ${card.subname}` : card.name;
                    }
                    return opt;
                  }
                  return opt;
                }}
                correctOption={isGameOver ? question.correctAnswer : undefined}
                selectedOption={selectedOption}
              />
            )}

            {!isGameOver && settings.guessCardByTrait.inputMode === 'Direct Input' && (
              <div className="direct-input-section max-w-600">
                <GuessInput
                  options={allFilteredCards}
                  guesses={[]}
                  onGuess={handleCardGuess}
                  placeholder="Type card name..."
                  onGiveUp={handleGiveUp}
                  giveUpThreshold={1} 
                  getDisplayText={(c) => c.subname ? `${c.name} - ${c.subname}` : c.name}
                  getOptionColors={getCardFactionColors}
                />
              </div>
            )}

            {!isGameOver && settings.guessCardByTrait.inputMode !== 'Direct Input' && (
              <div className="trivia-actions">
                <button className="premium-btn guess-give-up" onClick={handleGiveUp}>Give Up</button>
              </div>
            )}
          </>
        )}
      </div>

      {isGameOver && (
        <ResultPanel
          win={win}
          item={{ fullName: question?.correctCardDisplay || '' }}
          onPlayAgain={onPlayAgainOverride || resetGame}
          className="trivia-result-panel"
          showImage={false}
        >
          <div className="matching-cards">
            {(question?.matchingCards?.length ?? 0) > 0 && (
              <>
                <h4>Matching Card</h4>
                {!showImages ? (
                  <button className="premium-btn mb-1rem" onClick={() => setShowImages(true)}>
                    Show Card Image
                  </button>
                ) : (
                  <div className="card-images">
                    {question!.matchingCards.map(c => (
                      <img key={c.id} src={c.imagesrc.startsWith('http') ? c.imagesrc : `https://arkhamdb.com${c.imagesrc}`} alt={c.name} />
                    ))}
                  </div>
                )}
                {(!showImages) && (
                  <div className="card-list">
                    {question!.matchingCards.map(c => (
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
