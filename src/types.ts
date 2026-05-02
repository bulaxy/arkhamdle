import type {
  FactionCode,
  PackCode,
  Slot,
  SubtypeCode,
  TypeName,
  Restrictions
} from './types/arkham';

export * from './types/arkham';

export interface AppSettings {
  filteredPacks: string[];
  picGuesserDifficulty: 'Hard' | 'Normal' | 'Easy';
  storyGuesserScrambleWords: boolean;
  storyGuesserScrambleLetters: boolean;
  storyGuesserSliceScale: number;
  storyGuesserHideName: boolean;
  includeWeakness: boolean;
  includeSignatures: boolean;
  flavourGuesserTypeFilters: Record<TypeName, boolean>;
  traitGuesserTypeFilters: Record<TypeName, boolean>;
  picGuesserTypeFilters: Record<TypeName, boolean>;
  traitGuesserMinCards: number;
  traitGuesserMaxCards: number;
  traitGuesserRequirementType: 'All' | 'Percentage' | 'Fixed Number';
  traitGuesserRequirementValue: number;
  includeEncounter: boolean;
  enableHints: boolean;
  // Global Pack Filter (already have filteredPacks, includeWeakness, includeSignatures)
  
  // Wordle / Classic Mode
  wordleUseGlobalPackFilter: boolean;
  wordleFilteredPacks: string[];
  wordleIncludeWeakness: boolean;
  wordleIncludeSignatures: boolean;

  // Pic Guesser
  picGuesserUseGlobalPackFilter: boolean;
  picGuesserFilteredPacks: string[];
  picGuesserIncludeWeakness: boolean;
  picGuesserIncludeSignatures: boolean;

  // Investigatordle
  investigatordleUseGlobalPackFilter: boolean;
  investigatordleFilteredPacks: string[];
  investigatordleIncludeWeakness: boolean;
  investigatordleIncludeSignatures: boolean;

  // Story Guesser
  storyGuesserUseGlobalPackFilter: boolean;
  storyGuesserFilteredPacks: string[];
  storyGuesserIncludeWeakness: boolean;
  storyGuesserIncludeSignatures: boolean;

  // Trait Guesser
  traitGuesserUseGlobalPackFilter: boolean;
  traitGuesserFilteredPacks: string[];
  traitGuesserIncludeWeakness: boolean;
  traitGuesserIncludeSignatures: boolean;

  // Flavour Guesser
  flavourGuesserUseGlobalPackFilter: boolean;
  flavourGuesserFilteredPacks: string[];
  flavourGuesserIncludeWeakness: boolean;
  flavourGuesserIncludeSignatures: boolean;
}

export interface TransformedCard {
  id: string;
  name: string;
  subname: string;
  fullName: string;
  imagesrc: string;
  pack_code: PackCode;
  pack_name: string;
  flavor: string;
  subtype_code?: SubtypeCode;
  cardName: string;
  typeName: TypeName;
  class: FactionCode[];
  xp: number;
  traits: string[];
  slot?: Slot;
  cost: number;
  agility: number;
  combat: number;
  intellect: number;
  wild: number;
  willpower: number;
  restrictions?: Restrictions;
  duplicate_of_code?: string;
  health?: number;
  sanity?: number;
  enemy_damage?: number;
  enemy_horror?: number;
  enemy_fight?: number;
  enemy_evade?: number;
  clues?: number;
  shroud?: number;
  doom?: number;
  victory?: number;
  vengeance?: number;
  health_per_investigator?: boolean;
  back_flavor?: string;
}

