import { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../context/GameContext';
import type { TransformedInvestigator } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, findDuplicateNames, getInvestigatorFactionColors, filterDuplicateOfCode } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import '../../components/GuessGrid/GuessGrid.scss';
import './StoryGuesser.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

export default function StoryGuesser() {
  const { filteredInvestigators, settings } = useGameContext();

  const uniqueInvestigators = useMemo(() => {
    const withFlavor = filteredInvestigators.filter(inv => inv.back_flavor);
    const noDupes = filterDuplicateOfCode(withFlavor);
    return deduplicateByEvaluationCriteria(
      noDupes,
      GAME_EVALUATION_CRITERIA.storyGuesser
    ) as TransformedInvestigator[];
  }, [filteredInvestigators]);

  const dupeNames = useMemo(() => findDuplicateNames(uniqueInvestigators), [uniqueInvestigators]);

  const getDisplayText = (inv: TransformedInvestigator): string => {
    if (!dupeNames.has(inv.name)) return inv.name;
    return `${inv.name} (${inv.pack_name})`;
  };

  const [answer, setAnswer] = useState<TransformedInvestigator | null>(null);
  const [win, setWin] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState<TransformedInvestigator[]>([]);
  const [scrambledFlavor, setScrambledFlavor] = useState('');
  const [sliceIdx, setSliceIdx] = useState<number | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (uniqueInvestigators.length > 0 && !answer) {
      setAnswer(uniqueInvestigators[Math.floor(Math.random() * uniqueInvestigators.length)]);
    }
  }, [uniqueInvestigators, answer]);

  useEffect(() => {
    if (!answer || !answer.back_flavor) {
      setScrambledFlavor('');
      setSliceIdx(null);
      return;
    }
    
    let text = answer.back_flavor.replace(/<\/?[^>]+(\>|$)/g, ""); // strip HTML
    let currentSliceIdx: number | null = null;
    
    const scrambleWord = (word: string) => {
      const lettersMatch = word.match(/[a-zA-ZÀ-ÿ]+/); // include accents if any
      if (!lettersMatch) return word;
      
      const letters = lettersMatch[0].split('');
      if (letters.length <= 1) return word;
      
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      
      return word.replace(/[a-zA-ZÀ-ÿ]+/, letters.join(''));
    };

    if (settings.storyGuesserScrambleLetters) {
      text = text.split(/(\s+)/).map(part => {
        if (/\s+/.test(part)) return part;
        return scrambleWord(part);
      }).join('');
    }

    if (settings.storyGuesserScrambleWords) {
      const wordsAndSpaces = text.split(/(\s+)/);
      const justWords = wordsAndSpaces.filter(w => !/\s+/.test(w) && w.trim().length > 0);
      
      for (let i = justWords.length - 1; i > 0; i--) {
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

    if (settings.storyGuesserHideName) {
      // Split name by spaces and match each part, including possessives
      const nameParts = answer.name.split(' ');
      nameParts.forEach(part => {
        if (part.length < 2) return; // Skip very short parts
        const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escapedPart}(['']s)?`, 'gi');
        text = text.replace(regex, '___');
      });
    }

    if (settings.storyGuesserSliceScale < 1) {
      // Smarter slice: shuffle all words and take a percentage of them
      const words = text.split(/\s+/).filter(w => w.trim().length > 0);
      const totalWords = words.length;
      
      // Shuffle words (Fisher-Yates)
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
      
      const sliceCount = Math.max(1, Math.floor(totalWords * settings.storyGuesserSliceScale));
      text = words.slice(0, sliceCount).join(' ') + '...';
      
      currentSliceIdx = null; 
    }

    setScrambledFlavor(text);
    setSliceIdx(currentSliceIdx);
  }, [answer, settings.storyGuesserScrambleLetters, settings.storyGuesserScrambleWords, settings.storyGuesserHideName, settings.storyGuesserSliceScale]);

  const submitGuess = (card: TransformedInvestigator) => {
    if (wrongGuesses.some(g => g.id === card.id)) return;
    
    if (card.id === answer?.id) {
      setWin(true);
    } else {
      setWrongGuesses([card, ...wrongGuesses]);
    }
  };

  const resetGame = () => {
    setWin(false);
    setGaveUp(false);
    setWrongGuesses([]);
    setAnswer(uniqueInvestigators[Math.floor(Math.random() * uniqueInvestigators.length)]);
  };

  const getFullTextHighlighted = () => {
    if (!answer?.back_flavor) return '';
    const full = answer.back_flavor.replace(/<\/?[^>]+(\>|$)/g, "");
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <p>Guess the Investigator by their scrambled story!</p>
          <GameInfoButton
            gameName="StoryGuesser"
            gameRules={{
              title: 'Story Guesser',
              cardTypes: 'Investigator (only, back flavor text)',
              answerEvaluation: 'Must match: Class, Pack, Name, XP',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter',
            }}
          />
        </div>
      </div>

      <div className="glass-panel story-panel">
        {win || gaveUp ? (
          <ResultPanel win={win} item={answer} onPlayAgain={resetGame} className="story-result">
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
            
            <GuessInput
              options={uniqueInvestigators}
              guesses={wrongGuesses}
              onGuess={submitGuess}
              placeholder="Type investigator name..."
              onGiveUp={() => setGaveUp(true)}
              giveUpThreshold={5}
              className="story-input-wrapper"
              getDisplayText={getDisplayText}
              getOptionColors={getInvestigatorFactionColors}
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
