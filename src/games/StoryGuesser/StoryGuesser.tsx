import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import type { TransformedCard, GameProps } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, findDuplicateNames, getCardFactionColors, filterDuplicateOfCode, filterBySettings } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import '../../components/GuessGrid/GuessGrid.scss';
import './StoryGuesser.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

export default function StoryGuesser({ onPlayAgainOverride }: GameProps = {}) {
  const { cards, settings } = useGameContext();

  const uniqueInvestigators = useMemo(() => {
    const baseFiltered = filterBySettings(cards, settings, 'storyGuesser');
    const investigators = baseFiltered.filter(c => c.typeName === 'investigator');
    const withFlavor = investigators.filter(inv => inv.back_flavor);
    const noDupes = filterDuplicateOfCode(withFlavor);
    return deduplicateByEvaluationCriteria(
      noDupes,
      GAME_EVALUATION_CRITERIA.storyGuesser
    );
  }, [cards, settings]);

  const dupeNames = useMemo(() => findDuplicateNames(uniqueInvestigators), [uniqueInvestigators]);

  const getDisplayText = (inv: TransformedCard): string => {
    if (!dupeNames.has(inv.name)) return inv.name;
    return `${inv.name} (${inv.pack_name})`;
  };

  const [answer, setAnswer] = useState<TransformedCard | null>(null);
  const [win, setWin] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState<TransformedCard[]>([]);
  const [gaveUp, setGaveUp] = useState(false);

  const resetGame = useCallback(() => {
    setWin(false);
    setGaveUp(false);
    setWrongGuesses([]);
    setAnswer(uniqueInvestigators[Math.floor(Math.random() * uniqueInvestigators.length)]);
  }, [uniqueInvestigators]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    settings.storyGuesser,
    settings.filteredPacks,
    settings.includeWeakness,
    settings.includeSignatures,
    settings.includeEncounter,
    cards,
    resetGame
  ]);

  const { scrambledFlavor, sliceIdx } = useMemo(() => {
    if (!answer || !answer.back_flavor) {
      return { scrambledFlavor: '', sliceIdx: null };
    }
    
    let text = answer.back_flavor.replace(/<\/?[^>]+(>|$)/g, ""); // strip HTML
    let currentSliceIdx: number | null = null;
    
    const scrambleWord = (word: string) => {
      const lettersMatch = word.match(/[a-zA-ZÀ-ÿ]+/); // include accents if any
      if (!lettersMatch) return word;
      
      const letters = lettersMatch[0].split('');
      if (letters.length <= 1) return word;
      
      for (let i = letters.length - 1; i > 0; i--) {
        // eslint-disable-next-line react-hooks/purity
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      
      return word.replace(/[a-zA-ZÀ-ÿ]+/, letters.join(''));
    };

    if (settings.storyGuesser.scrambleLetters) {
      text = text.split(/(\s+)/).map(part => {
        if (/\s+/.test(part)) return part;
        return scrambleWord(part);
      }).join('');
    }

    if (settings.storyGuesser.scrambleWords) {
      const wordsAndSpaces = text.split(/(\s+)/);
      const justWords = wordsAndSpaces.filter(w => !/\s+/.test(w) && w.trim().length > 0);
      
      for (let i = justWords.length - 1; i > 0; i--) {
        // eslint-disable-next-line react-hooks/purity
        const j = Math.floor(Math.random() * (i + 1));
        [justWords[i], justWords[j]] = [justWords[j], justWords[i]];
      }
      
      // Reconstruct with spaces
      let wordIdx = 0;
      text = wordsAndSpaces.map(part => {
        if (/\s+/.test(part)) return part;
        if (part.trim().length === 0) return part;
        return justWords[wordIdx++];
      }).join('');
    }

    if (settings.storyGuesser.hideName) {
      // Split name by spaces and match each part, including possessives
      const nameParts = answer.name.split(' ');
      nameParts.forEach(part => {
        if (part.length < 2) return; // Skip very short parts
        const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escapedPart}(['']s)?`, 'gi');
        text = text.replace(regex, '___');
      });
    }

    if (settings.storyGuesser.sliceScale < 1) {
      // Smarter slice: shuffle all words and take a percentage of them
      const words = text.split(/\s+/).filter(w => w.trim().length > 0);
      const totalWords = words.length;
      
      // Shuffle words (Fisher-Yates)
      for (let i = words.length - 1; i > 0; i--) {
        // eslint-disable-next-line react-hooks/purity
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
      
      const sliceCount = Math.max(1, Math.floor(totalWords * settings.storyGuesser.sliceScale));
      text = words.slice(0, sliceCount).join(' ') + '...';
      
      currentSliceIdx = null; 
    }

    return { scrambledFlavor: text, sliceIdx: currentSliceIdx };
  }, [answer, settings.storyGuesser.scrambleLetters, settings.storyGuesser.scrambleWords, settings.storyGuesser.hideName, settings.storyGuesser.sliceScale]);

  const submitGuess = (card: TransformedCard) => {
    console.log('[StoryGuesser] Guess:', card);
    if (wrongGuesses.some(g => g.id === card.id)) return;
    
    if (card.id === answer?.id) {
      setWin(true);
    } else {
      setWrongGuesses([card, ...wrongGuesses]);
    }
  };



  const getFullTextHighlighted = () => {
    if (!answer?.back_flavor) return '';
    const full = answer.back_flavor.replace(/<\/?[^>]+(>|$)/g, "");
    if (sliceIdx === null) return full;
    
    return (
      <>
        <span className="story-highlight">{full.slice(0, sliceIdx)}</span>
        {full.slice(sliceIdx)}
      </>
    );
  };

  return (
    <div className="story-container">
      <div className="story-header">
        <h1>Story Guesser</h1>
        <div className="game-header-row">
          <p>Unravel the history of Arkham's heroes by identifying them from their scrambled backstories.</p>
          <GameInfoButton
            gameRules={{
              title: 'Story Guesser',
              cardTypes: 'Investigator (only, back flavor text)',
              answerEvaluation: 'Must match: Class, Pack, Name',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
              howToPlay: "An investigator's background story is presented in a scrambled or fragmented state. Your task is to deduce who the story belongs to. Settings allow you to scramble letters, words, or hide names for added difficulty. Faction hints unlock after three incorrect guesses."
            }}
          />
        </div>
      </div>

      <div className="glass-panel story-panel">
        {win || gaveUp ? (
          <ResultPanel win={win} item={answer} onPlayAgain={onPlayAgainOverride || resetGame} className="story-result">
            <div className="story-result-details">
              <div className="story-guess-text">
                <h4>Text used for guessing:</h4>
                <div className="story-text-box">{scrambledFlavor}</div>
              </div>
              <div className="story-full-text">
                <h4>Full Story:</h4>
                <div className="story-text-box">{getFullTextHighlighted()}</div>
              </div>
            </div>
          </ResultPanel>
        ) : (
          <div>
            <div className="story-text">
              {scrambledFlavor}
            </div>

            {settings.enableHints && wrongGuesses.length >= 3 && !win && answer && (
              <div className="story-hint hint-text">
                💡 Hint — Class: {answer.class.join(', ')}
              </div>
            )}
            
            <GuessInput
              options={uniqueInvestigators}
              guesses={wrongGuesses}
              onGuess={submitGuess}
              placeholder="Type investigator name..."
              onGiveUp={() => setGaveUp(true)}
              giveUpThreshold={5}
              className="story-input-wrapper"
              getDisplayText={getDisplayText}
              getOptionColors={getCardFactionColors}
            />
            
            {wrongGuesses.length > 0 && (
              <div className="story-wrong-guesses">
                {wrongGuesses.map(g => (
                  <div key={g.id} className="story-wrong-badge">
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
