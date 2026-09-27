import { describe, expect, it } from 'vitest';
import { Card } from '@/types/poker';
import { evaluate5Cards, evaluateHand } from '@/lib/poker/evaluator';

describe('Texas Holdem Hand Evaluator', () => {
  // Helper to parse shorthand cards like "As", "Kh", "Td", "2c"
  const parse = (cardsStr: string): Card[] =>
    cardsStr.split(' ').map((s) => ({
      rank: s[0] as Card['rank'],
      suit: s[1] as Card['suit'],
    }));

  describe('Hand Categories', () => {
    it('evaluates High Card', () => {
      const hand = parse('As Kd Th 8c 4d');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('high_card');
      expect(res.description).toContain('High Card, Ace');
    });

    it('evaluates One Pair', () => {
      const hand = parse('Ks Kh Td 8c 4d');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('pair');
      expect(res.description).toContain('Pair of Kings');
    });

    it('evaluates Two Pair', () => {
      const hand = parse('As Ah Ks Kh 4d');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('two_pair');
      expect(res.description).toContain('Two Pair, Aces and Kings');
    });

    it('evaluates Three of a Kind', () => {
      const hand = parse('Qs Qh Qc 8s 4d');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('three_of_a_kind');
      expect(res.description).toContain('Three of a Kind, Queens');
    });

    it('evaluates Straight', () => {
      const hand = parse('9s 8h 7d 6c 5s');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('straight');
      expect(res.description).toContain('Straight, 9 High');
    });

    it('evaluates Wheel Straight (A-2-3-4-5) as 5-High Straight', () => {
      const hand = parse('As 5h 4d 3c 2s');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('straight');
      expect(res.description).toContain('Straight, 5 High');
    });

    it('evaluates Flush', () => {
      const hand = parse('As Js 8s 6s 2s');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('flush');
      expect(res.description).toContain('Flush, Ace High');
    });

    it('evaluates Full House', () => {
      const hand = parse('Js Jh Jd 4c 4s');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('full_house');
      expect(res.description).toContain('Full House, Jacks full of Fours');
    });

    it('evaluates Four of a Kind', () => {
      const hand = parse('9s 9h 9d 9c As');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('four_of_a_kind');
      expect(res.description).toContain('Four of a Kind, Nines');
    });

    it('evaluates Straight Flush', () => {
      const hand = parse('9h 8h 7h 6h 5h');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('straight_flush');
      expect(res.description).toContain('Straight Flush, 9 High');
    });

    it('evaluates Royal Flush', () => {
      const hand = parse('As Ks Qs Js Ts');
      const res = evaluate5Cards(hand);
      expect(res.rankType).toBe('royal_flush');
      expect(res.description).toBe('Royal Flush');
    });
  });

  describe('Rank Hierarchy & Relative Scoring', () => {
    it('strictly orders hand categories', () => {
      const highCard = evaluate5Cards(parse('As Kd Jh 8c 4s')).score;
      const pair = evaluate5Cards(parse('2s 2h 5d 8c 9s')).score;
      const twoPair = evaluate5Cards(parse('3s 3h 4d 4c 2s')).score;
      const trips = evaluate5Cards(parse('2s 2h 2d 8c 9s')).score;
      const straight = evaluate5Cards(parse('6s 5h 4d 3c 2s')).score;
      const flush = evaluate5Cards(parse('7s 5s 4s 3s 2s')).score;
      const fullHouse = evaluate5Cards(parse('2s 2h 2d 3c 3s')).score;
      const quads = evaluate5Cards(parse('2s 2h 2d 2c 3s')).score;
      const straightFlush = evaluate5Cards(parse('6h 5h 4h 3h 2h')).score;
      const royalFlush = evaluate5Cards(parse('As Ks Qs Js Ts')).score;

      expect(royalFlush).toBeGreaterThan(straightFlush);
      expect(straightFlush).toBeGreaterThan(quads);
      expect(quads).toBeGreaterThan(fullHouse);
      expect(fullHouse).toBeGreaterThan(flush);
      expect(flush).toBeGreaterThan(straight);
      expect(straight).toBeGreaterThan(trips);
      expect(trips).toBeGreaterThan(twoPair);
      expect(twoPair).toBeGreaterThan(pair);
      expect(pair).toBeGreaterThan(highCard);
    });
  });

  describe('Kicker Tiebreakers & Edge Cases', () => {
    it('breaks pair tie using kickers', () => {
      const pairAceKicker = evaluate5Cards(parse('As Ah Ks Qd 2c'));
      const pairQueenKicker = evaluate5Cards(parse('As Ah Qs Jd 2c'));
      expect(pairAceKicker.score).toBeGreaterThan(pairQueenKicker.score);
    });

    it('breaks high card tie on 5th card kicker', () => {
      const handA = evaluate5Cards(parse('As Kd Jh 8c 5s'));
      const handB = evaluate5Cards(parse('As Kd Jh 8c 4s'));
      expect(handA.score).toBeGreaterThan(handB.score);
    });

    it('scores wheel straight (A-2-3-4-5) lower than 6-high straight (2-3-4-5-6)', () => {
      const wheel = evaluate5Cards(parse('As 5h 4d 3c 2s'));
      const sixHigh = evaluate5Cards(parse('6s 5d 4c 3h 2d'));
      expect(sixHigh.score).toBeGreaterThan(wheel.score);
    });

    it('prioritizes trips over pair in full house comparison', () => {
      // 8s full of 4s beats 7s full of Aces
      const eightsFull = evaluate5Cards(parse('8s 8h 8d 4c 4s'));
      const sevensFull = evaluate5Cards(parse('7s 7h 7d As Ah'));
      expect(eightsFull.score).toBeGreaterThan(sevensFull.score);
    });

    it('correctly evaluates identical hands to equal scores (split pot)', () => {
      const handA = evaluate5Cards(parse('As Kd Jh 8c 4s'));
      const handB = evaluate5Cards(parse('Ah Kc Jd 8s 4c'));
      expect(handA.score).toEqual(handB.score);
    });
  });

  describe('7-Card Evaluation (Best 5 Selection)', () => {
    it('picks the best 5 cards from 7 cards', () => {
      // Community: Kh Qs Jd 4c 2s
      // Player hole cards: As Ts (makes broadway straight!)
      const cards7 = parse('As Ts Kh Qs Jd 4c 2s');
      const res = evaluateHand(cards7);
      expect(res.rankType).toBe('straight');
      expect(res.description).toContain('Straight, Ace High');
    });

    it('recognizes hidden flush when only 2 hole cards are suited with 3 board cards', () => {
      // 5 hearts total among 7 cards
      const cards7 = parse('Ah 9h Kh 4h 2h 8s Jc');
      const res = evaluateHand(cards7);
      expect(res.rankType).toBe('flush');
      expect(res.description).toContain('Flush, Ace High');
    });
  });
});
