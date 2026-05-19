import { TRIVIA_TEMPLATES } from './triviaTemplates';
import type { TransformedCard } from '../../../types';

export interface TriviaQuestion {
  mode: 'How Many' | 'Which Card';
  questionText: string;
  correctAnswer: number | string; // number for How Many, card id for Which Card
  correctCardDisplay?: string; // e.g. "The Gold Bug (Pack Name)"
  options: (number | string)[]; // 4 options for multiple choice
  matchingCards: TransformedCard[]; // The cards that match (to show if they give up/answer)
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateHowManyQuestion(
  pool: TransformedCard[],
  packName: string,
): TriviaQuestion {
  // Shuffle templates to try
  const templates = shuffle([...TRIVIA_TEMPLATES]);
  
  // get remainder packs, some game mode only allow certain packs
  const remainderPacks = Array.from(new Set(pool.map(c => c.pack_code)));

  for (const template of templates) {
    // generateValues Also check if card pool allow specific packs
    const possibleValues = template.generateValues(pool, remainderPacks);
    if (possibleValues.length === 0) continue;

    // Pick a random value
    const val = possibleValues[Math.floor(Math.random() * possibleValues.length)];
    
    // Find matching cards
    const matchingCards = pool.filter(c => template.condition(c, val));
    const count = matchingCards.length;

    // If the answer is 0, 90% of the time try a different question
    if (count === 0 && Math.random() < 0.9) {
      continue;
    }

    // Generate wrong options (within +/- 5 or 50%)
    const optionsSet = new Set<number>();
    optionsSet.add(count);
    
    let attempts = 0;
    while (optionsSet.size < 4 && attempts < 100) {
      attempts++;
      const range = Math.max(5, Math.ceil(count * 0.5));
      const min = Math.max(1, count - range); // No 0
      const max = count + range;
      const randomOption = getRandomInt(min, max);
      if (randomOption !== 0 && randomOption !== count) {
        optionsSet.add(randomOption);
      }
    }

    // If we couldn't generate enough options (e.g. answer is 1, range is 1-6, maybe possible but rare), fallback to wider range
    while (optionsSet.size < 4) {
      const randomOption = getRandomInt(1, Math.max(10, count + 10));
      if (randomOption !== 0) optionsSet.add(randomOption);
    }

    const options = shuffle(Array.from(optionsSet));

    return {
      mode: 'How Many',
      questionText: template.formatQuestion(val, undefined, packName),
      correctAnswer: count,
      options,
      matchingCards
    };
  }

  // Fallback if no templates work
  return {
    mode: 'How Many',
    questionText: `How many cards are in ${packName}?`,
    correctAnswer: pool.length,
    options: [pool.length, pool.length + 1, pool.length + 2, pool.length + 3],
    matchingCards: pool
  };
}

export function generateWhichCardQuestion(
  pool: TransformedCard[],
  allCards: TransformedCard[] // used to find wrong options sharing traits
): TriviaQuestion {
  // We need to find a card that is uniquely identified by some combination of traits/type/class
  const shuffledPool = shuffle(pool)

  for (const card of shuffledPool) {
    if (!card.traits || card.traits.length === 0) continue;

    // Create possible signatures
    const sig1 = card.traits.join(', ');
    const sig2 = `${card.typeName}, ${card.traits.join(', ')}`;
    const sig3 = `${card.class.join('/')}, ${card.typeName}, ${card.traits.join(', ')}`;

    // Check uniqueness in the entire allCards database to ensure we don't select cards
    // with duplicate printings/levels (e.g. Occult Lexicon) or shared traits.
    const matches1 = allCards.filter(c => c.traits && c.traits.join(', ') === card.traits!.join(', '));
    const matches2 = allCards.filter(c => c.traits && c.typeName === card.typeName && c.traits.join(', ') === card.traits!.join(', '));
    const matches3 = allCards.filter(c => c.traits && c.class.join('/') === card.class.join('/') && c.typeName === card.typeName && c.traits.join(', ') === card.traits!.join(', '));
    let chosenSig = '';
    if (matches1.length === 1) chosenSig = sig1;
    else if (matches2.length === 1) chosenSig = sig2;
    else if (matches3.length === 1) chosenSig = sig3;

    if (chosenSig) {
      // Found a unique card!
      // Generate multiple choice options (card names)
      const optionsSet = new Set<string>();
      optionsSet.add(card.id);

      // Find cards sharing at least 1 trait
      const sharingTraits = allCards.filter(c => 
        c.id !== card.id && 
        c.name !== card.name &&
        c.traits && 
        card.traits!.some((t: string) => c.traits!.includes(t))
      );

      const shuffledSharing = shuffle(sharingTraits);
      for (const opt of shuffledSharing) {
        if (optionsSet.size >= 4) break;
        optionsSet.add(opt.id);
      }

      // If not enough, find same type_code
      if (optionsSet.size < 4) {
        const sameType = allCards.filter(c => c.id !== card.id && c.name !== card.name && c.typeName === card.typeName);
        const shuffledSameType = shuffle(sameType);
        for (const opt of shuffledSameType) {
          if (optionsSet.size >= 4) break;
          optionsSet.add(opt.id);
        }
      }
      
      // If STILL not enough, random cards
      if (optionsSet.size < 4) {
        const remaining = shuffle(allCards.filter(c => c.name !== card.name));
        for (const opt of remaining) {
          if (optionsSet.size >= 4) break;
          optionsSet.add(opt.id);
        }
      }

      return {
        mode: 'Which Card',
        questionText: `Which is the only card that got this traits: ${chosenSig}?`,
        correctAnswer: card.id,
        correctCardDisplay: `${card.name} (${card.pack_name})`,
        options: shuffle(Array.from(optionsSet)),
        matchingCards: [card]
      };
    }
  }

  // Fallback
  const fallbackCard = shuffledPool[0] || allCards[0];
  return {
    mode: 'Which Card',
    questionText: `Which card is this?`,
    correctAnswer: fallbackCard.id,
    correctCardDisplay: `${fallbackCard.name} (${fallbackCard.pack_name})`,
    options: [fallbackCard.id, allCards[1]?.id, allCards[2]?.id, allCards[3]?.id].filter(Boolean) as string[],
    matchingCards: [fallbackCard]
  };
}

export function generateTriviaQuestion(
  pool: TransformedCard[],
  allCards: TransformedCard[],
  packName: string,
  questionType: 'Mixed' | 'Only How Many' | 'Only Which Card'
): TriviaQuestion | null {
  if (pool.length === 0) return null;

  let useHowMany = Math.random() > 0.5;
  if (questionType === 'Only How Many') useHowMany = true;
  if (questionType === 'Only Which Card') useHowMany = false;

  if (useHowMany) {
    return generateHowManyQuestion(pool, packName);
  } else {
    return generateWhichCardQuestion(pool, allCards);
  }
}
