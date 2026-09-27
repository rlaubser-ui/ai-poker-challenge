import { describe, expect, it } from 'vitest';
import { Player } from '@/types/poker';
import {
  applyAction,
  createInitialGameState,
  getValidActions,
} from '@/lib/poker/engine';

describe('Poker Engine State Reducer', () => {
  const createTestPlayers = (): [Player, Player] => [
    {
      id: 'p1',
      name: 'Hero',
      chips: 1000,
      currentBet: 0,
      holeCards: [],
      isFolded: false,
      isAllIn: false,
      isAI: false,
    },
    {
      id: 'p2',
      name: 'Claude',
      chips: 1000,
      currentBet: 0,
      holeCards: [],
      isFolded: false,
      isAllIn: false,
      isAI: true,
    },
  ];

  it('initializes preflop with blinds and sets dealer as active player', () => {
    const players = createTestPlayers();
    const state = createInitialGameState({
      players,
      dealerIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
    });

    expect(state.stage).toBe('preflop');
    expect(state.pot).toBe(30); // 10 (SB) + 20 (BB)
    expect(state.players[0].chips).toBe(990);
    expect(state.players[0].currentBet).toBe(10);
    expect(state.players[1].chips).toBe(980);
    expect(state.players[1].currentBet).toBe(20);

    // In heads-up preflop, Dealer (Button) acts first
    expect(state.activePlayerIndex).toBe(0);

    // Both players should have 2 hole cards
    expect(state.players[0].holeCards).toHaveLength(2);
    expect(state.players[1].holeCards).toHaveLength(2);
    expect(state.communityCards).toHaveLength(0);
  });

  it('allows folding preflop, immediately ending hand and awarding pot', () => {
    const players = createTestPlayers();
    const state = createInitialGameState({
      players,
      dealerIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
    });

    // Dealer folds
    const nextState = applyAction(state, { type: 'fold' });

    expect(nextState.stage).toBe('ended');
    expect(nextState.pot).toBe(0);
    expect(nextState.winners).toBeDefined();
    expect(nextState.winners![0].playerId).toBe('p2');
    expect(nextState.winners![0].amount).toBe(30);
    expect(nextState.players[1].chips).toBe(1010); // 980 + 30
  });

  it('progresses from preflop to flop when dealer calls and big blind checks', () => {
    const players = createTestPlayers();
    const state = createInitialGameState({
      players,
      dealerIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
    });

    // 1. Dealer calls 10 (to match BB of 20)
    const valid0 = getValidActions(state);
    expect(valid0.canCall).toBe(true);
    expect(valid0.callAmount).toBe(10);

    const state1 = applyAction(state, { type: 'call' });
    expect(state1.pot).toBe(40);
    expect(state1.players[0].chips).toBe(980);
    expect(state1.activePlayerIndex).toBe(1); // BB turn

    // 2. Big Blind checks
    const valid1 = getValidActions(state1);
    expect(valid1.canCheck).toBe(true);

    const state2 = applyAction(state1, { type: 'check' });

    // Round should now advance to Flop!
    expect(state2.stage).toBe('flop');
    expect(state2.communityCards).toHaveLength(3);
    expect(state2.pot).toBe(40);
    expect(state2.players[0].currentBet).toBe(0);
    expect(state2.players[1].currentBet).toBe(0);

    // On flop, non-dealer acts first in Heads-Up!
    expect(state2.activePlayerIndex).toBe(1);
  });

  it('advances through flop, turn, river and resolves showdown on continuous checks', () => {
    const players = createTestPlayers();
    let state = createInitialGameState({
      players,
      dealerIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
    });

    // Preflop: P0 calls, P1 checks -> Flop
    state = applyAction(state, { type: 'call' });
    state = applyAction(state, { type: 'check' });
    expect(state.stage).toBe('flop');
    expect(state.communityCards).toHaveLength(3);

    // Flop: P1 checks, P0 checks -> Turn
    state = applyAction(state, { type: 'check' });
    state = applyAction(state, { type: 'check' });
    expect(state.stage).toBe('turn');
    expect(state.communityCards).toHaveLength(4);

    // Turn: P1 checks, P0 checks -> River
    state = applyAction(state, { type: 'check' });
    state = applyAction(state, { type: 'check' });
    expect(state.stage).toBe('river');
    expect(state.communityCards).toHaveLength(5);

    // River: P1 checks, P0 checks -> Showdown / Ended
    state = applyAction(state, { type: 'check' });
    state = applyAction(state, { type: 'check' });

    expect(state.stage).toBe('ended');
    expect(state.pot).toBe(0);
    expect(state.winners).toBeDefined();
    expect(state.winners!.length).toBeGreaterThan(0);
    // Chip sum must still equal total initial chips (2000)
    expect(state.players[0].chips + state.players[1].chips).toBe(2000);
  });

  it('handles raise and re-raise correctly', () => {
    const players = createTestPlayers();
    let state = createInitialGameState({
      players,
      dealerIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
    });

    // Dealer raises to 60
    const valid0 = getValidActions(state);
    expect(valid0.canRaise).toBe(true);
    expect(valid0.minRaiseAmount).toBe(40); // 20 BB + 20 min raise

    state = applyAction(state, { type: 'raise', amount: 60 });
    expect(state.pot).toBe(80); // 60 from P0 + 20 from P1
    expect(state.currentBet).toBe(60);
    expect(state.activePlayerIndex).toBe(1);

    // Opponent re-raises to 180
    const valid1 = getValidActions(state);
    expect(valid1.canRaise).toBe(true);
    expect(valid1.minRaiseAmount).toBe(100); // 60 + 40 min raise
    state = applyAction(state, { type: 'raise', amount: 180 });

    expect(state.currentBet).toBe(180);
    expect(state.pot).toBe(240); // 60 + 180
    expect(state.activePlayerIndex).toBe(0);

    // Dealer calls 180
    state = applyAction(state, { type: 'call' });
    // Round concludes and moves to Flop!
    expect(state.stage).toBe('flop');
    expect(state.pot).toBe(360); // 180 + 180
  });

  it('runs out board to showdown automatically when all-in is called', () => {
    const players = createTestPlayers();
    let state = createInitialGameState({
      players,
      dealerIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
    });

    // Dealer goes all-in for 1000
    state = applyAction(state, { type: 'raise', amount: 1000 });
    expect(state.players[0].isAllIn).toBe(true);

    // Opponent calls all-in
    state = applyAction(state, { type: 'call' });
    expect(state.players[1].isAllIn).toBe(true);

    // Engine should have automatically dealt all 5 community cards and reached showdown!
    expect(state.stage).toBe('ended');
    expect(state.communityCards).toHaveLength(5);
    expect(state.winners).toBeDefined();
    expect(state.players[0].chips + state.players[1].chips).toBe(2000);
  });
});
