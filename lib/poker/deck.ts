import { Card, Rank, Suit } from '@/types/poker';

export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];
export const RANKS: Rank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'T',
  'J',
  'Q',
  'K',
  'A',
];

/**
 * Creates a standard 52-card deck in order.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle returning a newly shuffled deck.
 * Pure function: Does not mutate the input deck.
 * Accepts an optional rng function (e.g. for deterministic unit testing).
 */
export function shuffleDeck(
  deck: Card[],
  rng: () => number = Math.random
): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

/**
 * Deals `count` cards from the front of the deck.
 * Returns the dealt cards and the remaining deck immutably.
 */
export function dealCards(
  deck: Card[],
  count: number
): { dealt: Card[]; remaining: Card[] } {
  if (count > deck.length) {
    throw new Error(
      `Cannot deal ${count} cards from a deck with only ${deck.length} cards remaining.`
    );
  }
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}
