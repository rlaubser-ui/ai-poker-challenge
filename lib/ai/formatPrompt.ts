import { GameState } from '@/types/poker';
import { getValidActions } from '@/lib/poker/engine';

/**
 * Serializes the poker game state into a clean, structured context for the LLM.
 * CRITICAL SECURITY / FAIRNESS RULE:
 * NEVER reveal the human player's hole cards to the AI prompt!
 */
export function formatGamePrompt(state: GameState, aiPlayerIndex: number): string {
  const aiPlayer = state.players[aiPlayerIndex];
  const humanPlayer = state.players[1 - aiPlayerIndex];
  const validActions = getValidActions(state);

  const holeCardsStr = aiPlayer.holeCards
    .map((c) => `${c.rank}${c.suit}`)
    .join(' ');

  const communityCardsStr =
    state.communityCards.length > 0
      ? state.communityCards.map((c) => `${c.rank}${c.suit}`).join(' ')
      : 'None (Pre-flop)';

  const recentHistory = state.handHistory
    .slice(-4)
    .map(
      (h) =>
        `- ${h.playerId === aiPlayer.id ? 'You' : humanPlayer.name}: ${h.action.type.toUpperCase()}${
          h.action.amount ? ` (${h.action.amount})` : ''
        }`
    )
    .join('\n');

  return `
TABLE STATUS:
- Game: Heads-Up No-Limit Texas Hold'em
- Street: ${state.stage.toUpperCase()}
- Total Pot: ${state.pot} chips
- Current High Bet to match: ${state.currentBet} chips
- Community Cards: [ ${communityCardsStr} ]

YOUR HOLDINGS & STACK:
- Your Name: ${aiPlayer.name}
- Your Hole Cards: [ ${holeCardsStr} ]
- Your Remaining Chips: ${aiPlayer.chips}
- Your Current Bet on Table: ${aiPlayer.currentBet}

OPPONENT STATUS:
- Opponent: ${humanPlayer.name}
- Opponent Remaining Chips: ${humanPlayer.chips}
- Opponent Current Bet on Table: ${humanPlayer.currentBet}
- Opponent Hole Cards: [ Hidden ]

RECENT ACTIONS:
${recentHistory || '- No actions yet this street.'}

LEGAL ACTIONS YOU CAN TAKE:
${validActions.canCheck ? '- CHECK (Cost: 0 chips)' : ''}
${validActions.canCall ? `- CALL (Cost: ${validActions.callAmount} chips to match bet)` : ''}
${
  validActions.canRaise
    ? `- RAISE (Total bet must be between ${validActions.minRaiseAmount} and ${validActions.maxRaiseAmount} chips)`
    : ''
}
- FOLD

Choose your action strictly from the legal actions listed above. Output strictly JSON.`;
}
