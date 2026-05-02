export const PackCode = {
  AOF: "aof",
  AON: "aon",
  APOT: "apot",
  BAD: "bad",
  BBT: "bbt",
  BLBE: "blbe",
  BOB: "bob",
  BOTA: "bota",
  BSR: "bsr",
  BTB: "btb",
  CAR: "car",
  CORE: "core",
  CORE_2026: "core_2026",
  DCA: "dca",
  DEF: "def",
  DRE: "dre",
  DSM: "dsm",
  DWL: "dwl",
  ENC: "enc",
  EOEP: "eoep",
  EOTP: "eotp",
  FGG: "fgg",
  FHVP: "fhvp",
  HAR: "har",
  HFA: "hfa",
  HHG: "hhg",
  HOTE: "hote",
  HOTH: "hoth",
  ICC: "icc",
  IOTV: "iotv",
  ITD: "itd",
  ITM: "itm",
  JAC: "jac",
  LIF: "lif",
  LITAS: "litas",
  LOD: "lod",
  LTR: "ltr",
  MAR: "mar",
  MIG: "mig",
  NAT: "nat",
  OTR: "otr",
  PAP: "pap",
  PNR: "pnr",
  PROMO: "promo",
  PTC: "ptc",
  PTR: "ptr",
  RCORE: "rcore",
  ROD: "rod",
  ROP: "rop",
  RTDWL: "rtdwl",
  RTNOTZ: "rtnotz",
  RTPTC: "rtptc",
  RTR: "rtr",
  RTTCU: "rttcu",
  RTTFA: "rttfa",
  SFK: "sfk",
  SHA: "sha",
  STE: "ste",
  TBB: "tbb",
  TCOA: "tcoa",
  TCU: "tcu",
  TDCP: "tdcp",
  TDE: "tde",
  TDG: "tdg",
  TDOR: "tdor",
  TDOY: "tdoy",
  TECE: "tece",
  TFA: "tfa",
  TFTBW: "tftbw",
  TIC: "tic",
  TMM: "tmm",
  TOF: "tof",
  TOM: "tom",
  TPM: "tpm",
  TSH: "tsh",
  TSKP: "tskp",
  TSN: "tsn",
  TUO: "tuo",
  UAD: "uad",
  UAU: "uau",
  WDA: "wda",
  WGD: "wgd",
  WIN: "win",
  WOC: "woc",
  WOS: "wos",
} as const;
export type PackCode = typeof PackCode[keyof typeof PackCode];

export const TypeName = {
  ASSET: "asset",
  EVENT: "event",
  SKILL: "skill",
  ENEMY: "enemy",
  LOCATION: "location",
  SCENARIO: "scenario",
  AGENDA: "agenda",
  ACT: "act",
  TREACHERY: "treachery",
  STORY: "story",
  KEY: "key",
  ENEMY_LOCATION: "enemyLocation",
  INVESTIGATOR: "investigator",
  OTHER: "other",
} as const;
export type TypeName = typeof TypeName[keyof typeof TypeName];

export const FactionCode = {
  GUARDIAN: "guardian",
  MYSTIC: "mystic",
  NEUTRAL: "neutral",
  ROGUE: "rogue",
  SEEKER: "seeker",
  SURVIVOR: "survivor",
} as const;
export type FactionCode = typeof FactionCode[keyof typeof FactionCode];

export const SubtypeCode = {
  BASICWEAKNESS: "basicweakness",
  WEAKNESS: "weakness",
} as const;
export type SubtypeCode = typeof SubtypeCode[keyof typeof SubtypeCode];

export const Slot = {
  ACCESSORY: "Accessory",
  ALLY: "Ally",
  ALLY_ARCANE: "Ally. Arcane",
  ARCANE: "Arcane",
  ARCANE_X2: "Arcane x2",
  BODY: "Body",
  BODY_ARCANE: "Body. Arcane",
  BODY_HAND_X2: "Body. Hand x2",
  HAND: "Hand",
  HAND_X2: "Hand x2",
  HAND_X2_ARCANE: "Hand x2. Arcane",
  HAND_ARCANE: "Hand. Arcane",
  HEAD: "Head",
  TAROT: "Tarot",
} as const;
export type Slot = typeof Slot[keyof typeof Slot];


export interface ErrataDate {
  date: string;
  timezone_type: number;
  timezone: string;
}

export interface DeckRequirements {
  size?: number;
  card?: Record<string, Record<string, string>>;
  random?: Array<{
    target: string;
    value: string;
  }>;
}

export interface DeckOptions {
  faction?: FactionCode[];
  level?: {
    min: number;
    max: number;
  };
  not?: boolean;
  trait?: string[];
  limit?: number;
  error?: string;
}

export interface Restrictions {
  investigator?: Record<string, string>;
  faction?: Record<string, { min: boolean; max: boolean }>;
  trait?: string[];
}

export interface BondedCard {
  code: string;
  count: number;
}

export interface LinkedCard extends Record<string, unknown> {
  code: string;
  name: string;
}

export interface CustomizationOption extends Record<string, unknown> {
  xp: number;
}

export interface ArkhamCard {
  pack_code: PackCode;
  pack_name: string;
  type_code: string;
  type_name: string;
  subtype_code?: SubtypeCode;
  subtype_name?: string;
  faction_code: FactionCode;
  faction_name: string;
  faction2_code?: FactionCode;
  faction2_name?: string;
  faction3_code?: FactionCode;
  faction3_name?: string;
  position: number;
  exceptional: boolean;
  myriad: boolean;
  code: string;
  name: string;
  real_name: string;
  subname?: string;
  quantity: number;
  skill_willpower?: number;
  skill_intellect?: number;
  skill_combat?: number;
  skill_agility?: number;
  skill_wild?: number;
  health?: number;
  health_per_investigator?: boolean;
  sanity?: number;
  deck_limit?: number;
  slot?: Slot;
  real_slot?: string;
  traits: string;
  real_traits: string;
  imagesrc: string;
  url: string;
  octgn_id?: string;
  text: string;
  real_text: string;
  flavor?: string;
  deck_requirements?: DeckRequirements;
  deck_options?: DeckOptions[];
  illustrator: string;
  is_unique: boolean;
  permanent: boolean;
  double_sided: boolean;
  backimagesrc?: string;
  duplicated_by?: string[];
  alternated_by?: string[];
  cost?: number;
  xp?: number;
  errata_date?: ErrataDate;
  restrictions?: Restrictions;
  shroud?: number;
  clues?: number;
  clues_fixed?: boolean;
  enemy_damage?: number;
  enemy_horror?: number;
  enemy_fight?: number;
  enemy_evade?: number;
  victory?: number;
  vengeance?: number;
  doom?: number;
  stage?: number;
  back_name?: string;
  back_text?: string;
  back_flavor?: string;
  back_traits?: string;
  back_illustrator?: string;
  back_link?: string;
  back_subname?: string;
  alternate_of_code?: string;
  alternate_of_name?: string;
  duplicate_of_code?: string;
  duplicate_of_name?: string;
  bonded_count?: number;
  bonded_to?: string;
  bonded_cards?: BondedCard[];
  linked_to_code?: string;
  linked_to_name?: string;
  linked_card?: LinkedCard;
  customization_change?: string;
  customization_options?: CustomizationOption[];
  customization_text?: string;
  encounter_code?: string;
  encounter_position?: number;
  exile?: boolean;
  hidden?: boolean;
  side_deck_options?: DeckOptions[];
  side_deck_requirements?: string;
  tags?: string;
}
