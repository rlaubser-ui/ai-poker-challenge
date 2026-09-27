import { AIActionResponse } from '@/types/ai';
import { GameState } from '@/types/poker';
import { getValidActions } from '@/lib/poker/engine';

/**
 * Defensive heuristic fallback.
 * Guarantees a safe, 100% legal action if an LLM times out (>2500ms),
 * encounters rate limits, returns malformed JSON, or produces an illegal move.
 */
export function getFallbackAction(
  state: GameState,
  reason: string = 'Timeout/API fallback'
): AIActionResponse {
  const valid = getValidActions(state);

  // If we can check for free, always check
  if (valid.canCheck) {
    return {
      action: 'check',
      amount: 0,
      thinking: `[Fallback: ${reason}] Checking to stay in hand without risking extra chips.`,
      chat: 'Check.',
    };
  }

  // If the call is minimal (e.g. blinds completion preflop <= 10 chips), call
  if (valid.canCall && valid.callAmount <= state.bigBlind) {
    return {
      action: 'call',
      amount: 0,
      thinking: `[Fallback: ${reason}] Calling minimal bet (${valid.callAmount} chips).`,
      chat: 'I will see the flop.',
    };
  }

  // Otherwise, safely fold
  return {
    action: 'fold',
    amount: 0,
    thinking: `[Fallback: ${reason}] Folding against bet to preserve bankroll.`,
    chat: 'Not this time. Fold.',
  };
}
