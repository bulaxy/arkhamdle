import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import { useStats } from '../../context/StatsContext';
import type { GameProps, TransformedCard } from '../../types';
import { filterBySettings, filterDuplicateOfCode } from '../../services/CardFilter';
import { useGameSync } from '../../hooks/useGameSync';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import MultipleChoiceGrid from '../../components/MultipleChoiceGrid/MultipleChoiceGrid';
import { generateHowManyQuestion, type TriviaQuestion } from '../shared/trivia/triviaLogic';
import './CountGuesser.scss';

export default function CountGuesser({ onPlayAgainOverride, streakModeName }: GameProps = {}) {
  const { cards, settings } = useGameContext();
  const { reportResult } = useStats();
  const modeName = 'Count Guesser';

  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [guessInputText, setGuessInputText] = useState('');
  const [showImages, setShowImages] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | number | undefined>(undefined);

  const { isClientWaiting, syncedData, syncData, isHost, isMultiplayer } = useGameSync<{
    questionText: string;
    correctAnswer: number;
    options: (string | number)[];
    matchingCardIds: string[];
  }>();

  const pool = useMemo(() => {
    let filtered = filterBySettings(cards, settings, 'countGuesser');
    filtered = filterDuplicateOfCode(filtered);
    if (settings.countGuesser.poolFilter === 'Player Cards Only') {
      filtered = filtered.filter(c => ['asset', 'event', 'skill', 'investigator'].includes(c.typeName));
    }
    return filtered;
  }, [cards, settings]);

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setGuessInputText('');
    setShowImages(false);
    setSelectedOption(undefined);
    
    const packsInPool = Array.from(new Set(pool.map(c => c.pack_name)));
    const useAllPacks = packsInPool.length <= 1 || Math.random() > (1 - (1/packsInPool.length));

    let finalPool = pool;
    let packNameForQuestion = "All Packs";

    if (useAllPacks) {
      if (settings.countGuesser.filteredPacks && settings.countGuesser.filteredPacks.length > 0) {
        packNameForQuestion = settings.countGuesser.filteredPacks.length === 1 ? settings.countGuesser.filteredPacks[0] : "Selected Packs";
      } else if (settings.countGuesser.useGlobalPackFilter && settings.filteredPacks.length > 0) {
        packNameForQuestion = settings.filteredPacks.length === 1 ? settings.filteredPacks[0] : "Selected Packs";
      }
    } else {
      const randomPack = packsInPool[Math.floor(Math.random() * packsInPool.length)];
      finalPool = pool.filter(c => c.pack_name === randomPack);
      packNameForQuestion = randomPack;
    }

    if (finalPool.length === 0) {
      if (isHost || !isMultiplayer) {
         // handle empty pool?
      }
      return;
    }

    if (isMultiplayer && !isHost) {
      return; // Wait for sync
    }

    const q = generateHowManyQuestion(finalPool, packNameForQuestion);
    syncData({
      questionText: q.questionText,
      correctAnswer: q.correctAnswer as number,
      options: q.options,
      matchingCardIds: q.matchingCards.map(c => c.id)
    });
  }, [
    pool, 
    settings.countGuesser.filteredPacks, 
    settings.countGuesser.useGlobalPackFilter, 
    settings.filteredPacks,
    isMultiplayer,
    isHost,
    syncData
  ]);

  useEffect(() => {
    if (syncedData) {
      setQuestion({
        questionText: syncedData.questionText,
        correctAnswer: syncedData.correctAnswer,
        options: syncedData.options,
        matchingCards: syncedData.matchingCardIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as TransformedCard[],
        mode: 'How Many'
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
    settings.countGuesser,
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

  const handleDirectInputSubmit = () => {
    if (!question || win || gaveUp) return;
    if (parseInt(guessInputText, 10) === question.correctAnswer) {
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
    if (win || gaveUp) return;
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
          <h1>Count Guesser</h1>
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
        <h1>Count Guesser</h1>
        <div className="game-header-row">
          <p>Challenge your mastery of card distributions and counts within the game.</p>
          <GameInfoButton
            gameRules={{
              title: 'Count Guesser',
              cardTypes: settings.countGuesser.poolFilter,
              answerEvaluation: 'Multiple Choice or Direct Input',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: "A specific criteria is given (e.g., \"How many Level 0 Seeker events are in the Core Set?\"). You must provide the exact count of matching cards. You have only one attempt per question, so think carefully before submitting your answer!"
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

            {settings.countGuesser.inputMode === 'Multiple Choice' && (
              <MultipleChoiceGrid
                options={question.options}
                onSelect={handleMultipleChoice}
                correctOption={isGameOver ? question.correctAnswer : undefined}
                selectedOption={selectedOption}
              />
            )}

            {!isGameOver && settings.countGuesser.inputMode === 'Direct Input' && (
              <div className="direct-input-section">
                <input 
                  type="number" 
                  value={guessInputText} 
                  onChange={(e) => setGuessInputText(e.target.value)}
                  placeholder="Enter a number..."
                  onKeyDown={(e) => e.key === 'Enter' && handleDirectInputSubmit()}
                />
                <button className="premium-btn" onClick={handleDirectInputSubmit}>Submit</button>
              </div>
            )}

            {!isGameOver && settings.countGuesser.inputMode !== 'Direct Input' && (
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
          item={{ fullName: question?.correctAnswer?.toString() || '' }}
          onPlayAgain={onPlayAgainOverride || resetGame}
          className="trivia-result-panel"
          showImage={false}
        >
          <div className="matching-cards">
            {(question?.matchingCards?.length ?? 0) > 0 && (
              <>
                <h4>Matching Cards ({question!.matchingCards.length})</h4>
                {question!.matchingCards.length > 3 && !showImages ? (
                  <button className="premium-btn mb-1rem" onClick={() => setShowImages(true)}>
                    Show Card Images
                  </button>
                ) : (
                  <div className="card-images">
                    {question!.matchingCards.map(c => (
                      <img key={c.id} src={c.imagesrc.startsWith('http') ? c.imagesrc : `https://arkhamdb.com${c.imagesrc}`} alt={c.name} />
                    ))}
                  </div>
                )}
                {(!showImages || question!.matchingCards.length > 3) && (
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
