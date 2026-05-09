import { useCallback, useEffect, useMemo, useState } from 'react';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import { useGameContext } from '../../hooks/useGameContext';
import type { TransformedCard } from '../../types';
import { filterForFlavourGuesser, filterDuplicateOfCode, deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, findDuplicateNames, getCardFactionColors, filterBySettings } from '../../services/CardFilter';
import './FlavourGuesser.scss';

export default function FlavourGuesser() {
  const { cards, settings } = useGameContext();

  const { guessableCards, answerPool } = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'flavourGuesser');
    // Apply type filters from settings
    const typeFiltered = filterForFlavourGuesser(baseFiltered, settings.flavourGuesser.typeFilters);
    // Remove duplicate_of_code cards
    const noDupes = filterDuplicateOfCode(typeFiltered);
    
    // Deduplicate by evaluation criteria for the dropdown
    const guessable = deduplicateByEvaluationCriteria(
      noDupes,
      GAME_EVALUATION_CRITERIA.flavourGuesser
    ) as TransformedCard[];

    // Only keep cards with flavour text for picking the answer
    const answers = guessable.filter(c => c.flavor && c.flavor.trim().length > 0);

    return { guessableCards: guessable, answerPool: answers };
  }, [cards, settings]);

  const dupeNames = useMemo(() => findDuplicateNames(guessableCards), [guessableCards]);

  const getDisplayText = (card: TransformedCard): string => {
    if (!dupeNames.has(card.name)) return card.name;
    return `${card.name} (${card.pack_name})`;
  };

  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [win, setWin] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState<TransformedCard[]>([]);
  const [gaveUp, setGaveUp] = useState(false);

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setWrongGuesses([]);
    if (answerPool.length > 0) {
      const selected = answerPool[Math.floor(Math.random() * answerPool.length)];
      console.log('[FlavourGuesser] Answer:', selected);
      setAnswer(selected);
    }
  }, [answerPool]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    settings.flavourGuesser,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    cards,
    resetGame
  ]);

  const submitGuess = (card: TransformedCard) => {
    console.log('[FlavourGuesser] Guess:', card);
    if (card.id === answer?.id) {
      setWin(true);
    } else {
      setWrongGuesses([card, ...wrongGuesses]);
    }
  };

  return (
    <div className="flavour-container">
      <div className="flavour-header">
        <h1>Flavour Text Guesser</h1>
        <div className="game-header-row">
          <p>Guess the card by its flavour text!</p>
          <GameInfoButton
            gameRules={{
              title: 'Flavour Text Guesser',
              cardTypes: 'Asset, Event, Skill, Enemy, Treachery, Location, Story (Configurable via Type Filters in Settings)',
              answerEvaluation: 'Must match: Class, Pack, Name, XP',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter, Type filters',
              howToPlay: 'A flavour text of a card is shown, guess what card is it?\nHints available after 3 wrong guesses.'
            }}
          />
        </div>
      </div>

      <div className="glass-panel flavour-panel">
        <div className="flavour-text">
          "{answer?.flavor}"
        </div>

        {settings.enableHints && wrongGuesses.length >= 3 && !win && answer && (
          <div className="flavour-hint">
            💡 Hint — Class: {answer.class.join(', ')}
            {wrongGuesses.length >= 5 && ` | Pack: ${answer.pack_name}`}
          </div>
        )}

        {win || gaveUp ? (
          <ResultPanel win={win} item={answer} onPlayAgain={resetGame} className="flavour-result" />
        ) : (
          <div>
            <GuessInput
              options={guessableCards}
              guesses={wrongGuesses}
              onGuess={submitGuess}
              placeholder="Type card name..."
              onGiveUp={() => setGaveUp(true)}
              giveUpThreshold={5}
              className="flavour-input-wrapper"
              getDisplayText={getDisplayText}
              getOptionColors={getCardFactionColors}
            />

            {wrongGuesses.length > 0 && (
              <div className="flavour-wrong-guesses">
                {wrongGuesses.map(g => (
                  <div key={g.id} className="flavour-wrong-badge">
                    {g.fullName}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
