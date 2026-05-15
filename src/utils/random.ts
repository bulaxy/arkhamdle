import seedrandom from 'seedrandom';

let currentSeed: string | undefined = undefined;

/**
 * Initializes or resets the global Math.random with a seed.
 * If seed is undefined, Math.random is restored to its original state (or a fresh unseeded state).
 */
export const initializeSeed = (seed?: string) => {
  currentSeed = seed;
  if (seed) {
    seedrandom(seed, { global: true });
    console.log(`[Random] Global Math.random seeded with: "${seed}"`);
  } else {
    // Restoring Math.random is tricky once monkeypatched by seedrandom without a backup.
    // However, seedrandom(undefined, { global: true }) will essentially re-randomize it.
    seedrandom(undefined, { global: true });
    console.log('[Random] Global Math.random reset to unseeded.');
  }
};

export const getCurrentSeed = () => currentSeed;
