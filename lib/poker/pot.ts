import { GameState, HandEvaluation, Player, WinnerResult } from '@/types/poker';

/**
 * Posts the small blind and big blind according to official Heads-Up rules.
 * In Heads-Up:
 * - Dealer (dealerIndex) posts the Small Blind.
 * - Non-dealer posts the Big Blind.
 */
export function postBlinds(state: GameState): GameState {
  const dealerIdx = state.dealerIndex;
  const nonDealerIdx = 1 - dealerIdx;

  const players: [Player, Player] = [
    { ...state.players[0] },
    { ...state.players[1] },
  ];

  const dealer = players[dealerIdx];
  const nonDealer = players[nonDealerIdx];

  // Post Small Blind
  const sbAmount = Math.min(dealer.chips, state.smallBlind);
  dealer.chips -= sbAmount;
  dealer.currentBet = sbAmount;
  if (dealer.chips === 0) {
    dealer.isAllIn = true;
  }

  // Post Big Blind
  const bbAmount = Math.min(nonDealer.chips, state.bigBlind);
  nonDealer.chips -= bbAmount;
  nonDealer.currentBet = bbAmount;
  if (nonDealer.chips === 0) {
    nonDealer.isAllIn = true;
  }

  const pot = state.pot + sbAmount + bbAmount;
  const currentBet = Math.max(dealer.currentBet, nonDealer.currentBet);
  const minRaise = state.bigBlind;

  return {
    ...state,
    players,
    pot,
    currentBet,
    minRaise,
  };
}

/**
 * Distributes the pot at the end of a hand or on a fold.
 * Handles single winner, split pots, and fold wins.
 */
export function distributePot(
  state: GameState,
  evaluations?: Record<string, HandEvaluation>
): GameState {
  const players: [Player, Player] = [
    { ...state.players[0] },
    { ...state.players[1] },
  ];
  const p0 = players[0];
  const p1 = players[1];

  let winners: WinnerResult[] = [];

  // Case 1: Player 0 folded
  if (p0.isFolded) {
    p1.chips += state.pot;
    winners = [
      {
        playerId: p1.id,
        amount: state.pot,
        description: `${p1.name} wins ${state.pot} chips (${p0.name} folded)`,
      },
    ];
    return {
      ...state,
      players,
      pot: 0,
      winners,
      stage: 'ended',
    };
  }

  // Case 2: Player 1 folded
  if (p1.isFolded) {
    p0.chips += state.pot;
    winners = [
      {
        playerId: p0.id,
        amount: state.pot,
        description: `${p0.name} wins ${state.pot} chips (${p1.name} folded)`,
      },
    ];
    return {
      ...state,
      players,
      pot: 0,
      winners,
      stage: 'ended',
    };
  }

  // Case 3: Showdown evaluation
  if (!evaluations) {
    throw new Error('Showdown distribution requires hand evaluations for active players.');
  }

  const eval0 = evaluations[p0.id];
  const eval1 = evaluations[p1.id];

  if (!eval0 || !eval1) {
    throw new Error('Missing hand evaluation for one of the active players.');
  }

  if (eval0.score > eval1.score) {
    // Player 0 wins
    p0.chips += state.pot;
    winners = [
      {
        playerId: p0.id,
        amount: state.pot,
        description: `${p0.name} wins with ${eval0.description}`,
        bestFiveCards: eval0.bestFiveCards,
      },
    ];
  } else if (eval1.score > eval0.score) {
    // Player 1 wins
    p1.chips += state.pot;
    winners = [
      {
        playerId: p1.id,
        amount: state.pot,
        description: `${p1.name} wins with ${eval1.description}`,
        bestFiveCards: eval1.bestFiveCards,
      },
    ];
  } else {
    // Tie / Split pot
    const halfPot = Math.floor(state.pot / 2);
    const oddChip = state.pot % 2;

    p0.chips += halfPot;
    p1.chips += halfPot;

    // Odd chip in split pot goes to out-of-position player (non-dealer in HU)
    if (oddChip > 0) {
      const nonDealerIdx = 1 - state.dealerIndex;
      players[nonDealerIdx].chips += oddChip;
    }

    winners = [
      {
        playerId: p0.id,
        amount: halfPot,
        description: `Split Pot: ${eval0.description}`,
        bestFiveCards: eval0.bestFiveCards,
      },
      {
        playerId: p1.id,
        amount: halfPot + (oddChip > 0 && state.dealerIndex === 0 ? oddChip : 0),
        description: `Split Pot: ${eval1.description}`,
        bestFiveCards: eval1.bestFiveCards,
      },
    ];
  }

  return {
    ...state,
    players,
    pot: 0,
    winners,
    stage: 'ended',
  };
}
