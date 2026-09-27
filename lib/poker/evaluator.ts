import { Card, HandEvaluation, HandRankType, Rank } from '@/types/poker';

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  'T': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

const RANK_NAMES: Record<number, string> = {
  2: 'Deuces',
  3: 'Threes',
  4: 'Fours',
  5: 'Fives',
  6: 'Sixes',
  7: 'Sevens',
  8: 'Eights',
  9: 'Nines',
  10: 'Tens',
  11: 'Jacks',
  12: 'Queens',
  13: 'Kings',
  14: 'Aces',
};

const SINGULAR_RANK_NAMES: Record<number, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
  14: 'Ace',
};

/**
 * Evaluates an exact 5-card hand.
 */
export function evaluate5Cards(cards: Card[]): HandEvaluation {
  if (cards.length !== 5) {
    throw new Error(`evaluate5Cards requires exactly 5 cards, got ${cards.length}`);
  }

  // Count ranks and suits
  const rankCounts: Record<number, number> = {};
  const suitCounts: Record<string, number> = {};
  const cardRanks: number[] = [];

  for (const card of cards) {
    const val = RANK_VALUES[card.rank];
    cardRanks.push(val);
    rankCounts[val] = (rankCounts[val] || 0) + 1;
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  }

  // Sort ranks descending
  cardRanks.sort((a, b) => b - a);

  const isFlush = Object.values(suitCounts).some((count) => count === 5);

  // Check straight: either 5 distinct sequential ranks, or A-2-3-4-5 wheel
  const uniqueRanks = Array.from(new Set(cardRanks)).sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;

  if (uniqueRanks.length === 5) {
    if (uniqueRanks[0] - uniqueRanks[4] === 4) {
      isStraight = true;
      straightHigh = uniqueRanks[0];
    } else if (
      uniqueRanks[0] === 14 &&
      uniqueRanks[1] === 5 &&
      uniqueRanks[2] === 4 &&
      uniqueRanks[3] === 3 &&
      uniqueRanks[4] === 2
    ) {
      // 5-high straight (wheel / Broadway-low)
      isStraight = true;
      straightHigh = 5;
    }
  }

  // Group by frequency: [ [rank, count], ... ] sorted by count desc, then rank desc
  const frequencyGroups = Object.entries(rankCounts)
    .map(([rankStr, count]) => ({ rank: Number(rankStr), count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.rank - a.rank;
    });

  // Base multiplier per category (Base 16 representation)
  // category * 16^5 + c0 * 16^4 + c1 * 16^3 + c2 * 16^2 + c3 * 16 + c4
  const B = 16;
  const B5 = Math.pow(B, 5);
  const B4 = Math.pow(B, 4);
  const B3 = Math.pow(B, 3);
  const B2 = Math.pow(B, 2);
  const B1 = B;

  // 1. Straight Flush / Royal Flush
  if (isFlush && isStraight) {
    const isRoyal = straightHigh === 14;
    const rankType: HandRankType = isRoyal ? 'royal_flush' : 'straight_flush';
    const score = 8 * B5 + straightHigh * B4;
    const description = isRoyal
      ? 'Royal Flush'
      : `Straight Flush, ${SINGULAR_RANK_NAMES[straightHigh]} High`;
    return { rankType, score, description, bestFiveCards: cards };
  }

  // 2. Four of a Kind
  if (frequencyGroups[0].count === 4) {
    const quadRank = frequencyGroups[0].rank;
    const kicker = frequencyGroups[1].rank;
    const score = 7 * B5 + quadRank * B4 + kicker * B3;
    const description = `Four of a Kind, ${RANK_NAMES[quadRank]}`;
    return { rankType: 'four_of_a_kind', score, description, bestFiveCards: cards };
  }

  // 3. Full House
  if (frequencyGroups[0].count === 3 && frequencyGroups[1].count === 2) {
    const tripRank = frequencyGroups[0].rank;
    const pairRank = frequencyGroups[1].rank;
    const score = 6 * B5 + tripRank * B4 + pairRank * B3;
    const description = `Full House, ${RANK_NAMES[tripRank]} full of ${RANK_NAMES[pairRank]}`;
    return { rankType: 'full_house', score, description, bestFiveCards: cards };
  }

  // 4. Flush
  if (isFlush) {
    const score =
      5 * B5 +
      cardRanks[0] * B4 +
      cardRanks[1] * B3 +
      cardRanks[2] * B2 +
      cardRanks[3] * B1 +
      cardRanks[4];
    const description = `Flush, ${SINGULAR_RANK_NAMES[cardRanks[0]]} High`;
    return { rankType: 'flush', score, description, bestFiveCards: cards };
  }

  // 5. Straight
  if (isStraight) {
    const score = 4 * B5 + straightHigh * B4;
    const description = `Straight, ${SINGULAR_RANK_NAMES[straightHigh]} High`;
    return { rankType: 'straight', score, description, bestFiveCards: cards };
  }

  // 6. Three of a Kind
  if (frequencyGroups[0].count === 3) {
    const tripRank = frequencyGroups[0].rank;
    const k1 = frequencyGroups[1].rank;
    const k2 = frequencyGroups[2].rank;
    const score = 3 * B5 + tripRank * B4 + k1 * B3 + k2 * B2;
    const description = `Three of a Kind, ${RANK_NAMES[tripRank]}`;
    return { rankType: 'three_of_a_kind', score, description, bestFiveCards: cards };
  }

  // 7. Two Pair
  if (frequencyGroups[0].count === 2 && frequencyGroups[1].count === 2) {
    const highPair = Math.max(frequencyGroups[0].rank, frequencyGroups[1].rank);
    const lowPair = Math.min(frequencyGroups[0].rank, frequencyGroups[1].rank);
    const kicker = frequencyGroups[2].rank;
    const score = 2 * B5 + highPair * B4 + lowPair * B3 + kicker * B2;
    const description = `Two Pair, ${RANK_NAMES[highPair]} and ${RANK_NAMES[lowPair]}`;
    return { rankType: 'two_pair', score, description, bestFiveCards: cards };
  }

  // 8. One Pair
  if (frequencyGroups[0].count === 2) {
    const pairRank = frequencyGroups[0].rank;
    const k1 = frequencyGroups[1].rank;
    const k2 = frequencyGroups[2].rank;
    const k3 = frequencyGroups[3].rank;
    const score = 1 * B5 + pairRank * B4 + k1 * B3 + k2 * B2 + k3 * B1;
    const description = `Pair of ${RANK_NAMES[pairRank]}`;
    return { rankType: 'pair', score, description, bestFiveCards: cards };
  }

  // 9. High Card
  const score =
    cardRanks[0] * B4 +
    cardRanks[1] * B3 +
    cardRanks[2] * B2 +
    cardRanks[3] * B1 +
    cardRanks[4];
  const description = `High Card, ${SINGULAR_RANK_NAMES[cardRanks[0]]}`;
  return { rankType: 'high_card', score, description, bestFiveCards: cards };
}

/**
 * Generate all combinations of k items from an array.
 */
function getCombinations<T>(array: T[], k: number): T[][] {
  const result: T[][] = [];

  function helper(start: number, combo: T[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }

  helper(0, []);
  return result;
}

/**
 * Evaluates any hand containing between 5 and 7 cards (e.g. hole cards + community cards).
 * Returns the best possible 5-card evaluation with highest score.
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(
      `evaluateHand requires between 5 and 7 cards, received ${cards.length}`
    );
  }

  if (cards.length === 5) {
    return evaluate5Cards(cards);
  }

  const combinations = getCombinations(cards, 5);
  let bestEval: HandEvaluation | null = null;

  for (const combo of combinations) {
    const currentEval = evaluate5Cards(combo);
    if (!bestEval || currentEval.score > bestEval.score) {
      bestEval = currentEval;
    }
  }

  return bestEval!;
}
