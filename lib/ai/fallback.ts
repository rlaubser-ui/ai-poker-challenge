import { AIActionResponse } from '@/types/ai';
import { GameState } from '@/types/poker';
import { getValidActions } from '@/lib/poker/engine';

export function sanitizeReason(reason: string): string {
  if (!reason) return 'API fallback';

  // Check if string contains JSON or error payload
  if (reason.includes('{') && reason.includes('}')) {
    try {
      const jsonStart = reason.indexOf('{');
      const jsonEnd = reason.lastIndexOf('}');
      const parsed = JSON.parse(reason.slice(jsonStart, jsonEnd + 1));

      const code = parsed?.error?.code || parsed?.code || parsed?.status;
      const msg = parsed?.error?.message || parsed?.message;

      if (
        code === 429 ||
        String(code) === 'RESOURCE_EXHAUSTED' ||
        (msg && String(msg).toLowerCase().includes('quota'))
      ) {
        return 'Rate Limit / Quota Exceeded (429). Please switch models in Settings or retry later.';
      }
      if (msg) {
        return String(msg).split('\n')[0].replace(/https?:\/\/\S+/g, '').trim();
      }
    } catch {
      // not valid JSON, proceed below
    }
  }

  const lower = reason.toLowerCase();
  if (
    lower.includes('resource_exhausted') ||
    lower.includes('quota exceeded') ||
    lower.includes('rate limit') ||
    reason.includes('429')
  ) {
    return 'Rate Limit / Quota Exceeded (429). Please switch models in Settings or retry later.';
  }

  // Remove URLs or messy braces
  return (
    reason
      .split('\n')[0]
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\{.*?\}/g, '')
      .trim() || 'API fallback'
  );
}

/**
 * Defensive heuristic fallback.
 * Guarantees a safe, 100% legal action if an LLM times out (>2500ms),
 * encounters rate limits, returns malformed JSON, or produces an illegal move.
 */
export function getFallbackAction(
  state: GameState,
  reason: string = 'Timeout/API fallback'
): AIActionResponse {
  const cleanReason = sanitizeReason(reason);
  const valid = getValidActions(state);

  // If we can check for free, always check
  if (valid.canCheck) {
    return {
      action: 'check',
      amount: 0,
      thinking: `[Fallback: ${cleanReason}] Checking to stay in hand without risking extra chips.`,
      chat: 'Check.',
    };
  }

  // If the call is minimal (e.g. blinds completion preflop <= 10 chips), call
  if (valid.canCall && valid.callAmount <= state.bigBlind) {
    return {
      action: 'call',
      amount: 0,
      thinking: `[Fallback: ${cleanReason}] Calling minimal bet (${valid.callAmount} chips).`,
      chat: 'I will see the flop.',
    };
  }

  // Otherwise, safely fold
  return {
    action: 'fold',
    amount: 0,
    thinking: `[Fallback: ${cleanReason}] Folding against bet to preserve bankroll.`,
    chat: 'Not this time. Fold.',
  };
}

