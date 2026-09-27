import { AIActionResponse } from '@/types/ai';
import { GameState } from '@/types/poker';
import { getValidActions } from '@/lib/poker/engine';
import { evaluateHand, RANK_VALUES } from '@/lib/poker/evaluator';

/**
 * Intelligent deterministic heuristic solver for offline testing without API keys.
 */
export function executeMockAction(
  state: GameState,
  aiPlayerIndex: number
): AIActionResponse {
  const valid = getValidActions(state);
  const aiPlayer = state.players[aiPlayerIndex];
  const hole = aiPlayer.holeCards;

  // 1. Preflop heuristic
  if (state.stage === 'preflop') {
    const r1 = RANK_VALUES[hole[0]?.rank || '2'];
    const r2 = RANK_VALUES[hole[1]?.rank || '2'];
    const isPocketPair = r1 === r2;
    const isHighCard = r1 >= 12 || r2 >= 12; // Queen or higher

    if ((isPocketPair || (r1 >= 10 && r2 >= 10)) && valid.canRaise) {
      const raiseTo = Math.min(
        state.bigBlind * 3,
        valid.maxRaiseAmount
      );
      if (raiseTo >= valid.minRaiseAmount) {
        return {
          action: 'raise',
          amount: raiseTo,
          thinking: `[Mock Solver] Strong preflop holding (${hole[0].rank}${hole[0].suit} ${hole[1].rank}${hole[1].suit}). Opening with a standard 3x raise.`,
          chat: 'Let us see what you have got.',
        };
      }
    }

    if (valid.canCheck) {
      return {
        action: 'check',
        amount: 0,
        thinking: '[Mock Solver] Option in big blind with playable cards. Checking to see the flop.',
        chat: 'Check.',
      };
    }

    if (valid.canCall && (isPocketPair || isHighCard || valid.callAmount <= state.bigBlind)) {
      return {
        action: 'call',
        amount: 0,
        thinking: `[Mock Solver] Calling ${valid.callAmount} chips preflop with positive pot equity.`,
        chat: 'I will call.',
      };
    }

    return {
      action: 'fold',
      amount: 0,
      thinking: '[Mock Solver] Weak preflop holding against a raise. Folding.',
      chat: 'Fold. Better spots ahead.',
    };
  }

  // 2. Postflop heuristic with 7-card evaluator
  const allCards = [...hole, ...state.communityCards];
  const evaluation = evaluateHand(allCards);

  // Strong hand: Two Pair, Trips, Straight, Flush, Full House, Quads
  const isMonster = [
    'two_pair',
    'three_of_a_kind',
    'straight',
    'flush',
    'full_house',
    'four_of_a_kind',
    'straight_flush',
    'royal_flush',
  ].includes(evaluation.rankType);

  if (isMonster && valid.canRaise) {
    const halfPot = Math.floor(state.pot / 2);
    const targetRaise = Math.max(state.currentBet + halfPot, valid.minRaiseAmount);
    const raiseAmount = Math.min(targetRaise, valid.maxRaiseAmount);

    return {
      action: 'raise',
      amount: raiseAmount,
      thinking: `[Mock Solver] Made strong hand: ${evaluation.description}. Betting for value.`,
      chat: 'The board treats me well.',
    };
  }

  // Medium hand: One Pair
  if (evaluation.rankType === 'pair') {
    if (valid.canCheck) {
      return {
        action: 'check',
        amount: 0,
        thinking: `[Mock Solver] Holding ${evaluation.description}. Pot controlling with check.`,
        chat: 'Check.',
      };
    }
    if (valid.canCall && valid.callAmount <= state.pot * 0.75) {
      return {
        action: 'call',
        amount: 0,
        thinking: `[Mock Solver] Holding ${evaluation.description}. Favorable pot odds to call.`,
        chat: 'I call.',
      };
    }
  }

  // Weak hand: High Card
  if (valid.canCheck) {
    return {
      action: 'check',
      amount: 0,
      thinking: `[Mock Solver] High card only (${evaluation.description}). Checking for showdown value.`,
      chat: 'Check to you.',
    };
  }

  return {
    action: 'fold',
    amount: 0,
    thinking: `[Mock Solver] Missed board completely (${evaluation.description}) facing bet. Folding.`,
    chat: 'Too rich for my blood.',
  };
}
