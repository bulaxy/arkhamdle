import type { GameStats, ScoringConfig } from '../types';

export function calculateGameScore(stats: GameStats, config: ScoringConfig): number {
  if (!stats.solved) return 0;

  // Helper to safely get the penalty per wrong guess
  const getPenalty = (key: keyof NonNullable<ScoringConfig['retry']>): number => {
    return config.retryPenalty?.[key] !== undefined ? config.retryPenalty[key] : 1;
  };

  switch (stats.mode) {
    case 'Classic Wordle':
    case 'Investigatordle':
      return config.wordle[stats.guesses || 1] || 0;

    case 'Pic Guesser':
      return Math.max(1, config.retry.picGuesser - (stats.wrongGuesses || 0) * getPenalty('picGuesser'));

    case 'Story Guesser':
      return Math.max(1, config.retry.storyGuesser - (stats.wrongGuesses || 0) * getPenalty('storyGuesser'));

    case 'Trait Guesser':
      return Math.max(1, config.retry.traitGuesser - (stats.wrongGuesses || 0) * getPenalty('traitGuesser'));

    case 'Flavour Guesser':
    case 'Flavour Text Guesser':
      if (stats.isMultipleChoice) return config.singleAttempt.multipleChoice;
      return Math.max(1, config.retry.flavourGuesser - (stats.wrongGuesses || 0) * getPenalty('flavourGuesser'));

    case 'Campaign Pack Guesser':
      return Math.max(1, config.retry.campaignPackGuesser - (stats.wrongGuesses || 0) * getPenalty('campaignPackGuesser'));

    case 'Count Guesser':
      if (stats.isMultipleChoice) return config.singleAttempt.multipleChoice;
      return Math.max(1, config.retry.countGuesser - (stats.wrongGuesses || 0) * getPenalty('countGuesser'));

    case 'Guess Card By Trait':
      // Guess Card by Trait retry mode uses traitGuesser config
      if (stats.isMultipleChoice) return config.singleAttempt.multipleChoice;
      return Math.max(1, config.retry.traitGuesser - (stats.wrongGuesses || 0) * getPenalty('traitGuesser'));

    case 'True Or False':
    case 'True or False':
      return config.singleAttempt.trueOrFalse;

    case 'Icon Guesser':
      return config.singleAttempt.iconGuesser;

    case 'Random Trivia':
      if (stats.subMode) {
        return calculateGameScore({ ...stats, mode: stats.subMode }, config);
      }
      return 1;

    default:
      return 0;
  }
}
