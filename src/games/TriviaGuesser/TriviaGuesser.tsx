import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import type { TransformedCard, GameProps } from '../../types';
import { filterBySettings, filterDuplicateOfCode, getCardFactionColors } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import { generateTriviaQuestion, type TriviaQuestion } from './triviaLogic';
import './TriviaGuesser.scss';

export default function TriviaGuesser({ onPlayAgainOverride }: GameProps = {}) {
  const { cards, settings } = useGameContext();

  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [win, setWin] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [guessInputText, setGuessInputText] = useState('');
  const [showImages, setShowImages] = useState(false);

  const pool = useMemo(() => {
    let filtered = filterBySettings(cards, settings, 'triviaGuesser');
    filtered = filterDuplicateOfCode(filtered);
    if (settings.triviaGuesser.poolFilter === 'Player Cards Only') {
      filtered = filtered.filter(c => ['asset', 'event', 'skill', 'investigator'].includes(c.typeName));
    }
    return filtered;
  }, [cards, settings]);

  const allFilteredCards = useMemo(() => {
    const filtered = filterBySettings(cards, settings, 'triviaGuesser');
    return filterDuplicateOfCode(filtered);
  }, [cards, settings]);

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setGuessInputText('');
    setShowImages(false);
    
    const packsInPool = Array.from(new Set(pool.map(c => c.pack_name)));
    const useAllPacks = Math.random() > 0.5 || packsInPool.length <= 1;

    let finalPool = pool;
    let finalAllCards = allFilteredCards;
    let packNameForQuestion = "All Packs";

    if (useAllPacks) {
      if (settings.triviaGuesser.filteredPacks && settings.triviaGuesser.filteredPacks.length > 0) {
        packNameForQuestion = settings.triviaGuesser.filteredPacks.length === 1 ? settings.triviaGuesser.filteredPacks[0] : "Selected Packs";
      } else if (settings.triviaGuesser.useGlobalPackFilter && settings.filteredPacks.length > 0) {
        packNameForQuestion = settings.filteredPacks.length === 1 ? settings.filteredPacks[0] : "Selected Packs";
      }
    } else {
      const randomPack = packsInPool[Math.floor(Math.random() * packsInPool.length)];
      finalPool = pool.filter(c => c.pack_name === randomPack);
      finalAllCards = allFilteredCards.filter(c => c.pack_name === randomPack);
      packNameForQuestion = randomPack;
    }

    const q = generateTriviaQuestion(finalPool, finalAllCards, packNameForQuestion, settings.triviaGuesser.questionType);
    setQuestion(q);
  }, [
    pool, 
    allFilteredCards, 
    settings.triviaGuesser.questionType, 
    settings.triviaGuesser.filteredPacks, 
    settings.triviaGuesser.useGlobalPackFilter, 
    settings.filteredPacks
  ]);

  // Initial load
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (pool.length > 0 && !hasInitialized.current) {
      resetGame();
      hasInitialized.current = true;
    }
  }, [pool, resetGame]);

  // Re-run if settings change significantly (in a real app we might only do this on explicitly starting a new game, but this is fine)
  useEffect(() => {
    if (hasInitialized.current && (win || gaveUp)) {
      // Don't auto-reset if they're looking at a result, unless pool is empty
    } else if (pool.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetGame();
    }
  }, [
    settings.triviaGuesser,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    settings.triviaGuesser.poolFilter,
    settings.triviaGuesser.questionType,
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
      // Allow multiple guesses? Standard wordle allows multiple, but multiple choice usually means 1 try or you get it wrong.
      // Let's just say if you click wrong, you lose (gaveUp = true).
      setGaveUp(true);
    }
  };

  const handleDirectInputSubmit = () => {
    if (!question) return;
    if (question.mode === 'How Many') {
      if (parseInt(guessInputText, 10) === question.correctAnswer) {
        setWin(true);
      } else {
        setGaveUp(true);
      }
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
          <h1>Trivia Guesser</h1>
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
        <h1>Trivia Guesser</h1>
        <div className="game-header-row">
          <p>Test your Arkham Horror LCG knowledge</p>
          <GameInfoButton
            gameRules={{
              title: 'Trivia Guesser',
              cardTypes: settings.triviaGuesser.poolFilter,
              answerEvaluation: 'Multiple Choice or Direct Input',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: "Answer trivia questions about the Arkham Horror LCG card pool. You get one try per question!"
            }}
          />
        </div>
      </div>

      <div className="trivia-question-section">
        <h2>{question.questionText}</h2>

        {!isGameOver && settings.triviaGuesser.inputMode === 'Multiple Choice' && (
          <div className="multiple-choice-grid">
            {question.options.map((opt, i) => (
              <button 
                key={i} 
                className="choice-btn"
                onClick={() => handleMultipleChoice(opt)}
              >
                {question.mode === 'Which Card' && typeof opt === 'string' 
                  ? (allFilteredCards.find(c => c.id === opt)?.name || opt) 
                  : opt}
              </button>
            ))}
          </div>
        )}

        {!isGameOver && settings.triviaGuesser.inputMode === 'Direct Input' && (
          <>
            {question.mode === 'How Many' ? (
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
            ) : (
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
          </>
        )}

        {!isGameOver && settings.triviaGuesser.inputMode !== 'Direct Input' && (
          <div className="trivia-actions">
            <button className="give-up-btn" onClick={() => setGaveUp(true)}>Give Up</button>
          </div>
        )}
      </div>

      {isGameOver && (
        <ResultPanel
          win={win}
          item={{ fullName: question.mode === 'Which Card' ? question.correctCardDisplay || '' : question.correctAnswer?.toString() || '' }}
          onPlayAgain={onPlayAgainOverride || resetGame}
          className="trivia-result-panel"
          showImage={false}
        >
          <div className="matching-cards">
            {question.matchingCards.length > 0 && (
              <>
                <h4>Matching Cards ({question.matchingCards.length})</h4>
                {question.matchingCards.length > 3 && !showImages ? (
                  <button className="premium-btn" onClick={() => setShowImages(true)} style={{ marginBottom: '1rem' }}>
                    Show Card Images
                  </button>
                ) : (
                  <div className="card-images">
                    {question.matchingCards.map(c => (
                      <img key={c.id} src={c.imagesrc.startsWith('http') ? c.imagesrc : `https://arkhamdb.com${c.imagesrc}`} alt={c.name} />
                    ))}
                  </div>
                )}
                {(!showImages || question.matchingCards.length > 3) && (
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
