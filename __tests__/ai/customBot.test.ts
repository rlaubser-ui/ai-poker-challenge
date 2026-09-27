import { describe, expect, it } from 'vitest';
import { resolveBotInfo } from '@/store/usePokerStore';
import { CustomBot } from '@/types/ai';
import { UserSettings } from '@/types/settings';
import { POST } from '@/app/api/poker/ai-action/route';
import { createInitialGameState } from '@/lib/poker/engine';
import { Player } from '@/types/poker';
import { NextRequest } from 'next/server';

describe('Custom Bot Support & Resolution', () => {
  const sampleCustomBot: CustomBot = {
    id: 'bot_shark_123',
    name: 'Vegas Shark',
    avatar: '🦈',
    provider: 'gemini',
    model: 'gemini-3.8-flash',
    style: 'LAG',
    banterFlavor: 'Trash Talker',
    systemPrompt: 'You are Vegas Shark. Play aggressive poker.',
    temperature: 0.8,
    createdAt: Date.now(),
  };

  const sampleSettings: UserSettings = {
    reasoningVisibility: 'showdown',
    apiKeys: {},
    customModels: {
      gemini: 'gemini-3.8-flash',
      anthropic: 'claude-3-5-haiku-latest',
    },
  };

  describe('resolveBotInfo', () => {
    it('resolves built-in persona with custom model from settings', () => {
      const geminiInfo = resolveBotInfo('gemini', [], sampleSettings);
      expect(geminiInfo.name).toBe('Gemini 1.5 Pro');
      expect(geminiInfo.model).toBe('gemini-3.8-flash');
      expect(geminiInfo.isCustom).toBe(false);

      const claudeInfo = resolveBotInfo('claude', [], sampleSettings);
      expect(claudeInfo.name).toBe('Claude 3.5 Sonnet');
      expect(claudeInfo.model).toBe('claude-3-5-haiku-latest');
    });

    it('resolves custom bot when matching ID is found', () => {
      const botInfo = resolveBotInfo(
        'bot_shark_123',
        [sampleCustomBot],
        sampleSettings
      );
      expect(botInfo.isCustom).toBe(true);
      expect(botInfo.name).toBe('Vegas Shark');
      expect(botInfo.avatar).toBe('🦈');
      expect(botInfo.style).toBe('LAG');
      expect(botInfo.model).toBe('gemini-3.8-flash');
    });
  });

  describe('AI Action with Custom Bot Payload', () => {
    const createPlayers = (): [Player, Player] => [
      {
        id: 'human',
        name: 'Human',
        chips: 1000,
        currentBet: 10,
        holeCards: [],
        isFolded: false,
        isAllIn: false,
        isAI: false,
      },
      {
        id: 'ai_bot',
        name: 'Vegas Shark',
        avatar: '🦈',
        chips: 1000,
        currentBet: 20,
        holeCards: [],
        isFolded: false,
        isAllIn: false,
        isAI: true,
      },
    ];

    it('handles custom bot with mock provider instantly without network keys', async () => {
      const mockCustomBot: CustomBot = {
        ...sampleCustomBot,
        provider: 'mock',
        model: 'offline',
      };

      const gameState = createInitialGameState({
        players: createPlayers(),
        dealerIndex: 0,
      });

      const req = new NextRequest('http://localhost:3000/api/poker/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState,
          personaId: mockCustomBot.id,
          customBot: mockCustomBot,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(['fold', 'check', 'call', 'raise']).toContain(data.action);
      expect(typeof data.thinking).toBe('string');
      expect(typeof data.chat).toBe('string');
    });

    it('returns clear fallback message when custom bot LLM key is not configured', async () => {
      const gameState = createInitialGameState({
        players: createPlayers(),
        dealerIndex: 0,
      });

      const req = new NextRequest('http://localhost:3000/api/poker/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState,
          personaId: sampleCustomBot.id,
          customBot: sampleCustomBot,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(['fold', 'check', 'call']).toContain(data.action);
      expect(data.thinking).toContain('Missing API Key for Vegas Shark');
    });
  });
});
