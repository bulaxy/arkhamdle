import type { TransformedCard } from "../../../types";
import { packsAtLeastOneSameOrNewerThan } from "../../../data/packStructure";

export type QuestionTemplateType = 
  | 'Trait'
  | 'Two Traits'
  | 'Exile'
  | 'XP'
  | 'Slot'
  | 'Exceptional'
  | 'Myriad'
  | 'Health'
  | 'Sanity'
  | 'Permanent'
  | 'Cost'
  | 'Enemy Damage'
  | 'Enemy Horror'
  | 'Enemy Fight'
  | 'Enemy Evade'
  | 'Is Unique'
  | 'Clues'
  | 'Shroud'
  | 'Victory'
  | 'Keyword Hunter'
  | 'Keyword Alert'
  | 'Keyword Retaliate'
  | 'Keyword Patrol'
  | 'Keyword Peril'
  | 'Keyword Massive'
  | 'Keyword Prey'
  | 'Keyword Aloof'
  | 'Keyword Surge'
  | 'Multi Skill 2'
  | 'Multi Skill 3'
  | 'Keyword Elusive'
  | 'Keyword Fast'
  | 'Keyword Spawn';

export interface QuestionTemplate {
  type: QuestionTemplateType;
  condition: (card: TransformedCard, value?: unknown, value2?: unknown) => boolean;
  generateValues: (cards: TransformedCard[], remainderPacks: string[]) => unknown[];
  formatQuestion: (value?: unknown, value2?: unknown, packName?: string) => string;
}

/**
 * Check if a card has a specific keyword as a game mechanic (not conditionally gained).
 * Keywords appear as standalone words followed by a period, at the start of a line
 * or after another keyword's period, e.g. "Hunter." or "Aloof. Hunter."
 * 
 * Special cases:
 * - Prey appears as "<b>Prey</b> - description" 
 * - Patrol appears as "Patrol (location)."
 * 
 * Excludes conditional usages like: 'gains: "Hunter."' or 'gains Hunter'
 */
