import seedrandom from 'seedrandom';

export const nativeRandom = (): number => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / 4294967296; // 2^32
};

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

const thematicPrefixes = [
  "Elder", "Cthulhu", "Azathoth", "Hastur", "YogSothoth", "Miskatonic",
  "Necronomicon", "Arkham", "Dunwich", "Carcosa", "Innsmouth", "Kingsport",
  "Dreamlands", "Kadath", "Nyarlathotep", "Mythos", "Encounter", "Chaos",
  "Cosmic", "Ancient", "Abyssal", "Forbidden", "Secret", "Whispering",
  "Shadowy", "Haunted", "Lurking", "Eldritch", "Strange", "Sinister",
  "Uncanny", "Curse", "Blessing", "Sanity", "Horror", "Dread", "Terror",
  "Grimoire", "Tome", "Relic", "Acolyte", "Cultist", "Ghoul", "DeepOne",
  "Shoggoth", "Nightgaunt", "Byakhee", "Spawn", "Phobia", "Rouse", "Rend"
];

const thematicSuffixes = [
  "Sign", "Portal", "Token", "Ritual", "Tentacle", "Clue", "Doom",
  "Sigil", "Artifact", "Resolve", "Courage", "Clarity",
  "Willpower", "Intellect", "Combat", "Agility", "Stamina", "Gaze",
  "Dream", "Gate", "Key", "Eye", "Star", "Void", "Whisper", "Shadow",
  "Grave", "Altar", "Tomb", "Labyrinth", "Chronicle", "Legacy", "Path",
  "Journey", "Riddle", "Conspiracy", "Seal", "Tear", "Breach", "Rift"
];

export const generateRandomThematicSeed = (): string => {
  const prefix = thematicPrefixes[Math.floor(Math.random() * thematicPrefixes.length)];
  const suffix = thematicSuffixes[Math.floor(Math.random() * thematicSuffixes.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 100 to 999
  return `${prefix}-${suffix}-${num}`;
};
