import { useState, useEffect, useMemo } from 'react';
import { useGameContext } from '../../context/GameContext';
import type { TransformedCard, TransformedInvestigator } from '../../types';
import { deduplicateByEvaluationCriteria, GAME_EVALUATION_CRITERIA, filterDuplicateOfCode, findDuplicateNames, getCardFactionColors, getInvestigatorFactionColors } from '../../services/CardFilter';
import GameInfoButton from '../../components/GameInfoButton/GameInfoButton';
import './TraitGuesser.scss';
import GuessInput from '../../components/GuessInput/GuessInput';
import ResultPanel from '../../components/ResultPanel/ResultPanel';

export default function TraitGuesser() {
  const { filteredCards, filteredInvestigators, settings } = useGameContext();
  const [trait, setTrait] = useState<string>('');
  const [win, setWin] = useState(false);
  const [correctGuesses, setCorrectGuesses] = useState<(TransformedCard | TransformedInvestigator)[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<(TransformedCard | TransformedInvestigator)[]>([]);
  const [gaveUp, setGaveUp] = useState(false);

  const allPossibleOptions = useMemo(() => {
    const cards = filterDuplicateOfCode(filteredCards);
    const investigators = filterDuplicateOfCode(filteredInvestigators);
    
    return [
      // TODO: Review thess filter
      ...cards.filter(c => settings.traitGuesserTypeFilters[c.type_code] ?? true),
      ...investigators.filter(_ => settings.traitGuesserTypeFilters['investigator'] ?? true)
    ] as (TransformedCard | TransformedInvestigator)[];
  }, [filteredCards, filteredInvestigators, settings.traitGuesserTypeFilters]);

  const gameTraits = useMemo(() => {
    const traitCountMap = new Map<string, Set<string>>();
    allPossibleOptions.forEach(item => {
      item.traits.forEach(t => {
        if (!traitCountMap.has(t)) traitCountMap.set(t, new Set());
        traitCountMap.get(t)!.add(item.name);
      });
    });
    
    // Filter based on settings min and max cards
    return Array.from(traitCountMap.entries())
      .filter(([_, names]) => {
        const count = names.size;
        return count >= settings.traitGuesserMinCards && 
               (settings.traitGuesserMaxCards === 0 || count <= settings.traitGuesserMaxCards);
      })
      .map(([trait]) => trait);
  }, [allPossibleOptions, settings.traitGuesserMinCards, settings.traitGuesserMaxCards]);

  const gameOptions = useMemo(() => {
    return deduplicateByEvaluationCriteria(
      allPossibleOptions,
      GAME_EVALUATION_CRITERIA.traitGuesserCard // Use consistent criteria
    ) as (TransformedCard | TransformedInvestigator)[];
  }, [allPossibleOptions]);

  const dupeNames = useMemo(() => findDuplicateNames(gameOptions), [gameOptions]);

  const getDisplayText = (item: TransformedCard | TransformedInvestigator): string => {
    if (!dupeNames.has(item.name)) return item.name;
    return `${item.name} (${item.pack_name})`;
  };

  const possibleAnswers = useMemo(() => {
    if (!trait) return [];
    return gameOptions.filter(item => item.traits.includes(trait));
  }, [trait, gameOptions]);

  const requiredGuesses = useMemo(() => {
    const total = possibleAnswers.length;
    if (settings.traitGuesserRequirementType === 'All') return total;
    if (settings.traitGuesserRequirementType === 'Percentage') {
      return Math.max(1, Math.ceil(total * (settings.traitGuesserRequirementValue / 100)));
    }
    return Math.min(total, settings.traitGuesserRequirementValue);
  }, [possibleAnswers.length, settings]);

  useEffect(() => {
    resetGame();
  }, [allPossibleOptions, settings.traitGuesserMinCards, settings.traitGuesserMaxCards]);

  const resetGame = () => {
    setWin(false);
    setGaveUp(false);
    setCorrectGuesses([]);
    setWrongGuesses([]);

    if (gameTraits.length > 0) {
      setTrait(gameTraits[Math.floor(Math.random() * gameTraits.length)]);
    } else {
      setTrait('');
    }
  };

  const submitGuess = (item: TransformedCard | TransformedInvestigator) => {
    const hasTrait = item.traits.includes(trait);

    if (hasTrait) {
      if (!correctGuesses.find(c => c.name === item.name)) {
        const newGuesses = [...correctGuesses, item];
        setCorrectGuesses(newGuesses);
        if (newGuesses.length >= requiredGuesses) {
          setWin(true);
        }
      }
    } else {
      if (!wrongGuesses.find(c => c.name === item.name)) {
        setWrongGuesses([item, ...wrongGuesses]);
      }
    }
  };

  return (
    <div className="trait-container">
      <div className="trait-header">
        <h1>Trait Guesser</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <p>Guess the cards and investigators by their shared traits!</p>
          <GameInfoButton
            gameName="TraitGuesser"
            gameRules={{
              title: 'Trait Guesser',
              cardTypes: 'Configurable via Type Filters in Settings',
              answerEvaluation: 'Must match: Name, Pack, Class',
              currentFilters: 'Applied: Pack filters, Weakness filter, Signature filter, Type filters',
            }}
          />
        </div>
      </div>

      <div className="glass-panel trait-panel">
        <div className="trait-name">
          {trait || 'No traits match your current filters. Try adjusting them in Settings.'}
        </div>

        {win || gaveUp ? (
          <ResultPanel win={win} item={null} onPlayAgain={resetGame} className="trait-result">
            <div className="trait-all-answers">
              <h3 style={{ marginBottom: '15px' }}>All matches with "{trait}"</h3>
              <div className="trait-card-display" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
                {possibleAnswers.map(ans => {
                  const isGuessed = correctGuesses.some(g => g.name === ans.name);
                  return (
                    <div 
                      key={ans.id} 
                      className={`trait-card ${isGuessed ? 'guessed' : 'missed'}`}
                      style={{ 
                        opacity: isGuessed ? 1 : 0.6, 
                        filter: isGuessed ? 'none' : 'grayscale(100%)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <img 
                        src={`https://arkhamdb.com${ans.imagesrc}`} 
                        alt={ans.name} 
                        style={{ height: '200px', objectFit: 'contain', borderRadius: '8px', border: isGuessed ? '2px solid #4ade80' : '2px solid transparent' }}
                      />
                      <div className="card-name" style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '5px', maxWidth: '140px', color: isGuessed ? '#4ade80' : 'white' }}>
                        {ans.name}
                      </div>
                      {!isGuessed && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ff4444', fontWeight: 'bold', fontSize: '1.5rem', textShadow: '2px 2px 4px rgba(0,0,0,0.8), -2px -2px 4px rgba(0,0,0,0.8)' }}>
                          MISSED
                        </div>
                      )}
                      {isGuessed && (
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#4ade80', color: 'black', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid #1a1a2e' }}>
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ResultPanel>
        ) : (
          <div>
            <div className="trait-guessed-count" style={{ marginBottom: '15px', textAlign: 'center', fontSize: '1.2rem' }}>
              Guessed: {correctGuesses.length} / {requiredGuesses}
            </div>
            
            <GuessInput
              options={gameOptions}
              guesses={[...correctGuesses, ...wrongGuesses]}
              onGuess={submitGuess}
              placeholder="Type name..."
              onGiveUp={() => setGaveUp(true)}
              giveUpThreshold={5}
              className="trait-input-wrapper"
              getDisplayText={getDisplayText}
              getOptionColors={(item) => 'class' in item ? getCardFactionColors(item as TransformedCard) : getInvestigatorFactionColors(item as TransformedInvestigator)}
            />

            {correctGuesses.length > 0 && (
              <div className="trait-correct-guesses">
                {correctGuesses.map(g => (
                  <div key={g.id} className="trait-correct-badge" style={{ background: '#4ade80', color: 'black', padding: '5px 10px', borderRadius: '15px', margin: '5px', display: 'inline-block' }}>
                    ✓ {g.fullName}
                  </div>
                ))}
              </div>
            )}

            {wrongGuesses.length > 0 && (
              <div className="trait-wrong-guesses">
                {wrongGuesses.map(g => (
                  <div key={g.id} className="trait-wrong-badge">
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
