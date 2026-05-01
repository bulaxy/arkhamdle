import type {
  FactionCode,
  PackCode,
  Slot,
  SubtypeCode,
  TypeName
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
  restrictions?: any;
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

