import { create } from 'zustand';
import { AIActionResponse, AIPersonaId } from '@/types/ai';
import { GameState, Player, PlayerAction } from '@/types/poker';
import { getPersonaConfig } from '@/lib/ai/personas';
import { applyAction, createInitialGameState } from '@/lib/poker/engine';

interface PokerStoreState {
  gameState: GameState | null;
  selectedPersonaId: AIPersonaId;
  isAITurn: boolean;
  lastAIResponse: AIActionResponse | null;
  userApiKeys: Record<string, string>;
  handsPlayed: number;
  stats: { humanWins: number; aiWins: number };

  // Actions
  initGame: () => void;
  startNewHand: () => void;
  dispatchAction: (action: PlayerAction) => Promise<void>;
  setPersona: (personaId: AIPersonaId) => void;
  setApiKey: (provider: string, key: string) => void;
}

export const usePokerStore = create<PokerStoreState>((set, get) => {
  const triggerAITurn = async (currentState: GameState) => {
    set({ isAITurn: true });

    // Brief delay so animations and human action register naturally
    await new Promise((resolve) => setTimeout(resolve, 600));

    const { selectedPersonaId, userApiKeys } = get();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (userApiKeys.gemini) headers['x-gemini-key'] = userApiKeys.gemini;
    if (userApiKeys.claude) headers['x-anthropic-key'] = userApiKeys.claude;
    if (userApiKeys.gpt) headers['x-openai-key'] = userApiKeys.gpt;

    try {
      const res = await fetch('/api/poker/ai-action', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          gameState: currentState,
          personaId: selectedPersonaId,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const aiResponse: AIActionResponse = await res.json();
      set({ lastAIResponse: aiResponse });

      const nextAction: PlayerAction = {
        type: aiResponse.action,
        amount: aiResponse.amount > 0 ? aiResponse.amount : undefined,
      };

      const updatedState = applyAction(currentState, nextAction);
      set({ gameState: updatedState, isAITurn: false });

      // If hand ended, update stats
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
        // AI still active for another immediate street action
        await triggerAITurn(updatedState);
      }
    } catch (err) {
      console.error('AI turn execution error:', err);
      // Fallback: check or fold
      const valid = currentState.currentBet === currentState.players[currentState.activePlayerIndex].currentBet;
      const fallbackAction: PlayerAction = { type: valid ? 'check' : 'fold' };
      const fallbackState = applyAction(currentState, fallbackAction);
      set({ gameState: fallbackState, isAITurn: false });
    }
  };

  return {
    gameState: null,
    selectedPersonaId: 'mock', // Default to offline Mock bot for instant out-of-the-box play
    isAITurn: false,
    lastAIResponse: null,
    userApiKeys: {},
    handsPlayed: 0,
    stats: { humanWins: 0, aiWins: 0 },

    initGame: () => {
      const persona = getPersonaConfig(get().selectedPersonaId);

      const human: Player = {
        id: 'player_human',
        name: 'You',
        chips: 1000,
        currentBet: 0,
        holeCards: [],
        isFolded: false,
        isAllIn: false,
        isAI: false,
      };

      const ai: Player = {
        id: 'player_ai',
        name: persona.name,
        chips: 1000,
        currentBet: 0,
        holeCards: [],
        isFolded: false,
        isAllIn: false,
        isAI: true,
      };

      const initialState = createInitialGameState({
        players: [human, ai],
        dealerIndex: 0, // Human starts as dealer
        smallBlind: 10,
        bigBlind: 20,
      });

      set({ gameState: initialState, lastAIResponse: null });

      // If active player is AI (e.g. AI is dealer), trigger AI turn
      if (initialState.players[initialState.activePlayerIndex].isAI) {
        triggerAITurn(initialState);
      }
    },

    startNewHand: () => {
      const { gameState, selectedPersonaId } = get();
      if (!gameState) return;

      const persona = getPersonaConfig(selectedPersonaId);
      let p0Chips = gameState.players[0].chips;
      let p1Chips = gameState.players[1].chips;

      // Rebuy if busted
      if (p0Chips <= 0) p0Chips = 1000;
      if (p1Chips <= 0) p1Chips = 1000;

      const human: Player = {
        ...gameState.players[0],
        name: 'You',
        chips: p0Chips,
        currentBet: 0,
        holeCards: [],
        isFolded: false,
        isAllIn: false,
        isAI: false,
      };

      const ai: Player = {
        ...gameState.players[1],
        name: persona.name,
        chips: p1Chips,
        currentBet: 0,
        holeCards: [],
        isFolded: false,
        isAllIn: false,
        isAI: true,
      };

      // Alternate dealer button
      const nextDealerIdx = 1 - gameState.dealerIndex;

      const nextState = createInitialGameState({
        players: [human, ai],
        dealerIndex: nextDealerIdx,
        smallBlind: 10,
        bigBlind: 20,
      });

      set({ gameState: nextState, lastAIResponse: null });

      // In Heads-up preflop, Dealer acts first. If AI is dealer, trigger AI turn!
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

    setPersona: (personaId: AIPersonaId) => {
      const persona = getPersonaConfig(personaId);
      set((prev) => {
        if (!prev.gameState) return { selectedPersonaId: personaId };
        const updatedPlayers: [Player, Player] = [
          { ...prev.gameState.players[0] },
          { ...prev.gameState.players[1], name: persona.name },
        ];
        return {
          selectedPersonaId: personaId,
          gameState: { ...prev.gameState, players: updatedPlayers },
        };
      });
    },

    setApiKey: (provider: string, key: string) => {
      set((prev) => ({
        userApiKeys: { ...prev.userApiKeys, [provider]: key },
      }));
    },
  };
});