export function cardHasKeyword(card: TransformedCard, keyword: string): boolean {
  const text = card.text;
  if (!text || !text.includes(keyword)) return false;

  // Normalize: replace <br/> with newlines for line-based analysis
  const normalized = text.replace(/<br\s*\/?>/gi, '\n');
  const lines = normalized.split('\n');

  for (const line of lines) {
    const stripped = line.trim();

    // Skip lines that contain conditional granting patterns (inside quotes)
    // e.g. 'gains: "Hunter. Prey - ..."' or 'gains Hunter'
    if (/gains[^"]*"[^"]*$/.test(stripped) || /gains\s/.test(stripped)) {
      // Check if the keyword is inside a quoted section on this line
      const quoteMatch = stripped.match(/"([^"]*)"/);
      if (quoteMatch && quoteMatch[1].includes(keyword)) {
        continue; // Skip - this is a conditional gain
      }
    }

    // Remove HTML bold tags for cleaner matching
    const clean = stripped.replace(/<\/?b>/g, '');

    if (keyword === 'Prey' || keyword === 'Spawn') {
      // Prey and Spawn appear as "Keyword - description" (possibly with <b> tags)
      // Must be at the start of the line (after stripping)
      if (new RegExp(`^${keyword}\\s*-`).test(clean)) {
        return true;
      }
    } else if (keyword === 'Patrol') {
      // Patrol appears as "Patrol (location)." at start of line or after another keyword's period
      // e.g. "Aloof. Patrol (nearest location with clues)." or "Patrol (Room 245). Retaliate."
      if (/(?:^|(?:\.\s+))Patrol\s*\(/.test(clean)) {
        return true;
      }
    } else {
      // Standard keywords: "Hunter." at start of line or after ". "
      // Matches: "Hunter.", "Aloof. Hunter.", "Hunter. Retaliate."
      if (new RegExp(`(?:^|(?:\\.\\s+))${keyword}\\.`).test(clean)) {
        return true;
      }
    }
  }

  return false;
}

export const TRIVIA_TEMPLATES: QuestionTemplate[] = [
  {
    type: 'Trait',
    condition: (card, trait) => card.traits?.includes(trait as string) ?? false,
    generateValues: (cards) => {
      const traitCounts = new Map<string, number>();
      cards.forEach(c => {
        c.traits?.forEach((t: string) => {
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
    generateValues: (_, packs) => {
      if (packsAtLeastOneSameOrNewerThan(packs, 'tde')) {
        return [true];
      }
      return [];
    },
    formatQuestion: (_, __, packName) => `How many myriad cards are in ${packName}?`
  },
  {
    type: 'Health',
    condition: (card, val) => card.health === (val as number),
    generateValues: (cards) => {
      const healthCounts = new Map<number, number>();
      cards.forEach(c => {
        if (c.health !== undefined) {
          healthCounts.set(c.health, (healthCounts.get(c.health) || 0) + 1);
        }
      });
      // Only include health values that appear on at least 2 cards
      return Array.from(healthCounts.entries())
        .filter(([, count]) => count >= 2)
        .map(([h]) => h);
    },
    formatQuestion: (val, _, packName) => {
      return `How many cards have exactly ${val} health in ${packName}?`;
    }
  },
  {
    type: 'Sanity',
    condition: (card, val) => card.sanity === (val as number),
    generateValues: (cards) => {
      const sanityCounts = new Map<number, number>();
      cards.forEach(c => {
        if (c.sanity !== undefined) {
          sanityCounts.set(c.sanity, (sanityCounts.get(c.sanity) || 0) + 1);
        }
      });
      // Only include sanity values that appear on at least 2 cards
      return Array.from(sanityCounts.entries())
        .filter(([, count]) => count >= 2)
        .map(([s]) => s);
    },
    formatQuestion: (val, _, packName) => {
      return `How many cards have exactly ${val} sanity in ${packName}?`;
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
  },
  // Keyword-based questions (enemy-only)
  {
    type: 'Keyword Hunter',
    condition: (card) => card.typeName === 'enemy' && cardHasKeyword(card, 'Hunter'),
    generateValues: (cards) => {
      const count = cards.filter(c => c.typeName === 'enemy' && cardHasKeyword(c, 'Hunter')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many enemies have the "Hunter" keyword in ${packName}?`
  },
  {
    type: 'Keyword Alert',
    condition: (card) => card.typeName === 'enemy' && cardHasKeyword(card, 'Alert'),
    generateValues: (cards, packs) => {
      if(!packsAtLeastOneSameOrNewerThan(packs,'tfa')) {
        return [];
      }
      const count = cards.filter(c => c.typeName === 'enemy' && cardHasKeyword(c, 'Alert')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many enemies have the "Alert" keyword in ${packName}?`
  },
  {
    type: 'Keyword Retaliate',
    condition: (card) => card.typeName === 'enemy' && cardHasKeyword(card, 'Retaliate'),
    generateValues: (cards) => {
      const count = cards.filter(c => c.typeName === 'enemy' && cardHasKeyword(c, 'Retaliate')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many enemies have the "Retaliate" keyword in ${packName}?`
  },
  {
    type: 'Keyword Patrol',
    condition: (card) => card.typeName === 'enemy' && cardHasKeyword(card, 'Patrol'),
    generateValues: (cards) => {
      const count = cards.filter(c => c.typeName === 'enemy' && cardHasKeyword(c, 'Patrol')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many enemies have the "Patrol" keyword in ${packName}?`
  },
  {
    type: 'Keyword Peril',
    condition: (card) => card.typeName === 'enemy' && cardHasKeyword(card, 'Peril'),
    generateValues: (cards) => {
      const count = cards.filter(c => c.typeName === 'enemy' && cardHasKeyword(c, 'Peril')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many enemies have the "Peril" keyword in ${packName}?`
  },
  {
    type: 'Keyword Massive',
    condition: (card) => card.typeName === 'enemy' && cardHasKeyword(card, 'Massive'),
    generateValues: (cards) => {
      const count = cards.filter(c => c.typeName === 'enemy' && cardHasKeyword(c, 'Massive')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many enemies have the "Massive" keyword in ${packName}?`
  },
  {
    type: 'Keyword Prey',
    condition: (card) => card.typeName === 'enemy' && cardHasKeyword(card, 'Prey'),
    generateValues: (cards) => {
      const count = cards.filter(c => c.typeName === 'enemy' && cardHasKeyword(c, 'Prey')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many enemies have the "Prey" keyword in ${packName}?`
  },
  {
    type: 'Keyword Aloof',
    condition: (card) => card.typeName === 'enemy' && cardHasKeyword(card, 'Aloof'),
    generateValues: (cards, packs) => {
      if(!packsAtLeastOneSameOrNewerThan(packs,'dwl')) {
        return [];
      }
      const count = cards.filter(c => c.typeName === 'enemy' && cardHasKeyword(c, 'Aloof')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many enemies have the "Aloof" keyword in ${packName}?`
  },
  {
    type: 'Keyword Elusive',
    condition: (card) => card.typeName === 'enemy' && cardHasKeyword(card, 'Elusive'),
    generateValues: (cards, packs) => {
      if(!packsAtLeastOneSameOrNewerThan(packs,'fhv')) {
        return [];
      }
      const count = cards.filter(c => c.typeName === 'enemy' && cardHasKeyword(c, 'Elusive')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many enemies have the "Aloof" keyword in ${packName}?`
  },
  // Keyword-based question (all card types)
  {
    type: 'Keyword Surge',
    condition: (card) => cardHasKeyword(card, 'Surge'),
    generateValues: (cards) => {
      const count = cards.filter(c => cardHasKeyword(c, 'Surge')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many cards have the "Surge" keyword in ${packName}?`
  },
  {
    type: 'Keyword Fast',
    condition: (card) => cardHasKeyword(card, 'Fast'),
    generateValues: (cards) => {
      const count = cards.filter(c => cardHasKeyword(c, 'Fast')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many cards have the "Fast" keyword in ${packName}?`
  },
  {
    type: 'Keyword Spawn',
    condition: (card) => card.typeName === 'enemy' && cardHasKeyword(card, 'Spawn'),
    generateValues: (cards) => {
      const count = cards.filter(c => c.typeName === 'enemy' && cardHasKeyword(c, 'Spawn')).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many enemies have the "Spawn" keyword in ${packName}?`
  },
  // Skill icon diversity questions
  {
    type: 'Multi Skill 2',
    condition: (card) => {
      const skills = [card.willpower, card.intellect, card.combat, card.agility, card.wild];
      return skills.filter(s => s > 0).length >= 2;
    },
    generateValues: (cards) => {
      const count = cards.filter(c => {
        const skills = [c.willpower, c.intellect, c.combat, c.agility, c.wild];
        return skills.filter(s => s > 0).length >= 2;
      }).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many cards have 2 or more different skill icons in ${packName}?`
  },
  {
    type: 'Multi Skill 3',
    condition: (card) => {
      const skills = [card.willpower, card.intellect, card.combat, card.agility, card.wild];
      return skills.filter(s => s > 0).length >= 3;
    },
    generateValues: (cards) => {
      const count = cards.filter(c => {
        const skills = [c.willpower, c.intellect, c.combat, c.agility, c.wild];
        return skills.filter(s => s > 0).length >= 3;
      }).length;
      return count >= 2 ? [true] : [];
    },
    formatQuestion: (_, __, packName) => `How many cards have 3 or more different skill icons in ${packName}?`
  },
];

