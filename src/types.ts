import type {
  FactionCode,
  PackCode,
  Slot,
  SubtypeCode,
  TypeName,
  Restrictions
} from './types/arkham';

export * from './types/arkham';

declare global {
  const APP_VERSION: string;
}

export interface GameProps {
  onPlayAgainOverride?: () => void;
}

export interface BaseGameSettings {
  useGlobalPackFilter: boolean;
  filteredPacks: string[];
  includeWeakness: boolean;
  includeSignatures: boolean;
  includeBondedCard: boolean;
}

export interface PicGuesserSettings extends BaseGameSettings {
  difficulty: 'Hard' | 'Normal' | 'Easy';
  typeFilters: Record<TypeName, boolean>;
}

export interface StoryGuesserSettings extends BaseGameSettings {
  scrambleWords: boolean;
  scrambleLetters: boolean;
  sliceScale: number;
  hideName: boolean;
}

export interface TraitGuesserSettings extends BaseGameSettings {
  typeFilters: Record<TypeName, boolean>;
  minCards: number;
  maxCards: number;
  requirementType: 'All' | 'Percentage' | 'Fixed Number';
  requirementValue: number;
}

export interface FlavourGuesserSettings extends BaseGameSettings {
  typeFilters: Record<TypeName, boolean>;
  inputMode: 'Multiple Choice' | 'Direct Input';
}

export interface CampaignPackGuesserSettings extends BaseGameSettings {
  blurAmount: number;
}

export interface GuessCardByTraitSettings extends BaseGameSettings {
  inputMode: 'Multiple Choice' | 'Direct Input';
  poolFilter: 'Player Cards Only' | 'All Cards';
}

export interface CountGuesserSettings extends BaseGameSettings {
  inputMode: 'Multiple Choice' | 'Direct Input';
  poolFilter: 'Player Cards Only' | 'All Cards';
}

export interface TrueOrFalseSettings extends BaseGameSettings {
  enemyStatsMode: boolean;
  traitMode: boolean;
  locationTraitsMode: boolean;
  actTraitsMode: boolean;
  agendaTraitsMode: boolean;
  treacheryTraitsMode: boolean;
}


export interface RandomTriviaSettings {
  enabledModes: Record<string, boolean>;
}

export interface AppSettings {
  // Global Pack Filter Settings
  filteredPacks: string[];
  includeWeakness: boolean;
  includeSignatures: boolean;
  includeBondedCard: boolean;

  // Global settings
  includeEncounter: boolean;
  showCampaignCards: boolean;
  enableHints: boolean;

  // Game-specific settings
  wordle: BaseGameSettings;
  picGuesser: PicGuesserSettings;
  investigatordle: BaseGameSettings;
  storyGuesser: StoryGuesserSettings;
  traitGuesser: TraitGuesserSettings;
  flavourGuesser: FlavourGuesserSettings;
  campaignPackGuesser: CampaignPackGuesserSettings;
  guessCardByTrait: GuessCardByTraitSettings;
  countGuesser: CountGuesserSettings;
  iconGuesser: BaseGameSettings;
  trueOrFalse: TrueOrFalseSettings;
  randomTrivia: RandomTriviaSettings;
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
  encounter_code?: string;
  encounter_name?: string;
  permanent?: boolean;
  exile?: boolean;
  exceptional?: boolean;
  myriad?: boolean;
  is_unique?: boolean;
  bonded_to?: string;
  text?: string;
  backimagesrc?: string;
}

