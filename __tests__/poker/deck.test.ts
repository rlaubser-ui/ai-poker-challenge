import { describe, expect, it } from 'vitest';
import { createDeck, dealCards, shuffleDeck } from '@/lib/poker/deck';

describe('Deck operations', () => {
  it('creates a standard 52-card deck with 4 suits and 13 ranks', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);

    const suits = new Set(deck.map((c) => c.suit));
    const ranks = new Set(deck.map((c) => c.rank));

    expect(suits.size).toBe(4);
    expect(ranks.size).toBe(13);
  });

  it('shuffles the deck without mutating original array', () => {
    const original = createDeck();
    const shuffled = shuffleDeck(original);

    expect(shuffled).toHaveLength(52);
    expect(shuffled).not.toBe(original);
    // Elements should still all exist
    expect(new Set(shuffled.map((c) => `${c.rank}${c.suit}`)).size).toBe(52);
  });

  it('supports deterministic PRNG for reproducible shuffle', () => {
    const deck1 = createDeck();
    const deck2 = createDeck();

    let seed = 42;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    let seed2 = 42;
    const rng2 = () => {
      seed2 = (seed2 * 9301 + 49297) % 233280;
      return seed2 / 233280;
    };

    const shuffled1 = shuffleDeck(deck1, rng);
    const shuffled2 = shuffleDeck(deck2, rng2);

    expect(shuffled1).toEqual(shuffled2);
  });

  it('deals cards correctly and leaves remaining deck', () => {
    const deck = createDeck();
    const { dealt, remaining } = dealCards(deck, 5);

    expect(dealt).toHaveLength(5);
    expect(remaining).toHaveLength(47);
    expect(dealt).toEqual(deck.slice(0, 5));
    expect(remaining).toEqual(deck.slice(5));
  });

  it('throws error when requesting more cards than available', () => {
    const deck = createDeck().slice(0, 2);
    expect(() => dealCards(deck, 3)).toThrowError();
  });
});
