import { Card, GameState, Player, PlayerAction, Rank } from '@/types/poker';
import { SNGPersona } from '../ai/personas/sng-personas';
import { evaluateHand } from './evaluator';
import { getValidActions } from './engine';

const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  'T': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

/**
 * Heuristic rating for preflop starting hands from 0.0 (worst) to 1.0 (pocket Aces).
 */
export function evaluatePreflopStrength(holeCards: Card[]): number {
  if (holeCards.length < 2) return 0.1;

  const [c1, c2] = holeCards;
  const val1 = RANK_VALUES[c1.rank];
  const val2 = RANK_VALUES[c2.rank];
  const high = Math.max(val1, val2);
  const low = Math.min(val1, val2);
  const isPair = val1 === val2;
  const isSuited = c1.suit === c2.suit;
  const isConnector = high - low === 1;

  if (isPair) {
    // Pocket pairs from 22 (0.50) to AA (1.00)
    return 0.5 + (high / 14) * 0.5;
  }

  let base = (high * 2 + low) / 42; // Up to ~0.95 for AK
  if (isSuited) base += 0.08;
  if (isConnector) base += 0.05;

  return Math.min(0.95, Math.max(0.05, base));
}

export interface AIDecisionResult {
  action: PlayerAction;
  thinking: string;
  chat?: string;
}

/**
 * Generates an instant, mathematically coherent decision for an AI persona.
 */
export function determineAIAction(
  player: Player,
  state: GameState,
  persona: SNGPersona,
  rng: () => number = Math.random
): AIDecisionResult {
  const valid = getValidActions(state);
  const callAmount = valid.callAmount;
  const pot = state.pot;
  const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;
  const roll = rng();

  // Pick random quote helper
  const pickQuote = (quotes: string[]) => quotes[Math.floor(rng() * quotes.length)];

  // PREFLOP DECISION
  if (state.stage === 'preflop') {
    const handStrength = evaluatePreflopStrength(player.holeCards);

    // Free to check (e.g. Big Blind in unraised pot)
    if (valid.canCheck) {
      // Decide whether to raise or check
      const willRaise = handStrength > 0.75 || (handStrength > 0.6 && roll < persona.pfr);
      if (willRaise && valid.canRaise) {
        const raiseAmount = Math.min(state.bigBlind * 3, valid.maxRaiseAmount);
        return {
          action: { type: 'raise', amount: raiseAmount },
          thinking: `${persona.name} holds strong preflop hand (strength: ${handStrength.toFixed(2)}). Raising to ${raiseAmount} for value.`,
          chat: rng() < 0.25 ? pickQuote(persona.quotes.raise) : undefined,
        };
      }
      return {
        action: { type: 'check' },
        thinking: `${persona.name} checks their option preflop with strength ${handStrength.toFixed(2)}.`,
      };
    }

    // Facing a bet/raise
    // Threshold depends on persona VPIP and fold to pressure
    const continueThreshold = Math.max(0.2, (1 - persona.vpip) * 0.8 + potOdds * 0.3);

    if (handStrength >= continueThreshold || (roll < persona.bluffRate && handStrength > 0.4)) {
      // Re-raise or call
      const will3Bet = handStrength > 0.85 || (roll < persona.pfr * 0.5 && handStrength > 0.65);
      if (will3Bet && valid.canRaise) {
        const raiseAmount = Math.min(
          state.currentBet * 2.5,
          valid.maxRaiseAmount
        );
        const isAllIn = raiseAmount >= player.chips + player.currentBet;
        return {
          action: { type: 'raise', amount: Math.floor(raiseAmount) },
          thinking: `${persona.name} aggressive 3-bet with strength ${handStrength.toFixed(2)}.`,
          chat: isAllIn
            ? pickQuote(persona.quotes.allIn)
            : rng() < 0.3 ? pickQuote(persona.quotes.raise) : undefined,
        };
      }

      if (valid.canCall) {
        return {
          action: { type: 'call' },
          thinking: `${persona.name} calls ${callAmount} with preflop strength ${handStrength.toFixed(2)} (pot odds: ${(potOdds * 100).toFixed(0)}%).`,
        };
      }
    }

    // Default: fold if cannot check
    return {
      action: { type: 'fold' },
      thinking: `${persona.name} folds weak hand (strength ${handStrength.toFixed(2)}) facing bet of ${callAmount}.`,
    };
  }

  // POSTFLOP DECISION (Flop, Turn, River)
  const evalResult = evaluateHand([...player.holeCards, ...state.communityCards]);
  let postflopStrength = 0.2;

  switch (evalResult.rankType) {
    case 'royal_flush':
    case 'straight_flush':
    case 'four_of_a_kind':
      postflopStrength = 1.0;
      break;
    case 'full_house':
      postflopStrength = 0.95;
      break;
    case 'flush':
      postflopStrength = 0.85;
      break;
    case 'straight':
      postflopStrength = 0.8;
      break;
    case 'three_of_a_kind':
      postflopStrength = 0.75;
      break;
    case 'two_pair':
      postflopStrength = 0.65;
      break;
    case 'pair':
      postflopStrength = 0.45;
      break;
    case 'high_card':
    default:
      postflopStrength = 0.2;
      break;
  }

  // If checked to us:
  if (valid.canCheck) {
    const willBet =
      postflopStrength >= 0.6 ||
      (roll < persona.aggression * 0.4) ||
      (roll < persona.bluffRate && state.stage === 'river');

    if (willBet && valid.canRaise) {
      // Bet 50% to 75% pot
      const betSize = Math.max(
        valid.minRaiseAmount,
        Math.min(valid.maxRaiseAmount, Math.floor(state.pot * 0.6))
      );
      const isAllIn = betSize >= player.chips + player.currentBet;
      return {
        action: { type: 'raise', amount: betSize },
        thinking: `${persona.name} fires a bet of ${betSize} on ${state.stage} with ${evalResult.description}.`,
        chat: isAllIn
          ? pickQuote(persona.quotes.allIn)
          : rng() < 0.25 ? pickQuote(persona.quotes.raise) : undefined,
      };
    }

    return {
      action: { type: 'check' },
      thinking: `${persona.name} checks with ${evalResult.description}.`,
    };
  }

  // Facing a bet:
  const requiredEquity = potOdds;
  const isMonster = postflopStrength >= 0.8;
  const isMadeHand = postflopStrength >= 0.45;

  if (isMonster && valid.canRaise && roll < persona.aggression) {
    const raiseAmount = Math.min(valid.maxRaiseAmount, Math.floor(state.currentBet * 2.2));
    const isAllIn = raiseAmount >= player.chips + player.currentBet;
    return {
      action: { type: 'raise', amount: raiseAmount },
      thinking: `${persona.name} raises for value holding ${evalResult.description}.`,
      chat: isAllIn ? pickQuote(persona.quotes.allIn) : undefined,
    };
  }

  if (isMadeHand || postflopStrength > requiredEquity || (roll < persona.bluffRate * 0.5)) {
    if (valid.canCall) {
      return {
        action: { type: 'call' },
        thinking: `${persona.name} calls ${callAmount} chips holding ${evalResult.description}.`,
      };
    }
  }

  // Fold if cannot call or hand is too weak
  if (valid.canCheck) {
    return {
      action: { type: 'check' },
      thinking: `${persona.name} checks behind.`,
    };
  }

  return {
    action: { type: 'fold' },
    thinking: `${persona.name} folds against bet of ${callAmount} chips.`,
  };
}
