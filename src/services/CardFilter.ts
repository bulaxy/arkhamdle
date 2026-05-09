import type { TransformedCard, TypeName, FactionCode, AppSettings } from '../types';
import { TypeName as TypeNameEnum } from '../types/arkham';

/**
 * Filter cards based on game-specific or global settings.
 */
export function filterBySettings(
  cards: TransformedCard[],
  settings: AppSettings,
  gameId: 'wordle' | 'picGuesser' | 'investigatordle' | 'storyGuesser' | 'traitGuesser' | 'flavourGuesser' | 'encounterGuesser'
): TransformedCard[] {
  const useGlobal = (settings[(`${gameId}UseGlobalPackFilter`) as keyof AppSettings] as boolean) ?? true;
  
  const packsToFilter = useGlobal 
    ? settings.filteredPacks 
    : ((settings[(`${gameId}FilteredPacks`) as keyof AppSettings] as string[]) || []);
    
  const incWeakness = useGlobal 
    ? settings.includeWeakness 
    : ((settings[(`${gameId}IncludeWeakness`) as keyof AppSettings] as boolean) ?? false);
    
  const incSignatures = useGlobal 
    ? settings.includeSignatures 
    : ((settings[(`${gameId}IncludeSignatures`) as keyof AppSettings] as boolean) ?? true);

  return cards.filter((card) => {
    const passPack = packsToFilter.length === 0 || !packsToFilter.includes(card.pack_name);
    const isWeakness = card.subtype_code === "basicweakness" || card.subtype_code === "weakness";
    const passWeakness = incWeakness || !isWeakness;
    const isSignature = !!card.restrictions?.investigator;
    const passSignature = incSignatures || !isSignature;

    const incBonded = useGlobal
      ? settings.includeBondedCard
      : ((settings[`${gameId}IncludeBondedCard` as keyof AppSettings] as boolean) ?? false);
    const isBonded = !!card.bonded_to;
    const passBonded = incBonded || !isBonded;

    return passPack && passWeakness && passSignature && passBonded;
  });
}

/**
 * Faction color map for dropdown class color styling.
 */
export const FACTION_COLORS: Record<FactionCode, string> = {
  guardian: 'rgba(30, 80, 180, 0.6)',
  mystic: 'rgba(120, 50, 180, 0.6)',
  rogue: 'rgba(30, 150, 60, 0.6)',
  seeker: 'rgba(200, 160, 40, 0.6)',
  survivor: 'rgba(180, 40, 40, 0.6)',
  neutral: 'rgba(120, 120, 120, 0.5)',
  mythos: 'rgba(120, 120, 120, 0.5)',
};

/**
 * Get faction colors for a TransformedCard.
 */
export function getCardFactionColors(card: TransformedCard): string[] {
  return card.class.map(fc => FACTION_COLORS[fc] || FACTION_COLORS.neutral);
}

/**
 * Check if a name appears more than once in a list.
 * Returns a Set of names that have duplicates.
 */
export function findDuplicateNames(items: { name: string }[]): Set<string> {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.name, (counts.get(item.name) || 0) + 1);
  }
  const dupes = new Set<string>();
  for (const [name, count] of counts) {
    if (count > 1) dupes.add(name);
  }
  return dupes;
}

/**
 * For Wordle: check if name+xp combo also has duplicates (need subname fallback).
 */
export function findDuplicateNameXp(items: { name: string; xp?: number }[]): Set<string> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = `${item.name}|${item.xp ?? 0}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const dupes = new Set<string>();
  for (const [key, count] of counts) {
    if (count > 1) dupes.add(key);
  }
  return dupes;
}

/**
 * Deduplication criteria for answer selection.
 * Determines which card attributes must match to be considered a "duplicate" in dropdown.
 */
export interface DeduplicateCriteria {
  name?: boolean;
  subname?: boolean;
  pack?: boolean;
  class?: boolean;
  xp?: boolean;
}

/**
 * Game evaluation criteria - what attributes must match for a card to match the answer
 */
export const GAME_EVALUATION_CRITERIA = {
  wordle: { name: true, subname: true, xp: true, class: true },
  picGuesser: { class: true, pack: true, name: true, xp: true },
  traitGuesserInv: { name: true, pack: true, class: true },
  traitGuesserCard: { name: true, pack: true, class: true },
  storyGuesser: { class: true, pack: true, name: true },
  flavourGuesser: { class: true, pack: true, name: true, xp: true },
  investigatordle: { name: true, pack: true, class: true },
  encounterGuesser: { name: true, pack: true, class: true },
} as const;

/**
 * Build a unique key from card attributes based on criteria.
 * Used for deduplication in dropdown.
 */
function buildKeyFromCriteria(
  card: TransformedCard,
  criteria: DeduplicateCriteria
): string {
  const parts: string[] = [];

  if (criteria.name) {
    parts.push(card.name);
  }

  if (criteria.subname) {
    const subname = 'subname' in card ? card.subname : '';
    parts.push(subname || '');
  }

  if (criteria.pack) {
    parts.push(card.pack_name);
  }

  if (criteria.class) {
    const classes = 'class' in card ? card.class : [];
    parts.push(classes.join(','));
  }

  if (criteria.xp) {
    const xp = 'xp' in card ? card.xp : 0;
    parts.push(String(xp ?? 0));
  }

  return parts.join('|');
}

/**
 * Deduplicate cards based on evaluation criteria.
 * Removes duplicate entries from dropdown while keeping first occurrence.
 */
export function deduplicateByEvaluationCriteria(
  cards: TransformedCard[],
  criteria: DeduplicateCriteria
): TransformedCard[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = buildKeyFromCriteria(card, criteria);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Filter cards for Wordle game.
 * Includes all cards that passed global filters (packs, weaknesses, signatures).
 */
export function filterForWordle(cards: TransformedCard[]): TransformedCard[] {
  const allowedTypes: TypeName[] = [TypeNameEnum.ASSET, TypeNameEnum.EVENT, TypeNameEnum.SKILL];
  return cards.filter((card) => allowedTypes.includes(card.typeName));
}

/**
 * Filter cards for PicGuesser game.
 * Only Asset, Event, and Skill type cards.
 */
export function filterForPicGuesser(cards: TransformedCard[]): TransformedCard[] {
  return cards.filter((card) => card.typeName !== TypeNameEnum.INVESTIGATOR);
}

/**
 * Filter cards for FlavourGuesser game.
 * Applies type filters from settings.
 */
export function filterForFlavourGuesser(
  cards: TransformedCard[],
  typeFilters: Record<TypeName, boolean>
): TransformedCard[] {
  return cards.filter((card) => typeFilters[card.typeName] ?? true);
}

/**
 * Filter out cards that have a `duplicate_of_code` field.
 * These are variant reprints that should be excluded from all games.
 */
export function filterDuplicateOfCode<T extends { duplicate_of_code?: string }>(items: T[]): T[] {
  return items.filter((item) => !item.duplicate_of_code);
}

/**
 * Filter cards for EncounterGuesser game.
 * Requires cards to have encounter_code and encounter_name.
 */
export function filterForEncounterGuesser(cards: TransformedCard[]): TransformedCard[] {
  return cards.filter((card) => !!card.encounter_name);
}
