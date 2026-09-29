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
import { calculatePots, distributePot, getNextActiveSeat, postBlinds } from './pot';

export interface StartHandOptions {
  players: Player[];
  dealerIndex?: number;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  rng?: () => number;
}

/**
 * Finds the next seated player who is eligible to act (not folded, not eliminated, not all-in).
 */
export function getNextPlayerToAct(
  players: Player[],
  fromIndex: number
): number {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (fromIndex + i) % n;
    const p = players[idx];
    if (!p.isEliminated && !p.isFolded && !p.isAllIn && p.chips > 0) {
      return idx;
    }
  }
  return fromIndex;
}

/**
 * Initializes a new Texas Hold'em hand for 2 to 9 players.
 * Deals 2 hole cards to each active player and posts blinds/antes.
 */
export function createInitialGameState(options: StartHandOptions): GameState {
  const {
    players: initialPlayers,
    dealerIndex = 0,
    smallBlind = 10,
    bigBlind = 20,
    ante = 0,
    rng = Math.random,
  } = options;

  let deck = shuffleDeck(createDeck(), rng);

  // Initialize players and deal 2 cards to each non-eliminated player
  const players: Player[] = initialPlayers.map((p) => {
    const isOutOfChips = p.chips <= 0 || p.isEliminated;
    if (isOutOfChips) {
      return {
        ...p,
        holeCards: [],
        currentBet: 0,
        totalInvestedThisHand: 0,
        totalInvestedThisStreet: 0,
        isFolded: true,
        isAllIn: false,
        isEliminated: true,
        lastAction: undefined,
      };
    }

    const deal = dealCards(deck, 2);
    deck = deal.remaining;

    return {
      ...p,
      holeCards: deal.dealt,
      currentBet: 0,
      totalInvestedThisHand: 0,
      totalInvestedThisStreet: 0,
      isFolded: false,
      isAllIn: false,
      isEliminated: false,
      lastAction: undefined,
    };
  });

  const baseState: GameState = {
    handId: `hand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    stage: 'preflop',
    communityCards: [],
    pot: 0,
    sidePots: [],
    currentBet: 0,
    minRaise: bigBlind,
    dealerIndex,
    activePlayerIndex: dealerIndex,
    players,
    deck,
    handHistory: [],
    smallBlind,
    bigBlind,
    ante,
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
  if (!activePlayer || activePlayer.isFolded || activePlayer.isAllIn || activePlayer.chips === 0) {
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

  const callAmount = state.currentBet - activePlayer.currentBet;
  const canCheck = callAmount === 0;
  const canCall = callAmount > 0 && activePlayer.chips > 0;
  const actualCallAmount = Math.min(callAmount, activePlayer.chips);

  // Can raise if player has more chips than required to call,
  // and there is at least one other non-folded player in the hand.
  const otherActivePlayers = state.players.filter(
    (p, idx) => idx !== state.activePlayerIndex && !p.isFolded && !p.isEliminated
  );

  const canRaise =
    activePlayer.chips > actualCallAmount &&
    otherActivePlayers.length > 0 &&
    otherActivePlayers.some((p) => p.chips > 0 || p.currentBet > 0);

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
 */
function isRoundComplete(
  state: GameState,
  actionsThisStreet: ActionRecord[]
): boolean {
  const activeInHand = state.players.filter(
    (p) => !p.isEliminated && !p.isFolded
  );

  // Hand is over if only 1 player remains unfolded
  if (activeInHand.length <= 1) {
    return true;
  }

  const playersWhoCanAct = activeInHand.filter(
    (p) => !p.isAllIn && p.chips > 0
  );

  // If 0 or 1 players can act and remaining players' bets match the highest bet (or they are all-in)
  if (playersWhoCanAct.length === 0) {
    return true;
  }

  // All players who can act must have acted at least once on this street
  const allActed = playersWhoCanAct.every((p) =>
    actionsThisStreet.some((a) => a.playerId === p.id)
  );

  if (!allActed) {
    return false;
  }

  // All non-folded players must have either matched the currentBet or be all-in
  const betsSettled = activeInHand.every(
    (p) => p.currentBet === state.currentBet || p.isAllIn
  );

  return betsSettled;
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

  // Reset street bets and calculate current side pots
  const players = state.players.map((p) => ({
    ...p,
    currentBet: 0,
    totalInvestedThisStreet: 0,
  }));

  const sidePots = calculatePots(players);

  // In postflop (Flop, Turn, River), the first active player to the left of the button acts first!
  const nextActivePlayerIndex = getNextPlayerToAct(players, state.dealerIndex);

  const intermediateState: GameState = {
    ...state,
    stage: nextStage,
    communityCards,
    deck,
    players,
    sidePots,
    currentBet: 0,
    minRaise: state.bigBlind,
    activePlayerIndex: nextActivePlayerIndex,
  };

  // If we arrived at showdown, resolve winner
  if (nextStage === 'showdown') {
    return resolveShowdown(intermediateState);
  }

  // Check how many players can still act
  const activeUnfolded = players.filter((p) => !p.isFolded && !p.isEliminated);
  const playersWhoCanAct = activeUnfolded.filter((p) => !p.isAllIn && p.chips > 0);

  // If at most 1 player can act and everyone else is all in, auto-run remaining streets to showdown!
  if (playersWhoCanAct.length <= 1 && activeUnfolded.length > 1) {
    return advanceStreet(intermediateState);
  }

  return intermediateState;
}

/**
 * Evaluates all remaining players' hands and distributes the pot.
 */
export function resolveShowdown(state: GameState): GameState {
  const evaluations: Record<string, HandEvaluation> = {};

  for (const player of state.players) {
    if (!player.isFolded && !player.isEliminated && player.holeCards.length === 2) {
      evaluations[player.id] = evaluateHand([
        ...player.holeCards,
        ...state.communityCards,
      ]);
    }
  }

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
 * Validates action legality and either passes turn or advances street.
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
  const players = state.players.map((p) => ({ ...p }));
  const activePlayer = players[activeIdx];

  if (!activePlayer) {
    throw new Error(`Invalid active player at index ${activeIdx}`);
  }

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
      activePlayer.lastAction = { type: 'fold', label: 'FOLD' };
      actionRecord.potAfter = pot;

      const foldedState: GameState = {
        ...state,
        players,
        handHistory: [...state.handHistory, actionRecord],
      };

      // Check if only one player remains unfolded
      const remainingInHand = players.filter((p) => !p.isFolded && !p.isEliminated);
      if (remainingInHand.length === 1) {
        return distributePot(foldedState);
      }
      break;
    }

    case 'check': {
      if (!valid.canCheck) {
        throw new Error('Check action is not allowed when there is an active bet to call.');
      }
      activePlayer.lastAction = { type: 'check', label: 'CHECK' };
      break;
    }

    case 'call': {
      if (!valid.canCall && valid.callAmount > 0) {
        throw new Error('Call action is not valid or player has insufficient chips.');
      }
      const toCall = Math.min(valid.callAmount, activePlayer.chips);
      activePlayer.chips -= toCall;
      activePlayer.currentBet += toCall;
      activePlayer.totalInvestedThisHand = (activePlayer.totalInvestedThisHand || 0) + toCall;
      pot += toCall;

      if (activePlayer.chips === 0) {
        activePlayer.isAllIn = true;
        activePlayer.lastAction = { type: 'call', amount: toCall, label: 'ALL-IN' };
      } else {
        activePlayer.lastAction = { type: 'call', amount: toCall, label: `CALL ${toCall}` };
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
      activePlayer.totalInvestedThisHand = (activePlayer.totalInvestedThisHand || 0) + addedChips;
      pot += addedChips;

      if (activePlayer.chips === 0) {
        activePlayer.isAllIn = true;
        activePlayer.lastAction = { type: 'raise', amount: raiseTo, label: 'ALL-IN' };
      } else {
        activePlayer.lastAction = { type: 'raise', amount: raiseTo, label: `RAISE to ${raiseTo}` };
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
    sidePots: calculatePots(players),
    currentBet,
    minRaise,
    handHistory: updatedHistory,
  };

  // Filter actions taken on current street
  const actionsThisStreet = updatedHistory.filter((a) => a.stage === state.stage);

  // Check if round is complete
  if (isRoundComplete(stateAfterAction, actionsThisStreet)) {
    return advanceStreet(stateAfterAction);
  }

  // If round not complete, pass turn to next player to act
  const nextPlayerIndex = getNextPlayerToAct(players, activeIdx);

  return {
    ...stateAfterAction,
    activePlayerIndex: nextPlayerIndex,
  };
}
