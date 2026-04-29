import localforage from 'localforage';
import { buildPackCodeToGroupMap } from '../data/packStructure';
import type { ArkhamCard, TransformedCard, TransformedInvestigator } from '../types';
import { SubtypeCode, TypeCode } from '../types';

localforage.config({
  name: 'arkhamdle',
  storeName: 'arkhamdb_data'
});

const CARDS_API = 'https://arkhamdb.com/api/public/cards/';
const CACHE_KEY_CARDS = 'arkhamdb_cards';

// Build the pack-code-to-group reverse map once at module load
const packGroupMap = buildPackCodeToGroupMap();

export const fetchCards = async (forceRefresh = false): Promise<ArkhamCard[]> => {
  if (!forceRefresh) {
    const cached = await localforage.getItem<ArkhamCard[]>(CACHE_KEY_CARDS);
    if (cached) return cached;
  }
  const res = await fetch(CARDS_API);
  const data = await res.json();
  await localforage.setItem(CACHE_KEY_CARDS, data);
  return data;
};

export const transformCards = (cards: ArkhamCard[]): TransformedCard[] => {
  return cards
    .filter(o => 
      !o.duplicate_of &&
      !o.restrictions &&
      !o.bonded_to &&
      (
        ([TypeCode.SKILL, TypeCode.ASSET, TypeCode.EVENT] as TypeCode[]).includes(o.type_code) ||
        [SubtypeCode.BASICWEAKNESS, SubtypeCode.WEAKNESS].includes(o.subtype_code as SubtypeCode)
      )
    )
    .map(o => {
      const name = o.real_name || o.name;
      const subname = o.subname || '';
      const xp = o.xp ?? 0;
      const fullName = `${name}${subname ? ' ' + subname : ''}${xp > 0 ? ' (' + xp + ')' : ''}`;
      
      return {
        id: o.code,
        name: name,
        fullName: fullName,
        imagesrc: o.imagesrc || '',
        pack_code: o.pack_code,
        pack_name: packGroupMap.get(o.pack_code) || 'other',
        flavor: o.flavor || '',
        subtype_code: o.subtype_code,
        cardName: [o.subname ? `${o.real_name || o.name} - ${o.subname}` : (o.real_name || o.name)],
        typeName: [o.type_name],
        class: Array.from(new Set([o.faction_code, o.faction2_code, o.faction3_code].filter(Boolean) as any[])),
        xp: [xp],
        traits: o.traits?.trim().split('.').filter(Boolean).map(t => t.trim()) || [],
        slot: o.slot?.trim().split('.').filter(Boolean).map(t => t.trim()) || ['none'],
        cost: [o.cost ?? 0],
        wild: [o.skill_wild ?? 0],
        willpower: [o.skill_willpower ?? 0],
        intellect: [o.skill_intellect ?? 0],
        combat: [o.skill_combat ?? 0],
        agility: [o.skill_agility ?? 0],
      };
    })
    .filter((card, _, array) => {
      const sameNameList = array.filter(item => item.cardName === card.cardName && item.class === card.class && item.xp[0] === card.xp[0]);
      if (sameNameList.length > 1) {
        return sameNameList[0].id === card.id;
      }
      return true;
    });
};

export const transformInvestigators = (cards: ArkhamCard[]): TransformedInvestigator[] => {
  return cards
    .filter(o => o.type_code === TypeCode.INVESTIGATOR)
    .map(o => {
      const name = o.real_name || o.name;
      const subname = o.subname || '';
      const pack_name = packGroupMap.get(o.pack_code) || 'other';
      return {
        id: o.code,
        name: name,
        subname: subname,
        fullName: `${name} (${pack_name})`,
        imagesrc: o.imagesrc || '',
        pack_code: o.pack_code,
        pack_name: pack_name,
        subtype_code: o.subtype_code,
        faction_code: [o.faction_code],
        health: [o.health ?? 0],
        sanity: [o.sanity ?? 0],
        agility: [o.skill_agility ?? 0],
        combat: [o.skill_combat ?? 0],
        intellect: [o.skill_intellect ?? 0],
        willpower: [o.skill_willpower ?? 0],
        traits: o.traits?.trim().split('.').filter(Boolean).map(t => t.trim()) || [],
        back_flavor: o.back_flavor || ''
      };
    });
};
