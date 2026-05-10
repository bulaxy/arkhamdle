import localforage from 'localforage';
import { buildPackCodeToGroupMap } from '../data/packStructure';
import type { ArkhamCard, TransformedCard } from '../types';
import { TypeName, Slot, FactionCode } from '../types';

localforage.config({
  name: 'arkhamdle',
  storeName: 'arkhamdb_data'
});

const CARDS_API = 'https://arkhamdb.com/api/public/cards/';
const CACHE_KEY_CARDS = 'arkhamdb_cards';
const CACHE_KEY_ENCOUNTER = 'arkhamdb_cards_encounter';

// Build the pack-code-to-group reverse map once at module load
const packGroupMap = buildPackCodeToGroupMap();

const toLowerCamelCase = (str: string): string => {
  return str.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

const VALID_TYPES = new Set(Object.values(TypeName));

export const fetchCards = async (includeEncounter = false, forceRefresh = false): Promise<ArkhamCard[]> => {
  const cacheKey = includeEncounter ? CACHE_KEY_ENCOUNTER : CACHE_KEY_CARDS;
  
  if (!forceRefresh) {
    const cached = await localforage.getItem<ArkhamCard[]>(cacheKey);
    if (cached) return cached;
  }
  
  const url = includeEncounter ? `${CARDS_API}?encounter=1` : CARDS_API;
  const res = await fetch(url);
  const data = await res.json();
  await localforage.setItem(cacheKey, data);
  return data;
};

export const transformCards = (cards: ArkhamCard[]): TransformedCard[] => {
  return cards
    .map(o => {
      const name = o.real_name || o.name;
      const subname = o.subname || '';
      const xp = o.xp ?? 0;
      const rawTypeName = toLowerCamelCase(o.type_code);
      const typeName = VALID_TYPES.has(rawTypeName as TypeName) ? (rawTypeName as TypeName) : TypeName.OTHER;
      if (typeName === "other") {
        console.log(`[ArkhamDbService] Found unknown typeName: ${o.type_code} (normalized to ${rawTypeName})`);
      }

      const pack_name = (packGroupMap.get(o.pack_code) || 'OTHER').toUpperCase();
      const fullName = typeName === TypeName.INVESTIGATOR ? `${name} (${pack_name})` : `${name}${subname ? ' ' + subname : ''}${xp > 0 ? ' (' + xp + ')' : ''}`;
      
      return {
        id: o.code,
        name: name,
        subname: subname,
        fullName: fullName,
        imagesrc: o.imagesrc || '',
        pack_code: o.pack_code,
        pack_name: (packGroupMap.get(o.pack_code) || 'OTHER').toUpperCase(),
        flavor: o.flavor || '',
        subtype_code: o.subtype_code,
        cardName: o.subname ? `${o.real_name || o.name} - ${o.subname}` : (o.real_name || o.name),
        typeName: typeName,
        class: Array.from(new Set([o.faction_code, o.faction2_code, o.faction3_code].filter(Boolean) as FactionCode[])),
        xp: xp,
        traits: o.traits?.trim().split('.').filter(Boolean).map(t => t.trim()) || [],
        slot: o.slot as Slot | undefined,
        cost: o.cost ?? 0,
        wild: o.skill_wild ?? 0,
        willpower: o.skill_willpower ?? 0,
        intellect: o.skill_intellect ?? 0,
        combat: o.skill_combat ?? 0,
        agility: o.skill_agility ?? 0,
        restrictions: o.restrictions,
        duplicate_of_code: o.duplicate_of_code,
        health: o.health,
        sanity: o.sanity,
        enemy_damage: o.enemy_damage,
        enemy_horror: o.enemy_horror,
        enemy_fight: o.enemy_fight,
        enemy_evade: o.enemy_evade,
        clues: o.clues,
        shroud: o.shroud,
        doom: o.doom,
        victory: o.victory,
        vengeance: o.vengeance,
        health_per_investigator: o.health_per_investigator,
        back_flavor: o.back_flavor,
        encounter_code: o.encounter_code,
        encounter_name: o.encounter_name,
        permanent: o.permanent,
        exile: o.exile,
        exceptional: o.exceptional,
        myriad: o.myriad,
        is_unique: o.is_unique,
        bonded_to: o.bonded_to,
        text: o.text,
      };
    })
    .filter((card, _, array) => {
      // Keep only the first occurrence of duplicate cards (same name, class, xp)
      const duplicates = array.filter(item => item.name === card.name && item.class === card.class && item.xp === card.xp);
      if (duplicates.length > 1) {
        const isFirstOccurrence = duplicates[0].id === card.id;
        if (!isFirstOccurrence) {
          console.warn(`Deduplicating card: ${card.name} (keeping ${duplicates[0].id}, removing ${card.id})`);
        }
        return isFirstOccurrence;
      }
      return true;
    });
};

