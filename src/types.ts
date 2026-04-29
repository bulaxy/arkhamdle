import type { 
  PackCode, 
  TypeCode, 
  FactionCode, 
  SubtypeCode, 
  Slot,
  ArkhamCard 
} from './types/arkham';

export * from './types/arkham';

export interface Card {
  id: string;
  code: string;
  name: string;
  real_name?: string;
  subname?: string;
  type_code: TypeCode;
  type_name: string;
  faction_code: FactionCode;
  faction_name: string;
  faction2_code?: FactionCode;
  faction2_name?: string;
  faction3_code?: FactionCode;
  faction3_name?: string;
  pack_code: PackCode;
  imagesrc?: string;
  xp?: number;
  traits?: string;
  slot?: Slot | string;
  cost?: number;
  skill_willpower?: number;
  skill_intellect?: number;
  skill_combat?: number;
  skill_agility?: number;
  skill_wild?: number;
  health?: number;
  sanity?: number;
  flavor?: string;
  back_flavor?: string;
  duplicate_of?: string;
  restrictions?: any;
  subtype_code?: SubtypeCode;
  bonded_to?: string;
  pack_name?: string;
}

export interface AppSettings {
  filteredPacks: string[];
  picGuesserDifficulty: 'Hard' | 'Normal' | 'Easy';
  storyGuesserScrambleWords: boolean;
  storyGuesserScrambleLetters: boolean;
  storyGuesserSliceScale: number;
  storyGuesserHideName: boolean;
  includeWeakness: boolean;
}

export interface TransformedCard {
  id: string;
  name: string;
  fullName: string;
  imagesrc: string;
  pack_code: PackCode;
  pack_name: string;
  flavor: string;
  subtype_code?: SubtypeCode;
  
  cardName: string[];
  typeName: string[];
  class: FactionCode[];
  xp: number[];
  traits: string[];
  slot: string[];
  cost: number[];
  agility: number[];
  combat: number[];
  intellect: number[];
  wild: number[];
  willpower: number[];
}

export interface TransformedInvestigator {
  id: string;
  name: string;
  subname: string;
  fullName: string;
  imagesrc: string;
  pack_code: PackCode;
  pack_name: string;
  subtype_code?: SubtypeCode;
  
  faction_code: FactionCode[];
  health: number[];
  sanity: number[];
  agility: number[];
  combat: number[];
  intellect: number[];
  willpower: number[];
  traits: string[];
  back_flavor: string;
}
