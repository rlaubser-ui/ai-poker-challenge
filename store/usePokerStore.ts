import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIActionResponse, AIPersonaId, CustomBot } from '@/types/ai';
import { GameState, Player, PlayerAction } from '@/types/poker';
import { BanterMessage, UserSettings } from '@/types/settings';
import { getPersonaConfig } from '@/lib/ai/personas';
import { applyAction, createInitialGameState } from '@/lib/poker/engine';

export interface ActiveBotInfo {
  id: string;
  name: string;
  avatar: string;
  style: string;
  model: string;
  isCustom: boolean;
  customBot?: CustomBot;
}

export function resolveBotInfo(
  personaId: string,
  customBots: CustomBot[] = [],
  settings?: UserSettings
): ActiveBotInfo {
  const custom = customBots.find((b) => b.id === personaId);
  if (custom) {
    return {
      id: custom.id,
      name: custom.name,
      avatar: custom.avatar,
      style: custom.style,
      model: custom.model,
      isCustom: true,
      customBot: custom,
    };
  }

  const persona = getPersonaConfig(personaId as AIPersonaId);
  let model = persona.model;
  if (personaId === 'gemini' && settings?.customModels?.gemini) {
    model = settings.customModels.gemini;
  } else if (personaId === 'claude' && settings?.customModels?.anthropic) {
    model = settings.customModels.anthropic;
  } else if (personaId === 'gpt' && settings?.customModels?.openai) {
    model = settings.customModels.openai;
  }

  return {
    id: persona.id,
    name: persona.name,
    avatar: persona.avatar,
    style: persona.style,
    model,
    isCustom: false,
  };
}

interface PokerStoreState {
  gameState: GameState | null;
  selectedPersonaId: string;
  customBots: CustomBot[];
  isAITurn: boolean;
  lastAIResponse: AIActionResponse | null;
  banterLog: BanterMessage[];
  settings: UserSettings;
  handsPlayed: number;
  stats: { humanWins: number; aiWins: number };

  // Actions
  initGame: () => void;
  startNewHand: () => void;
  dispatchAction: (action: PlayerAction) => Promise<void>;
  setPersona: (personaId: string) => void;
  createCustomBot: (bot: Omit<CustomBot, 'id' | 'createdAt'>) => CustomBot;
  updateCustomBot: (bot: CustomBot) => void;
  deleteCustomBot: (botId: string) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetBankroll: () => void;
  clearBanter: () => void;
}

