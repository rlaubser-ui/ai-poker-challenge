import { describe, expect, it } from 'vitest';
import { AIActionResponseSchema } from '@/types/ai';
import { getFallbackAction } from '@/lib/ai/fallback';
import { formatGamePrompt } from '@/lib/ai/formatPrompt';
import { executeMockAction } from '@/lib/ai/providers/mock';
import { createInitialGameState, getValidActions } from '@/lib/poker/engine';
import { Player } from '@/types/poker';

describe('AI Action API Layer', () => {
  const createTestPlayers = (): [Player, Player] => [
    {
      id: 'human',
      name: 'HumanPlayer',
      chips: 1000,
      currentBet: 0,
      holeCards: [],
      isFolded: false,
      isAllIn: false,
      isAI: false,
    },
    {
      id: 'ai_bot',
      name: 'Gemini 1.5 Pro',
      chips: 1000,
      currentBet: 0,
      holeCards: [],
      isFolded: false,
      isAllIn: false,
      isAI: true,
    },
  ];

  describe('formatGamePrompt Sanitization', () => {
    it('strictly hides human player hole cards from prompt context', () => {
      const state = createInitialGameState({
        players: createTestPlayers(),
        dealerIndex: 0,
      });

      const prompt = formatGamePrompt(state, 1); // AI is index 1

      // AI hole cards should be visible
      const aiHoleStr = `${state.players[1].holeCards[0].rank}${state.players[1].holeCards[0].suit}`;
      expect(prompt).toContain(aiHoleStr);

      // Human hole cards MUST be hidden
      const humanHoleStr = `${state.players[0].holeCards[0].rank}${state.players[0].holeCards[0].suit}`;
      expect(prompt).not.toContain(humanHoleStr);
      expect(prompt).toContain('Opponent Hole Cards: [ Hidden ]');
    });
  });

  describe('Defensive Fallback Heuristic', () => {
    it('returns check when checking is free', () => {
      const state = createInitialGameState({
        players: createTestPlayers(),
        dealerIndex: 1, // AI is dealer
      });
      // Set bets equal so check is valid
      state.currentBet = 20;
      state.players[0].currentBet = 20;
      state.players[1].currentBet = 20;

      const fallback = getFallbackAction(state, 'Test timeout');
      expect(fallback.action).toBe('check');
      expect(fallback.amount).toBe(0);
      expect(fallback.thinking).toContain('Fallback: Test timeout');
    });

    it('returns fold when facing a large raise and check is not available', () => {
      const state = createInitialGameState({
        players: createTestPlayers(),
        dealerIndex: 0,
      });
      // Human raised to 300, now AI's turn (index 1) facing the raise
      state.currentBet = 300;
      state.players[0].currentBet = 300;
      state.players[1].currentBet = 20;
      state.activePlayerIndex = 1;

      const fallback = getFallbackAction(state, 'Timeout');
      expect(fallback.action).toBe('fold');
    });
  });

  describe('Mock AI Solver', () => {
    it('returns an instantaneous, 100% legal action with thinking and chat', () => {
      const state = createInitialGameState({
        players: createTestPlayers(),
        dealerIndex: 1, // AI is dealer
      });

      const decision = executeMockAction(state, 1);
      const valid = getValidActions(state);

      expect(['fold', 'check', 'call', 'raise']).toContain(decision.action);
      expect(typeof decision.thinking).toBe('string');
      expect(decision.thinking.length).toBeGreaterThan(5);
      expect(typeof decision.chat).toBe('string');
      expect(decision.chat.length).toBeGreaterThan(0);

      // Validate legality
      if (decision.action === 'raise') {
        expect(decision.amount).toBeGreaterThanOrEqual(valid.minRaiseAmount);
        expect(decision.amount).toBeLessThanOrEqual(valid.maxRaiseAmount);
      }
    });
  });

  describe('Zod Schema Validation', () => {
    it('validates compliant AI response JSON', () => {
      const validResponse = {
        action: 'raise',
        amount: 80,
        thinking: 'Strong hand with favorable pot odds.',
        chat: 'Let us turn up the heat.',
      };

      const result = AIActionResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('rejects invalid action types', () => {
      const invalidResponse = {
        action: 'all-in-bluff', // Invalid enum
        amount: 500,
        thinking: 'YOLO',
        chat: 'Goodbye',
      };

      const result = AIActionResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});
