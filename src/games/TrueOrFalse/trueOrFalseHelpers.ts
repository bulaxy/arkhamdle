import { type TransformedCard } from '../../types';
import { cardHasKeyword } from '../shared/trivia/triviaTemplates';
import { buildPackCodeToGroupMap } from '../../data/packStructure';

const packCodeToGroup = buildPackCodeToGroupMap();

export function getPackGroup(packCode: string): string {
  return (packCodeToGroup.get(packCode) || 'OTHER').toLowerCase();
}

export type EnemyQuestionType =  
  | 'PicMismatch' | 'Fight' | 'Horror' | 'Damage' | 'Evade' | 'Health' 
  | 'Retaliate' | 'Hunter' | 'Alert' | 'Aloof' | 'Elusive' | 'Victory'
  | 'Prey' | 'Massive' | 'Spawn' | 'Forced' | 'Revelation';

export type LocationQuestionType = | 'PicMismatch' | 'Clues' | 'Shroud' | 'Forced' | 'Resign' | 'Victory';
export type ActQuestionType = 'Clues' | 'Forced' | 'Objective' | 'Resign';
export type AgendaQuestionType = 'Doom' | 'Forced' | 'Resign';
export type TreacheryQuestionType = 'PicMismatch' | 'Forced'| 'Surge' ;

export type AnyQuestionType = EnemyQuestionType | LocationQuestionType | ActQuestionType | AgendaQuestionType | TreacheryQuestionType | 'Traits' | 'AgendaAct';

export interface GameQuestion {
  card: TransformedCard;
  isTrue: boolean;
  questionText: string;
  displayedValue: string;
  type: AnyQuestionType;
  fakeCard?: TransformedCard;
}

export function generateFakeCardForMismatch(
  randomCard: TransformedCard,
  pool: TransformedCard[],
  packCodeThreshold: number = 0.75,
  isAgendaAct: boolean = false
): TransformedCard | null {
  let candidatePool = pool.filter(c => c.name !== randomCard.name);
  
  if (isAgendaAct) {
    // Make sure an agenda 1/2/3 wont be selected together
    candidatePool = candidatePool.filter(
      c => !(randomCard.pack_code === c.pack_code && randomCard.typeName === c.typeName)
    );
  }
  
  const rnd = Math.random();
  const currentCandidatePool = rnd < packCodeThreshold
    ? candidatePool.filter(c => c.pack_code === randomCard.pack_code)
    : candidatePool;
  
  if (currentCandidatePool.length > 0) {
    return currentCandidatePool[Math.floor(Math.random() * currentCandidatePool.length)];
  }
  return null;
}

export function generatePicMismatchQuestion(
  randomCard: TransformedCard,
  isTrue: boolean,
  pool: TransformedCard[],
  packCodeThreshold: number = 0.75,
  isAgendaAct: boolean = false,
  type: AnyQuestionType = 'PicMismatch',
  useSpellingArstwork: boolean = false
): GameQuestion | null {
  let fakeCard: TransformedCard | undefined;
  
  if (!isTrue) {
    const fake = generateFakeCardForMismatch(randomCard, pool, packCodeThreshold, isAgendaAct);
    if (!fake) return null;
    fakeCard = fake;
  }
  
  const artworkSpelling = useSpellingArstwork ? 'arstwork' : 'artwork';
  
  return {
    card: randomCard,
    isTrue,
    questionText: `Is this the right ${artworkSpelling} for ${fakeCard?.name ?? randomCard.name}?`,
    displayedValue: '',
    type,
    fakeCard
  };
}


export function generateFalseStatValue(
  val: number,
  type: AnyQuestionType,
  isElite?: boolean
): number | null {
  const isPlus = Math.random() >= 0.5;
  let fakeValue = val + (isPlus ? 1 : -1);

  if (type === 'Damage' || type === 'Horror') {
    if (fakeValue < 0) fakeValue = val + 1;
    if (fakeValue > 3) fakeValue = val - 1;
    if (!isElite && fakeValue > 2) fakeValue = Math.min(fakeValue, 2);
    if (fakeValue === val) fakeValue = val - 1;
    if (fakeValue < 0 || fakeValue > (isElite ? 3 : 2)) return null;
  } else if (type === 'Fight' || type === 'Health' || type === 'Evade') {
    if (fakeValue <= 0) fakeValue = val + 1;
    if (!isElite && fakeValue > 5) fakeValue = val - 1;
    if (fakeValue === val || fakeValue <= 0 || (!isElite && fakeValue > 5)) return null;
  } else if (type === 'Victory') {
    if (fakeValue <= 0) fakeValue = val + 1;
    if (isElite && fakeValue === 2) fakeValue = val === 1 ? 3 : 1; 
    if (fakeValue === val || fakeValue <= 0) return null;
  } else if (type === 'Clues') {
    if (fakeValue < 0) fakeValue = val + 1;
    if (fakeValue > 6) fakeValue = val - 1;
    if (fakeValue < 0 || fakeValue > 6) return null;
  } else if (type === 'Doom') {
    if (fakeValue < 1) fakeValue = val + 1;
    if (fakeValue < 1) return null;
  } else if (type === 'Shroud') {
    if (fakeValue < 0) fakeValue = val + 1;
    if (fakeValue > 7) fakeValue = val - 1;
    if (fakeValue < 0 || fakeValue > 7) return null;
  }

  return fakeValue === val ? null : fakeValue;
}

// Helper: Get a random value based on given weights
export function getWeightedRandom<T>(options: { type: T; weight: number }[]): T {
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  let randomVal = Math.random() * totalWeight;
  for (const opt of options) {
    randomVal -= opt.weight;
    if (randomVal <= 0) return opt.type;
  }
  return options[0].type; // Fallback
}

// Helper: Filter and return random displayed keyword for questions
export function getKeywordDisplayValue(
  card: TransformedCard,
  isTrue: boolean,
  selectedOption: string,
  allowedKeywords: string[]
): string | null {
  const hasKeywords = allowedKeywords.filter(k => cardHasKeyword(card, k));
  const hasNotKeywords = allowedKeywords.filter(k => !cardHasKeyword(card, k));
  const pool = isTrue ? hasKeywords : hasNotKeywords;
  if (pool.length === 0) return null;
  return pool.includes(selectedOption) 
    ? selectedOption 
    : pool[Math.floor(Math.random() * pool.length)];
}
