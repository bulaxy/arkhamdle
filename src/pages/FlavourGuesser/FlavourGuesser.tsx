import { useEffect, useMemo, useState } from 'react';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import { useGameContext } from '../../context/GameContext';
import type { TransformedCard } from '../../types';
import { filterForFlavourGuesser, filterDuplicateOfCode, deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, findDuplicateNames, getCardFactionColors } from '../../services/CardFilter';
import './FlavourGuesser.scss';

export default function FlavourGuesser() {
  const { filteredCards, settings } = useGameContext();
  
  const flavourCards = useMemo(() => {
    // Apply type filters from settings
    const typeFiltered = filterForFlavourGuesser(filteredCards, settings.flavourGuesserTypeFilters);
    // Remove duplicate_of_code cards
    const noDupes = filterDuplicateOfCode(typeFiltered);
    // Only keep cards with flavour text
    const withFlavor = noDupes.filter(c => c.flavor && c.flavor.trim().length > 0);
    // Deduplicate by evaluation criteria
    return deduplicateByEvaluationCriteria(
      withFlavor,
      GAME_EVALUATION_CRITERIA.flavourGuesser
    ) as TransformedCard[];
  }, [filteredCards, settings.flavourGuesserTypeFilters]);

  const dupeNames = useMemo(() => findDuplicateNames(flavourCards), [flavourCards]);

  const getDisplayText = (card: TransformedCard): string => {
    if (!dupeNames.has(card.name)) return card.name;
    return `${card.name} (${card.pack_name})`;
  };

  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [win, setWin] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState<TransformedCard[]>([]);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    resetGame();
  }, [flavourCards]);

  const resetGame = () => {
    setWin(false);
    setGaveUp(false);
    setWrongGuesses([]);
    if (flavourCards.length > 0) {
      setAnswer(flavourCards[Math.floor(Math.random() * flavourCards.length)]);
    }
  };

  const submitGuess = (card: TransformedCard) => {
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <p>Guess the card by its flavour text!</p>
          <GameInfoButton
            gameName="FlavourGuesser"
            gameRules={{
              title: 'Flavour Text Guesser',
              cardTypes: 'Asset, Event, Skill, Enemy, Treachery, Location, Story (Configurable via Type Filters in Settings)',
              answerEvaluation: 'Must match: Class, Pack, Name, XP',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter, Type filters',
            }}
          />
        </div>
      </div>

      <div className="glass-panel flavour-panel">
        <div className="flavour-text">
          "{answer?.flavor}"
        </div>

        {wrongGuesses.length >= 3 && !win && answer && (
          <div className="flavour-hint">
            💡 Hint — Class: {answer.class.join(', ')}
          </div>
        )}

        {win || gaveUp ? (
          <ResultPanel win={win} item={answer} onPlayAgain={resetGame} className="flavour-result" />
        ) : (
          <div>
            <GuessInput
              options={flavourCards}
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
