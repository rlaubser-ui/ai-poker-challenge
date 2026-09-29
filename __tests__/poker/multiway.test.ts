import { describe, expect, it } from 'vitest';
import { Player } from '@/types/poker';
import {
  applyAction,
  createInitialGameState,
  getValidActions,
} from '@/lib/poker/engine';
import { calculatePots, distributePot } from '@/lib/poker/pot';

describe('Multi-Way Poker Engine (7-Max Table)', () => {
  const create7Players = (): Player[] => [
    { id: 'p0', name: 'Hero', chips: 1000, currentBet: 0, holeCards: [], isFolded: false, isAllIn: false, isAI: false },
    { id: 'p1', name: 'Viktor "The Shark"', chips: 1000, currentBet: 0, holeCards: [], isFolded: false, isAllIn: false, isAI: true },
    { id: 'p2', name: 'Rex "Bulldozer"', chips: 1000, currentBet: 0, holeCards: [], isFolded: false, isAllIn: false, isAI: true },
    { id: 'p3', name: 'Larry "Lucky"', chips: 1000, currentBet: 0, holeCards: [], isFolded: false, isAllIn: false, isAI: true },
    { id: 'p4', name: 'Pete "Old School"', chips: 1000, currentBet: 0, holeCards: [], isFolded: false, isAllIn: false, isAI: true },
    { id: 'p5', name: 'Sophia "GTO Solver"', chips: 1000, currentBet: 0, holeCards: [], isFolded: false, isAllIn: false, isAI: true },
    { id: 'p6', name: 'Vince "Vegas"', chips: 1000, currentBet: 0, holeCards: [], isFolded: false, isAllIn: false, isAI: true },
  ];

  it('initializes 7-max table with dealer at 0, SB at 1, BB at 2, and UTG (3) acting first preflop', () => {
    const players = create7Players();
    const state = createInitialGameState({
      players,
      dealerIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
    });

    expect(state.players).toHaveLength(7);
    expect(state.dealerIndex).toBe(0);
    // Small Blind is Seat 1
    expect(state.players[1].chips).toBe(990);
    expect(state.players[1].currentBet).toBe(10);
    // Big Blind is Seat 2
    expect(state.players[2].chips).toBe(980);
    expect(state.players[2].currentBet).toBe(20);
    // Total pot is SB (10) + BB (20) = 30
    expect(state.pot).toBe(30);

    // In 7-max preflop, Under The Gun (Seat 3) must act first!
    expect(state.activePlayerIndex).toBe(3);

    // Each active player was dealt 2 cards
    for (const p of state.players) {
      expect(p.holeCards).toHaveLength(2);
    }
  });

  it('rotates action clockwise around the table and advances to flop when all players call/fold', () => {
    const players = create7Players();
    let state = createInitialGameState({
      players,
      dealerIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
    });

    // Seat 3 (UTG) calls 20
    expect(state.activePlayerIndex).toBe(3);
    state = applyAction(state, { type: 'call' });

    // Seat 4 folds
    expect(state.activePlayerIndex).toBe(4);
    state = applyAction(state, { type: 'fold' });

    // Seat 5 calls 20
    expect(state.activePlayerIndex).toBe(5);
    state = applyAction(state, { type: 'call' });

    // Seat 6 folds
    expect(state.activePlayerIndex).toBe(6);
    state = applyAction(state, { type: 'fold' });

    // Seat 0 (Dealer / Hero) calls 20
    expect(state.activePlayerIndex).toBe(0);
    state = applyAction(state, { type: 'call' });

    // Seat 1 (SB) calls 10 more (to match 20)
    expect(state.activePlayerIndex).toBe(1);
    state = applyAction(state, { type: 'call' });

    // Seat 2 (BB) checks (already has 20 in)
    expect(state.activePlayerIndex).toBe(2);
    state = applyAction(state, { type: 'check' });

    // Preflop betting complete -> should advance to flop!
    expect(state.stage).toBe('flop');
    expect(state.communityCards).toHaveLength(3);
    // 5 players put in 20 = 100 chips in pot
    expect(state.pot).toBe(100);

    // On flop, first active player to the left of Button (Seat 0) acts first!
    // Seat 1 (SB) is active, so Seat 1 acts first!
    expect(state.activePlayerIndex).toBe(1);
  });

  it('accurately calculates main and side pots for multiple all-in stack sizes', () => {
    // Player A has 100 chips (all-in)
    // Player B has 300 chips (all-in)
    // Player C has 500 chips (calls 300)
    const testPlayers: Player[] = [
      { id: 'pA', name: 'Shorty', chips: 0, currentBet: 100, totalInvestedThisHand: 100, holeCards: [], isFolded: false, isAllIn: true, isAI: true },
      { id: 'pB', name: 'Middling', chips: 0, currentBet: 300, totalInvestedThisHand: 300, holeCards: [], isFolded: false, isAllIn: true, isAI: true },
      { id: 'pC', name: 'BigStack', chips: 200, currentBet: 300, totalInvestedThisHand: 300, holeCards: [], isFolded: false, isAllIn: false, isAI: false },
    ];

    const pots = calculatePots(testPlayers);

    // Level 1: 100 chips from all 3 = 300 chips (pA, pB, pC eligible)
    // Level 2: 200 additional chips from pB and pC = 400 chips (pB, pC eligible)
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligiblePlayerIds).toEqual(['pA', 'pB', 'pC']);

    expect(pots[1].amount).toBe(400);
    expect(pots[1].eligiblePlayerIds).toEqual(['pB', 'pC']);
  });

  it('correctly distributes side pot to side winner and main pot to main winner', () => {
    // pA has Royal Flush with 100 chips
    // pB has Pair of Aces with 300 chips
    // pC has King High with 300 chips
    const testPlayers: Player[] = [
      { id: 'pA', name: 'Shorty', chips: 0, currentBet: 100, totalInvestedThisHand: 100, holeCards: [], isFolded: false, isAllIn: true, isAI: true },
      { id: 'pB', name: 'Middling', chips: 0, currentBet: 300, totalInvestedThisHand: 300, holeCards: [], isFolded: false, isAllIn: true, isAI: true },
      { id: 'pC', name: 'BigStack', chips: 200, currentBet: 300, totalInvestedThisHand: 300, holeCards: [], isFolded: false, isAllIn: false, isAI: false },
    ];

    const state = {
      handId: 'test_side_pot',
      stage: 'showdown' as const,
      communityCards: [],
      pot: 700,
      sidePots: calculatePots(testPlayers),
      currentBet: 0,
      minRaise: 20,
      dealerIndex: 0,
      activePlayerIndex: 0,
      players: testPlayers,
      deck: [],
      handHistory: [],
      smallBlind: 10,
      bigBlind: 20,
    };

    const evaluations = {
      pA: { rankType: 'royal_flush' as const, score: 9999, description: 'Royal Flush', bestFiveCards: [] },
      pB: { rankType: 'pair' as const, score: 2000, description: 'Pair of Aces', bestFiveCards: [] },
      pC: { rankType: 'high_card' as const, score: 1000, description: 'King High', bestFiveCards: [] },
    };

    const finalState = distributePot(state, evaluations);

    // pA should win Main Pot (300 chips)
    // pB should win Side Pot (400 chips)
    const pA = finalState.players.find((p) => p.id === 'pA')!;
    const pB = finalState.players.find((p) => p.id === 'pB')!;
    const pC = finalState.players.find((p) => p.id === 'pC')!;

    expect(pA.chips).toBe(300);
    expect(pB.chips).toBe(400);
    expect(pC.chips).toBe(200); // Remaining original chips
    expect(finalState.winners).toHaveLength(2);
  });
});