export const usePokerStore = create<PokerStoreState>()(
  persist(
    (set, get) => {
      const triggerAITurn = async (currentState: GameState) => {
        set({ isAITurn: true });

        // Natural action delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        const { selectedPersonaId, customBots, settings } = get();
        const botInfo = resolveBotInfo(selectedPersonaId, customBots, settings);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (settings.apiKeys.gemini) headers['x-gemini-key'] = settings.apiKeys.gemini;
        if (settings.apiKeys.anthropic) headers['x-anthropic-key'] = settings.apiKeys.anthropic;
        if (settings.apiKeys.openai) headers['x-openai-key'] = settings.apiKeys.openai;

        if (botInfo.isCustom && botInfo.customBot) {
          headers['x-custom-model'] = botInfo.customBot.model;
        } else {
          const customModel = settings.customModels?.[selectedPersonaId as 'gemini' | 'anthropic' | 'openai'];
          if (customModel) {
            headers['x-custom-model'] = customModel;
          }
        }

        try {
          const res = await fetch('/api/poker/ai-action', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              gameState: currentState,
              personaId: selectedPersonaId,
              customBot: botInfo.customBot,
            }),
          });

          if (!res.ok) {
            throw new Error(`API error: ${res.statusText}`);
          }

          const aiResponse: AIActionResponse = await res.json();
          set({ lastAIResponse: aiResponse });

          // Add AI Banter to chat log
          if (aiResponse.chat) {
            const newBanter: BanterMessage = {
              id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              sender: botInfo.name,
              avatar: botInfo.avatar,
              text: aiResponse.chat,
              isAI: true,
              timestamp: Date.now(),
            };
            set((prev) => ({
              banterLog: [...prev.banterLog.slice(-15), newBanter],
            }));
          }

          const nextAction: PlayerAction = {
            type: aiResponse.action,
            amount: aiResponse.amount > 0 ? aiResponse.amount : undefined,
          };

          const updatedState = applyAction(currentState, nextAction);
          set({ gameState: updatedState, isAITurn: false });

          // Handle hand completion
          if (updatedState.stage === 'ended') {
            const winner = updatedState.winners?.[0];
            set((prev) => ({
              handsPlayed: prev.handsPlayed + 1,
              stats: {
                humanWins:
                  winner && !winner.playerId.includes('ai')
                    ? prev.stats.humanWins + 1
                    : prev.stats.humanWins,
                aiWins:
                  winner && winner.playerId.includes('ai')
                    ? prev.stats.aiWins + 1
                    : prev.stats.aiWins,
              },
            }));
          } else if (
            updatedState.players[updatedState.activePlayerIndex].isAI
          ) {
            await triggerAITurn(updatedState);
          }
        } catch (err) {
          console.error('AI turn execution error:', err);
          const valid =
            currentState.currentBet ===
            currentState.players[currentState.activePlayerIndex].currentBet;
          const fallbackAction: PlayerAction = { type: valid ? 'check' : 'fold' };
          const fallbackState = applyAction(currentState, fallbackAction);
          set({ gameState: fallbackState, isAITurn: false });
        }
      };

      return {
        gameState: null,
        selectedPersonaId: 'mock',
        customBots: [],
        isAITurn: false,
        lastAIResponse: null,
        banterLog: [],
        settings: {
          reasoningVisibility: 'showdown',
          apiKeys: {},
        },
        handsPlayed: 0,
        stats: { humanWins: 0, aiWins: 0 },

        initGame: () => {
          const { selectedPersonaId, customBots, settings } = get();
          const botInfo = resolveBotInfo(selectedPersonaId, customBots, settings);

          const human: Player = {
            id: 'player_human',
            name: 'You',
            avatar: '👤',
            chips: 1000,
            currentBet: 0,
            holeCards: [],
            isFolded: false,
            isAllIn: false,
            isAI: false,
          };

          const ai: Player = {
            id: 'player_ai',
            name: botInfo.name,
            avatar: botInfo.avatar,
            style: botInfo.style,
            chips: 1000,
            currentBet: 0,
            holeCards: [],
            isFolded: false,
            isAllIn: false,
            isAI: true,
          };

          const initialState = createInitialGameState({
            players: [human, ai],
            dealerIndex: 0,
            smallBlind: 10,
            bigBlind: 20,
          });

          set({ gameState: initialState, lastAIResponse: null });

          if (initialState.players[initialState.activePlayerIndex].isAI) {
            triggerAITurn(initialState);
          }
        },

        startNewHand: () => {
          const { gameState, selectedPersonaId, customBots, settings } = get();
          if (!gameState) return;

          const botInfo = resolveBotInfo(selectedPersonaId, customBots, settings);
          let p0Chips = gameState.players[0].chips;
          let p1Chips = gameState.players[1].chips;

          if (p0Chips <= 0) p0Chips = 1000;
          if (p1Chips <= 0) p1Chips = 1000;

          const human: Player = {
            ...gameState.players[0],
            name: 'You',
            avatar: '👤',
            chips: p0Chips,
            currentBet: 0,
            holeCards: [],
            isFolded: false,
            isAllIn: false,
            isAI: false,
          };

          const ai: Player = {
            ...gameState.players[1],
            name: botInfo.name,
            avatar: botInfo.avatar,
            style: botInfo.style,
            chips: p1Chips,
            currentBet: 0,
            holeCards: [],
            isFolded: false,
            isAllIn: false,
            isAI: true,
          };

          const nextDealerIdx = 1 - gameState.dealerIndex;

          const nextState = createInitialGameState({
            players: [human, ai],
            dealerIndex: nextDealerIdx,
            smallBlind: 10,
            bigBlind: 20,
          });

          set({ gameState: nextState, lastAIResponse: null });

          if (nextState.players[nextState.activePlayerIndex].isAI) {
            triggerAITurn(nextState);
          }
        },

        dispatchAction: async (action: PlayerAction) => {
          const { gameState, isAITurn } = get();
          if (!gameState || isAITurn || gameState.stage === 'ended') return;

          try {
            const nextState = applyAction(gameState, action);
            set({ gameState: nextState });

            if (nextState.stage === 'ended') {
              const winner = nextState.winners?.[0];
              set((prev) => ({
                handsPlayed: prev.handsPlayed + 1,
                stats: {
                  humanWins:
                    winner && !winner.playerId.includes('ai')
                      ? prev.stats.humanWins + 1
                      : prev.stats.humanWins,
                  aiWins:
                    winner && winner.playerId.includes('ai')
                      ? prev.stats.aiWins + 1
                      : prev.stats.aiWins,
                },
              }));
            } else if (nextState.players[nextState.activePlayerIndex].isAI) {
              await triggerAITurn(nextState);
            }
          } catch (err) {
            console.error('Failed to apply human action:', err);
          }
        },

        setPersona: (personaId: string) => {
          const { customBots, settings } = get();
          const botInfo = resolveBotInfo(personaId, customBots, settings);
          set((prev) => {
            if (!prev.gameState) return { selectedPersonaId: personaId };
            const updatedPlayers: [Player, Player] = [
              { ...prev.gameState.players[0] },
              {
                ...prev.gameState.players[1],
                name: botInfo.name,
                avatar: botInfo.avatar,
                style: botInfo.style,
              },
            ];
            return {
              selectedPersonaId: personaId,
              gameState: { ...prev.gameState, players: updatedPlayers },
            };
          });
        },

        createCustomBot: (botData) => {
          const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newBot: CustomBot = {
            ...botData,
            id,
            createdAt: Date.now(),
          };
          set((prev) => ({
            customBots: [...prev.customBots, newBot],
            selectedPersonaId: id,
          }));
          get().setPersona(id);
          return newBot;
        },

        updateCustomBot: (updatedBot: CustomBot) => {
          set((prev) => ({
            customBots: prev.customBots.map((b) => (b.id === updatedBot.id ? updatedBot : b)),
          }));
          if (get().selectedPersonaId === updatedBot.id) {
            get().setPersona(updatedBot.id);
          }
        },

        deleteCustomBot: (botId: string) => {
          set((prev) => {
            const filtered = prev.customBots.filter((b) => b.id !== botId);
            const nextPersona = prev.selectedPersonaId === botId ? 'mock' : prev.selectedPersonaId;
            return {
              customBots: filtered,
              selectedPersonaId: nextPersona,
            };
          });
          get().setPersona(get().selectedPersonaId);
        },

        updateSettings: (newSettings: Partial<UserSettings>) => {
          set((prev) => ({
            settings: { ...prev.settings, ...newSettings },
          }));
        },

        resetBankroll: () => {
          set((prev) => {
            if (!prev.gameState) return {};
            const updatedPlayers: [Player, Player] = [
              { ...prev.gameState.players[0], chips: 1000 },
              { ...prev.gameState.players[1], chips: 1000 },
            ];
            return {
              gameState: { ...prev.gameState, players: updatedPlayers },
              stats: { humanWins: 0, aiWins: 0 },
              handsPlayed: 0,
            };
          });
        },

        clearBanter: () => {
          set({ banterLog: [] });
        },
      };
    },
    {
      name: 'ai-poker-challenge-storage',
      partialize: (state) => ({
        selectedPersonaId: state.selectedPersonaId,
        customBots: state.customBots,
        settings: state.settings,
        handsPlayed: state.handsPlayed,
        stats: state.stats,
      }),
    }
  )
);
