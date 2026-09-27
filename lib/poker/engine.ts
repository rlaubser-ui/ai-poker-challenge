import {
  ActionRecord,
  Card,
  GameStage,
  GameState,
  HandEvaluation,
  Player,
  PlayerAction,
  ValidActions,
} from '@/types/poker';
import { createDeck, dealCards, shuffleDeck } from './deck';
import { evaluateHand } from './evaluator';
import { distributePot, postBlinds } from './pot';

export interface StartHandOptions {
  players: [Player, Player];
  dealerIndex?: number;
  smallBlind?: number;
  bigBlind?: number;
  rng?: () => number;
}

/**
 * Initializes a new Heads-Up Texas Hold'em hand.
 * Deals 2 hole cards to each player and posts blinds.
 * Preflop: Dealer (dealerIndex) acts first in Heads-Up.
 */
export function createInitialGameState(options: StartHandOptions): GameState {
  const {
    players: initialPlayers,
    dealerIndex = 0,
    smallBlind = 10,
    bigBlind = 20,
    rng = Math.random,
  } = options;

  let deck = shuffleDeck(createDeck(), rng);

  // Deal 2 cards to each player immutably
  const p0Deal = dealCards(deck, 2);
  deck = p0Deal.remaining;

  const p1Deal = dealCards(deck, 2);
  deck = p1Deal.remaining;

  const players: [Player, Player] = [
    {
      ...initialPlayers[0],
      holeCards: p0Deal.dealt,
      currentBet: 0,
      isFolded: false,
      isAllIn: false,
    },
    {
      ...initialPlayers[1],
      holeCards: p1Deal.dealt,
      currentBet: 0,
      isFolded: false,
      isAllIn: false,
    },
  ];

  const baseState: GameState = {
    handId: `hand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    stage: 'preflop',
    communityCards: [],
    pot: 0,
    currentBet: 0,
    minRaise: bigBlind,
    dealerIndex,
    // In Heads-Up preflop, Dealer (Button) acts first!
    activePlayerIndex: dealerIndex,
    players,
    deck,
    handHistory: [],
    smallBlind,
    bigBlind,
  };

  return postBlinds(baseState);
}

/**
 * Calculates valid actions and bet limits for the active player.
 */
export function getValidActions(state: GameState): ValidActions {
  if (state.stage === 'ended' || state.stage === 'showdown') {
    return {
      canFold: false,
      canCheck: false,
      canCall: false,
      callAmount: 0,
      canRaise: false,
      minRaiseAmount: 0,
      maxRaiseAmount: 0,
    };
  }

  const activePlayer = state.players[state.activePlayerIndex];
  const callAmount = state.currentBet - activePlayer.currentBet;
  const canCheck = callAmount === 0;
  const canCall = callAmount > 0 && activePlayer.chips > 0;
  const actualCallAmount = Math.min(callAmount, activePlayer.chips);

  // Raising rules
  // Player must have more chips than the amount needed to call
  const canRaise =
    activePlayer.chips > actualCallAmount &&
    !state.players[0].isAllIn &&
    !state.players[1].isAllIn;

  // Minimum raise: currentBet + minRaise, capped by player's total stack
  const totalChips = activePlayer.chips + activePlayer.currentBet;
  const standardMinRaise = state.currentBet + state.minRaise;
  const minRaiseAmount = Math.min(standardMinRaise, totalChips);
  const maxRaiseAmount = totalChips;

  return {
    canFold: true,
    canCheck,
    canCall,
    callAmount: actualCallAmount,
    canRaise,
    minRaiseAmount,
    maxRaiseAmount,
  };
}

/**
 * Checks if the current betting round has concluded.
 * A round concludes when:
 * 1. Both players have acted on this street at least once, AND
 * 2. Their currentBets match, OR one is all-in with bets matched up to their stack.
 */
function isRoundComplete(
  state: GameState,
  actionsThisStreet: ActionRecord[]
): boolean {
  const p0 = state.players[0];
  const p1 = state.players[1];

  if (p0.isFolded || p1.isFolded) {
    return true;
  }

  // Both must have acted at least once on this street
  const p0Acted = actionsThisStreet.some((a) => a.playerId === p0.id);
  const p1Acted = actionsThisStreet.some((a) => a.playerId === p1.id);

  if (!p0Acted || !p1Acted) {
    return false;
  }

  // Bets must match, or a player is all in
  if (p0.isAllIn || p1.isAllIn) {
    return p0.currentBet === p1.currentBet || p0.isAllIn || p1.isAllIn;
  }

  return p0.currentBet === p1.currentBet;
}

/**
 * Advances the game stage to the next street (or showdown).
 * Deals community cards (burns 1, deals cards) and resets street bets.
 */
export function advanceStreet(state: GameState): GameState {
  let deck = state.deck;
  let communityCards = [...state.communityCards];
  let nextStage: GameStage;

  if (state.stage === 'preflop') {
    nextStage = 'flop';
    // Flop: Burn 1, deal 3
    const burn = dealCards(deck, 1);
    const flop = dealCards(burn.remaining, 3);
    deck = flop.remaining;
    communityCards = [...flop.dealt];
  } else if (state.stage === 'flop') {
    nextStage = 'turn';
    // Turn: Burn 1, deal 1
    const burn = dealCards(deck, 1);
    const turn = dealCards(burn.remaining, 1);
    deck = turn.remaining;
    communityCards = [...communityCards, ...turn.dealt];
  } else if (state.stage === 'turn') {
    nextStage = 'river';
    // River: Burn 1, deal 1
    const burn = dealCards(deck, 1);
    const river = dealCards(burn.remaining, 1);
    deck = river.remaining;
    communityCards = [...communityCards, ...river.dealt];
  } else {
    nextStage = 'showdown';
  }

  // Reset bets for new street
  const players: [Player, Player] = [
    { ...state.players[0], currentBet: 0 },
    { ...state.players[1], currentBet: 0 },
  ];

  // In postflop (Flop, Turn, River), Non-dealer acts first!
  const nextActivePlayerIndex = 1 - state.dealerIndex;

  const intermediateState: GameState = {
    ...state,
    stage: nextStage,
    communityCards,
    deck,
    players,
    currentBet: 0,
    minRaise: state.bigBlind,
    activePlayerIndex: nextActivePlayerIndex,
  };

  // If we arrived at showdown, resolve winner
  if (nextStage === 'showdown') {
    return resolveShowdown(intermediateState);
  }

  // If one or both players are all in, automatically deal out remaining streets to showdown
  if (players[0].isAllIn || players[1].isAllIn) {
    return advanceStreet(intermediateState);
  }

  return intermediateState;
}

/**
 * Evaluates both players' hands and distributes the pot.
 */
export function resolveShowdown(state: GameState): GameState {
  const p0 = state.players[0];
  const p1 = state.players[1];

  const eval0 = evaluateHand([...p0.holeCards, ...state.communityCards]);
  const eval1 = evaluateHand([...p1.holeCards, ...state.communityCards]);

  const evaluations: Record<string, HandEvaluation> = {
    [p0.id]: eval0,
    [p1.id]: eval1,
  };

  return distributePot(
    {
      ...state,
      stage: 'showdown',
    },
    evaluations
  );
}

/**
 * Pure state reducer: Applies a player action to the game state.
 * Validates action legality and either switches turn or advances street.
 */
export function applyAction(
  state: GameState,
  action: PlayerAction
): GameState {
  if (state.stage === 'ended' || state.stage === 'showdown') {
    throw new Error(`Cannot apply action '${action.type}' when hand is already ${state.stage}.`);
  }

  const valid = getValidActions(state);
  const activeIdx = state.activePlayerIndex;
  const players: [Player, Player] = [
    { ...state.players[0] },
    { ...state.players[1] },
  ];
  const activePlayer = players[activeIdx];
  const opponent = players[1 - activeIdx];

  let pot = state.pot;
  let currentBet = state.currentBet;
  let minRaise = state.minRaise;

  const actionRecord: ActionRecord = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stage: state.stage,
    playerId: activePlayer.id,
    action,
    potAfter: pot,
    timestamp: Date.now(),
  };

  switch (action.type) {
    case 'fold': {
      if (!valid.canFold) {
        throw new Error('Fold action is not valid in this state.');
      }
      activePlayer.isFolded = true;
      actionRecord.potAfter = pot;

      const foldedState: GameState = {
        ...state,
        players,
        handHistory: [...state.handHistory, actionRecord],
      };
      return distributePot(foldedState);
    }

    case 'check': {
      if (!valid.canCheck) {
        throw new Error('Check action is not allowed when there is an active bet to call.');
      }
      break;
    }

    case 'call': {
      if (!valid.canCall && valid.callAmount > 0) {
        throw new Error('Call action is not valid or player has insufficient chips.');
      }
      const toCall = Math.min(valid.callAmount, activePlayer.chips);
      activePlayer.chips -= toCall;
      activePlayer.currentBet += toCall;
      pot += toCall;
      if (activePlayer.chips === 0) {
        activePlayer.isAllIn = true;
      }
      break;
    }

    case 'raise': {
      if (!valid.canRaise) {
        throw new Error('Raise action is not allowed in this state.');
      }
      const raiseTo = action.amount;
      if (raiseTo === undefined || raiseTo < valid.minRaiseAmount || raiseTo > valid.maxRaiseAmount) {
        throw new Error(
          `Invalid raise amount: ${raiseTo}. Must be between ${valid.minRaiseAmount} and ${valid.maxRaiseAmount}.`
        );
      }
      const addedChips = raiseTo - activePlayer.currentBet;
      activePlayer.chips -= addedChips;
      activePlayer.currentBet = raiseTo;
      pot += addedChips;

      if (activePlayer.chips === 0) {
        activePlayer.isAllIn = true;
      }

      // Update min raise: difference between new bet and previous currentBet
      const raiseDifference = raiseTo - currentBet;
      minRaise = Math.max(state.bigBlind, raiseDifference);
      currentBet = raiseTo;
      break;
    }

    default:
      throw new Error(`Unknown action type: ${(action as PlayerAction).type}`);
  }

  actionRecord.potAfter = pot;
  const updatedHistory = [...state.handHistory, actionRecord];

  const stateAfterAction: GameState = {
    ...state,
    players,
    pot,
    currentBet,
    minRaise,
    handHistory: updatedHistory,
  };

  // Filter actions taken on the current street
  const actionsThisStreet = updatedHistory.filter(
    (a) => a.stage === state.stage
  );

  // Check if round is complete
  if (isRoundComplete(stateAfterAction, actionsThisStreet)) {
    return advanceStreet(stateAfterAction);
  }

  // If round not complete, pass turn to opponent
  return {
    ...stateAfterAction,
    activePlayerIndex: 1 - activeIdx,
  };
}
