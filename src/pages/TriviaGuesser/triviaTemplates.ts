import type { TransformedCard } from "../../types";

export type QuestionTemplateType = 
  | 'Trait'
  | 'Two Traits'
  | 'Exile'
  | 'XP'
  | 'Slot'
  | 'Exceptional'
  | 'Myriad'
  | 'All 5 Skills'
  | 'Health/Sanity'
  | 'Permanent'
  | 'Cost'
  | 'Enemy Damage'
  | 'Enemy Horror'
  | 'Enemy Fight'
  | 'Enemy Evade'
  | 'Is Unique'
  | 'Clues'
  | 'Shroud'
  | 'Victory';

export interface QuestionTemplate {
  type: QuestionTemplateType;
  condition: (card: TransformedCard, value?: unknown, value2?: unknown) => boolean;
  generateValues: (cards: TransformedCard[]) => unknown[];
  formatQuestion: (value?: unknown, value2?: unknown, packName?: string) => string;
}

export const TRIVIA_TEMPLATES: QuestionTemplate[] = [
  {
    type: 'Trait',
    condition: (card, trait) => card.traits?.includes(trait as string) ?? false,
    generateValues: (cards) => {
      const traitCounts = new Map<string, number>();
      cards.forEach(c => {
        c.traits?.forEach(t => {
          traitCounts.set(t, (traitCounts.get(t) || 0) + 1);
        });
      });
      // Only include traits that appear on at least 2 cards
      return Array.from(traitCounts.entries())
        .filter(([, count]) => count >= 2)
        .map(([t]) => t);
    },
    formatQuestion: (trait, _, packName) => `How many cards with Trait "${trait}" are in ${packName}?`
  },
  {
    type: 'Two Traits',
    condition: (card, traits) => {
      if (!card.traits) return false;
      const t = traits as string[];
      return card.traits.includes(t[0]) && card.traits.includes(t[1]);
    },
    generateValues: (cards) => {
      const traitPairs = new Map<string, number>();
      cards.forEach(c => {
        if (c.traits && c.traits.length >= 2) {
          for (let i = 0; i < c.traits.length; i++) {
            for (let j = i + 1; j < c.traits.length; j++) {
              // sort to avoid duplicate pairs in different orders
              const pair = [c.traits[i], c.traits[j]].sort().join('|');
              traitPairs.set(pair, (traitPairs.get(pair) || 0) + 1);
            }
          }
        }
      });
      // Only include pairs that appear on at least 2 cards
      return Array.from(traitPairs.entries())
        .filter(([, count]) => count >= 2)
        .map(([p]) => p.split('|'));
    },
    formatQuestion: (traits, _, packName) => {
      const t = traits as string[];
      return `How many cards with Trait "${t[0]}" and "${t[1]}" are in ${packName}?`;
    }
  },
  {
    type: 'Exile',
    // Exile is not directly on TransformedCard. Let's assume we can map it if it exists, or just use text check.
    // Looking at ArkhamCard, exile is a boolean. TransformedCard doesn't seem to have it in types.ts.
    // I need to check how to detect exile.
    condition: (card: TransformedCard) => card.exile === true,
    generateValues: () => [true],
    formatQuestion: (_, __, packName) => `How many cards have "exile" keyword in ${packName}?`
  },
  {
    type: 'XP',
    condition: (card, xp) => card.xp === xp,
    generateValues: (cards) => {
      const xps = new Set<number>();
      cards.forEach(c => { if (c.xp !== undefined) xps.add(c.xp); });
      return Array.from(xps).filter(xp => !isNaN(xp));
    },
    formatQuestion: (xp, _, packName) => `How many ${xp} XP cards are in ${packName}?`
  },
  {
    type: 'Slot',
    condition: (card, slot) => card.slot === slot,
    generateValues: (cards) => {
      const slots = new Set<string>();
      cards.forEach(c => { if (c.slot) slots.add(c.slot); });
      return Array.from(slots);
    },
    formatQuestion: (slot, _, packName) => `How many cards with ${slot} slot are in ${packName}?`
  },
  {
    type: 'Exceptional',
    condition: (card: TransformedCard) => card.exceptional === true,
    generateValues: () => [true],
    formatQuestion: (_, __, packName) => `How many exceptional cards are in ${packName}?`
  },
  {
    type: 'Myriad',
    condition: (card: TransformedCard) => card.myriad === true,
    generateValues: () => [true],
    formatQuestion: (_, __, packName) => `How many myriad cards are in ${packName}?`
  },
  {
    type: 'All 5 Skills',
    condition: (card) => {
      return (card.willpower ?? 0) > 0 &&
             (card.intellect ?? 0) > 0 &&
             (card.combat ?? 0) > 0 &&
             (card.agility ?? 0) > 0 &&
             (card.wild ?? 0) > 0;
    },
    generateValues: () => [true],
    formatQuestion: (_, __, packName) => `How many cards commit for all 5 skill icons (including wild) are in ${packName}?`
  },
  {
    type: 'Health/Sanity',
    condition: (card, val) => {
      const v = val as { h: number; s: number };
      return card.health === v.h && card.sanity === v.s;
    },
    generateValues: (cards) => {
      const pairs = new Map<string, number>();
      cards.forEach(c => {
        if (c.health !== undefined && c.sanity !== undefined) {
          const p = `${c.health}|${c.sanity}`;
          pairs.set(p, (pairs.get(p) || 0) + 1);
        }
      });
      // Only include combinations that appear on at least 2 cards
      return Array.from(pairs.entries())
        .filter(([, count]) => count >= 2)
        .map(([p]) => {
          const [h, s] = p.split('|');
          return { h: parseInt(h, 10), s: parseInt(s, 10) };
        });
    },
    formatQuestion: (val, _, packName) => {
      const v = val as { h: number; s: number };
      return `How many cards have exactly ${v.h} health and ${v.s} sanity in ${packName}?`;
    }
  },
  {
    type: 'Permanent',
    condition: (card) => card.permanent === true,
    generateValues: () => [true],
    formatQuestion: (_, __, packName) => `How many permanent cards are in ${packName}?`
  },
  {
    type: 'Cost',
    condition: (card, cost) => card.cost === cost,
    generateValues: (cards) => {
      const costs = new Set<number>();
      cards.forEach(c => { if (c.cost !== undefined && !isNaN(c.cost)) costs.add(c.cost); });
      return Array.from(costs);
    },
    formatQuestion: (cost, _, packName) => `How many cards cost ${cost} are in ${packName}?`
  },
  {
    type: 'Enemy Damage',
    condition: (card, dmg) => card.enemy_damage === dmg,
    generateValues: (cards) => {
      const vals = new Set<number>();
      cards.forEach(c => { if (c.enemy_damage !== undefined) vals.add(c.enemy_damage); });
      return Array.from(vals);
    },
    formatQuestion: (dmg, _, packName) => `How many enemies deal ${dmg} damage are in ${packName}?`
  },
  {
    type: 'Enemy Horror',
    condition: (card, hrr) => card.enemy_horror === hrr,
    generateValues: (cards) => {
      const vals = new Set<number>();
      cards.forEach(c => { if (c.enemy_horror !== undefined) vals.add(c.enemy_horror); });
      return Array.from(vals);
    },
    formatQuestion: (hrr, _, packName) => `How many enemies deal ${hrr} horror are in ${packName}?`
  },
  {
    type: 'Enemy Fight',
    condition: (card, fgt) => card.enemy_fight === fgt,
    generateValues: (cards) => {
      const vals = new Set<number>();
      cards.forEach(c => { if (c.enemy_fight !== undefined) vals.add(c.enemy_fight); });
      return Array.from(vals);
    },
    formatQuestion: (fgt, _, packName) => `How many enemies have ${fgt} fight are in ${packName}?`
  },
  {
    type: 'Enemy Evade',
    condition: (card, evd) => card.enemy_evade === evd,
    generateValues: (cards) => {
      const vals = new Set<number>();
      cards.forEach(c => { if (c.enemy_evade !== undefined) vals.add(c.enemy_evade); });
      return Array.from(vals);
    },
    formatQuestion: (evd, _, packName) => `How many enemies have ${evd} evade are in ${packName}?`
  },
  {
    type: 'Is Unique',
    condition: (card: TransformedCard) => card.is_unique === true,
    generateValues: () => [true],
    formatQuestion: (_, __, packName) => `How many unique cards (with *) are in ${packName}?`
  },
  {
    type: 'Clues',
    condition: (card, clu) => card.clues === clu,
    generateValues: (cards) => {
      const vals = new Set<number>();
      cards.forEach(c => { if (c.clues !== undefined) vals.add(c.clues); });
      return Array.from(vals);
    },
    formatQuestion: (clu, _, packName) => `How many locations have ${clu} clues are in ${packName}?`
  },
  {
    type: 'Shroud',
    condition: (card, shd) => card.shroud === shd,
    generateValues: (cards) => {
      const vals = new Set<number>();
      cards.forEach(c => { if (c.shroud !== undefined) vals.add(c.shroud); });
      return Array.from(vals);
    },
    formatQuestion: (shd, _, packName) => `How many locations have ${shd} shroud are in ${packName}?`
  },
  {
    type: 'Victory',
    condition: (card, vic) => card.victory === vic,
    generateValues: (cards) => {
      const vals = new Set<number>();
      cards.forEach(c => { if (c.victory !== undefined) vals.add(c.victory); });
      return Array.from(vals);
    },
    formatQuestion: (vic, _, packName) => `How many cards have Victory ${vic} are in ${packName}?`
  }
];
