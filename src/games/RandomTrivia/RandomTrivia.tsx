import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGameContext } from '../../hooks/useGameContext';
import StoryGuesser from '../StoryGuesser/StoryGuesser';
import TraitGuesser from '../TraitGuesser/TraitGuesser';
import FlavourGuesser from '../FlavourGuesser/FlavourGuesser';
import CampaignPackGuesser from '../CampaignPackGuesser/CampaignPackGuesser';
import GuessCardByTrait from '../GuessCardByTrait/GuessCardByTrait';
import CountGuesser from '../CountGuesser/CountGuesser';
import IconGuesser from '../IconGuesser/IconGuesser';
import TrueOrFalse from '../TrueOrFalse/TrueOrFalse';
import WordleGame from '../WordleGame/WordleGame';
import PicGuesser from '../PicGuesser/PicGuesser';
import Investigatordle from '../Investigatordle/Investigatordle';
import './RandomTrivia.scss';

const ALL_GAMES = {
  StoryGuesser,
  TraitGuesser,
  FlavourGuesser,
  CampaignPackGuesser,
  GuessCardByTrait,
  CountGuesser,
  IconGuesser,
  TrueOrFalse,
  WordleGame,
  PicGuesser,
  Investigatordle,
};

export default function RandomTrivia() {
  const { settings } = useGameContext();
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const availableModes = useMemo(() => {
    const modes: string[] = [];
    const enabledSettings = settings.randomTrivia.enabledModes;

    for (const [key, enabled] of Object.entries(enabledSettings)) {
      // Hardcoded exclusions based on user requirement
      if (key === 'WordleGame' || key === 'PicGuesser' || key === 'Investigatordle') {
        continue; 
      }
      // "If Campaign cards are not loaded, automatically exclude CampaignPackGuesser"
      if (key === 'CampaignPackGuesser' && !settings.includeEncounter) {
        continue;
      }
      
      if (enabled) {
        modes.push(key);
      }
    }
    return modes;
  }, [settings.randomTrivia.enabledModes, settings.includeEncounter]);

  const pickRandomGame = useCallback(() => {
    if (availableModes.length === 0) {
      setCurrentGame(null);
      return;
    }
    
    // Make sure we try to pick a *different* game if possible, 
    // unless there is only 1 mode available.
    let nextGame = currentGame;
    if (availableModes.length > 1) {
      while (nextGame === currentGame) {
        nextGame = availableModes[Math.floor(Math.random() * availableModes.length)];
      }
    } else {
      nextGame = availableModes[0];
    }

    setCurrentGame(nextGame);
    setGameKey(k => k + 1);
  }, [availableModes, currentGame]);

  // Initial pick
  useEffect(() => {
    if (!currentGame && availableModes.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      pickRandomGame();
    }
  }, [currentGame, pickRandomGame, availableModes.length]);

  if (availableModes.length === 0) {
    return (
      <div className="random-trivia-error glass-panel fade-in">
        <h2>Random Trivia</h2>
        <p>No game modes are currently available for Random Trivia.</p>
        <p>Please go to <strong>Settings</strong> &gt; <strong>Random Trivia</strong> to enable at least one valid game mode.</p>
        <p className="small-note">Note: Classic Mode, Pic Guesser, and Investigatordle are not supported in this mode.</p>
      </div>
    );
  }

  if (!currentGame) return null;

  const GameComponent = ALL_GAMES[currentGame as keyof typeof ALL_GAMES];

  return (
    <div className="random-trivia-wrapper fade-in">
      <GameComponent key={gameKey} onPlayAgainOverride={pickRandomGame} streakModeName="Random Trivia" />
    </div>
  );
}
