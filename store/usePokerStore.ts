import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIActionResponse, CustomBot } from '@/types/ai';
import { GameState, Player, PlayerAction } from '@/types/poker';
import { BanterMessage, UserSettings } from '@/types/settings';
import {
  BLIND_STRUCTURE,
  SNG_7MAX_PAYOUTS,
  TournamentElimination,
  TournamentState,
} from '@/types/tournament';
import { getSNGPersona, SNG_OPPONENTS } from '@/lib/ai/personas/sng-personas';
import { pokerSFX } from '@/lib/audio/sfx';
import { determineAIAction } from '@/lib/poker/ai-decision';
import { applyAction, createInitialGameState, getValidActions } from '@/lib/poker/engine';
import { getPersonaConfig } from '@/lib/ai/personas';
import { getNextActiveSeat } from '@/lib/poker/pot';
import { AIPersonaId } from '@/types/ai';

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
  tournament: TournamentState;
  isAITurn: boolean;
  isFastForward: boolean;
  actionTimeRemaining: number; // 15-second hand action timer
  lastAIResponse: AIActionResponse | null;
  banterLog: BanterMessage[];
  settings: UserSettings;
  customBots: CustomBot[];
  handsPlayed: number;
  stats: { humanWins: number; aiWins: number; tournamentsPlayed: number; firstPlaceFinishes: number };

  // Actions
  initTournament: () => void;
  startNewHand: () => void;
  dispatchAction: (action: PlayerAction) => Promise<void>;
  toggleFastForward: () => void;
  togglePauseTournament: () => void;
  tickTimer: () => void;
  createCustomBot: (bot: Omit<CustomBot, 'id' | 'createdAt'>) => CustomBot;
  updateCustomBot: (bot: CustomBot) => void;
  deleteCustomBot: (botId: string) => void;
  resetBankroll: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  clearBanter: () => void;
  restartTournament: () => void;
  registerForTournament: () => void;
}

const INITIAL_TOURNAMENT_STATE: TournamentState = {
  id: 'sng_zar_turbo_7max',
  name: 'ZAR 70 GTD | (7 Seater Turbo SNG)',
  buyIn: 10,
  startingChips: 1000,
  totalPlayers: 7,
  currentLevelIndex: 0,
  secondsRemaining: 180,
  isPaused: false,
  isComplete: false,
  prizePool: 70,
  currency: 'ZAR',
  buyInDisplay: 'ZAR 9 + ZAR 1',
  isRegistered: false,
  payouts: SNG_7MAX_PAYOUTS,
  eliminations: [],
  handNumber: 1,
};

function createInitialRoster(): Player[] {
  const human: Player = {
    id: 'player_human',
    name: 'You',
    avatar: '🤠',
    style: 'Hero',
    chips: 1000,
    currentBet: 0,
    holeCards: [],
    isFolded: false,
    isAllIn: false,
    isAI: false,
    isEliminated: false,
  };

  const aiPlayers: Player[] = SNG_OPPONENTS.map((bot) => ({
    id: bot.id,
    name: bot.name,
    avatar: bot.avatar,
    style: bot.badge,
    chips: 1000,
    currentBet: 0,
    holeCards: [],
    isFolded: false,
    isAllIn: false,
    isAI: true,
    isEliminated: false,
  }));

  return [human, ...aiPlayers];
}

export const usePokerStore = create<PokerStoreState>()(
  persist(
    (set, get) => {
      // Loop to process AI turns sequentially
      const processAITurns = async (currentState: GameState) => {
        let state = currentState;

        while (
          state.stage !== 'ended' &&
          state.stage !== 'showdown' &&
          state.players[state.activePlayerIndex]?.isAI &&
          !state.players[state.activePlayerIndex]?.isFolded &&
          !state.players[state.activePlayerIndex]?.isEliminated
        ) {
          set({ isAITurn: true });
          const { isFastForward } = get();

          // Realistic visual delay for AI thinking (or fast if user fast-forwards)
          const delay = isFastForward ? 80 : 500 + Math.floor(Math.random() * 300);
          await new Promise((resolve) => setTimeout(resolve, delay));

          const activeIdx = state.activePlayerIndex;
          const activePlayer = state.players[activeIdx];
          const persona = getSNGPersona(activePlayer.id);

          const decision = determineAIAction(activePlayer, state, persona);

          // Audio feedback
          if (decision.action.type === 'raise') {
            const isAllIn = decision.action.amount && decision.action.amount >= activePlayer.chips + activePlayer.currentBet;
            if (isAllIn) {
              pokerSFX.playAllIn();
            } else {
              pokerSFX.playChipBet();
            }
          } else if (decision.action.type === 'call') {
            pokerSFX.playChipBet();
          } else if (decision.action.type === 'check') {
            pokerSFX.playCheckKnock();
          } else if (decision.action.type === 'fold') {
            pokerSFX.playFold();
            const c1 = activePlayer.holeCards[0];
            const c2 = activePlayer.holeCards[1];
            const SUIT_SYMBOLS: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
            const card1Str = c1 ? `${c1.rank}${SUIT_SYMBOLS[c1.suit] || c1.suit}` : '';
            const card2Str = c2 ? `${c2.rank}${SUIT_SYMBOLS[c2.suit] || c2.suit}` : '';
            const cardsStr = card1Str && card2Str ? ` [${card1Str} ${card2Str}]` : '';
            const foldMsg: BanterMessage = {
              id: `fold_${Date.now()}_${activePlayer.id}`,
              sender: 'Dealer',
              avatar: '🃏',
              text: `${persona.name} folded${cardsStr}`,
              isAI: false,
              timestamp: Date.now(),
            };
            set((prev) => ({
              banterLog: [...prev.banterLog.slice(-25), foldMsg],
            }));
          }

          // Add banter message if AI chatted
          if (decision.chat) {
            const banterMsg: BanterMessage = {
              id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              sender: persona.name,
              avatar: persona.avatar,
              text: decision.chat,
              isAI: true,
              timestamp: Date.now(),
            };
            set((prev) => ({
              banterLog: [...prev.banterLog.slice(-25), banterMsg],
            }));
          }

          state = applyAction(state, decision.action);
          set({ gameState: state });

          // If hand ended, break out
          if (state.stage === 'ended' || state.stage === 'showdown') {
            break;
          }
        }

        set({ isAITurn: false, actionTimeRemaining: 15 });

        // If hand ended, handle eliminations and tournament evaluation
        if (state.stage === 'ended') {
          handleHandCompletion(state);
        }
      };

      const handleHandCompletion = (finalState: GameState) => {
        pokerSFX.playWinPot();
        const { tournament, handsPlayed, stats } = get();

        // Check for player eliminations
        const remainingActive = finalState.players.filter((p) => p.chips > 0 && !p.isEliminated);
        const newlyEliminated = finalState.players.filter((p) => p.chips === 0 && !p.isEliminated);

        let updatedEliminations = [...tournament.eliminations];
        let isTournamentComplete = tournament.isComplete;
        let tournamentWinner: Player | undefined = tournament.winner;

        if (newlyEliminated.length > 0) {
          // Rank from 7th down to 2nd
          newlyEliminated.forEach((p, idx) => {
            const rank = remainingActive.length + newlyEliminated.length - idx;
            p.isEliminated = true;
            p.finishRank = rank;

            const elimRecord: TournamentElimination = {
              playerId: p.id,
              name: p.name,
              avatar: p.avatar || '👤',
              rank,
              handNumber: tournament.handNumber,
              prize: rank === 2 ? 21 : 0,
            };
            updatedEliminations.push(elimRecord);

            // Announce in chat
            const bustMessage: BanterMessage = {
              id: `bust_${Date.now()}_${p.id}`,
              sender: 'Tournament Floor',
              avatar: '📢',
              text: `${p.name} eliminated in ${rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`} place!`,
              isAI: false,
              timestamp: Date.now(),
            };

            set((prev) => ({
              banterLog: [...prev.banterLog.slice(-25), bustMessage],
            }));
          });
        }

        // Check if only 1 player remains (Tournament Winner!)
        if (remainingActive.length === 1) {
          isTournamentComplete = true;
          tournamentWinner = remainingActive[0];
          tournamentWinner.finishRank = 1;

          const winRecord: TournamentElimination = {
            playerId: tournamentWinner.id,
            name: tournamentWinner.name,
            avatar: tournamentWinner.avatar || '🏆',
            rank: 1,
            handNumber: tournament.handNumber,
            prize: 49,
          };
          updatedEliminations.push(winRecord);

          const winnerAnnouncement: BanterMessage = {
            id: `win_${Date.now()}`,
            sender: 'Tournament Floor',
            avatar: '🏆',
            text: `🎉 Tournament Complete! ${tournamentWinner.name} wins 1st Place (\$49.00)!`,
            isAI: false,
            timestamp: Date.now(),
          };

          set((prev) => ({
            banterLog: [...prev.banterLog.slice(-25), winnerAnnouncement],
            stats: {
              ...prev.stats,
              tournamentsPlayed: prev.stats.tournamentsPlayed + 1,
              firstPlaceFinishes:
                tournamentWinner?.id === 'player_human'
                  ? prev.stats.firstPlaceFinishes + 1
                  : prev.stats.firstPlaceFinishes,
            },
          }));
        }

        const humanWonHand = finalState.winners?.some((w) => w.playerId === 'player_human');

        set({
          handsPlayed: handsPlayed + 1,
          stats: {
            ...stats,
            humanWins: humanWonHand ? stats.humanWins + 1 : stats.humanWins,
            aiWins: !humanWonHand ? stats.aiWins + 1 : stats.aiWins,
          },
          tournament: {
            ...tournament,
            isComplete: isTournamentComplete,
            winner: tournamentWinner,
            eliminations: updatedEliminations,
          },
        });
      };

      return {
        gameState: null,
        tournament: INITIAL_TOURNAMENT_STATE,
        isAITurn: false,
        isFastForward: false,
        actionTimeRemaining: 15,
        lastAIResponse: null,
        banterLog: [],
        settings: {
          reasoningVisibility: 'showdown',
          isSoundMuted: false,
          cardFaceTheme: 'four-color',
          cardBackTheme: 'pokerbet-magenta',
          userBalance: 1000,
          apiKeys: {},
        },
        handsPlayed: 0,
        stats: { humanWins: 0, aiWins: 0, tournamentsPlayed: 0, firstPlaceFinishes: 0 },

        initTournament: () => {
          const players = createInitialRoster();
          const currentBlinds = BLIND_STRUCTURE[0];

          pokerSFX.playDealCard();

          const initialState = createInitialGameState({
            players,
            dealerIndex: 0,
            smallBlind: currentBlinds.smallBlind,
            bigBlind: currentBlinds.bigBlind,
            ante: currentBlinds.ante,
          });

          const welcomeMsg: BanterMessage = {
            id: `welcome_${Date.now()}`,
            sender: 'Dealer',
            avatar: '♠️',
            text: 'Welcome to the ZAR 70 GTD | (7 Seater Turbo SNG)! Starting stack: 1,000 chips. 3-minute turbo blind levels.',
            isAI: false,
            timestamp: Date.now(),
          };

          set({
            gameState: initialState,
            tournament: {
              ...INITIAL_TOURNAMENT_STATE,
              handNumber: 1,
            },
            banterLog: [welcomeMsg],
            isFastForward: false,
            actionTimeRemaining: 15,
          });

          // If first actor is AI, kick off AI turn loop
          if (initialState.players[initialState.activePlayerIndex]?.isAI) {
            processAITurns(initialState);
          }
        },

        startNewHand: () => {
          const { gameState, tournament } = get();
          if (!gameState || tournament.isComplete) return;

          // Rotate dealer button to next active (non-eliminated) player
          const nextDealer = getNextActiveSeat(
            gameState.players,
            gameState.dealerIndex,
            (p) => !p.isEliminated && p.chips > 0
          );

          const currentBlindLevel = BLIND_STRUCTURE[tournament.currentLevelIndex] || BLIND_STRUCTURE[BLIND_STRUCTURE.length - 1];

          pokerSFX.playDealCard();

          const nextState = createInitialGameState({
            players: gameState.players,
            dealerIndex: nextDealer,
            smallBlind: currentBlindLevel.smallBlind,
            bigBlind: currentBlindLevel.bigBlind,
            ante: currentBlindLevel.ante,
          });

          set({
            gameState: nextState,
            tournament: {
              ...tournament,
              handNumber: tournament.handNumber + 1,
            },
            actionTimeRemaining: 15,
          });

          // If first actor is AI, run AI turns
          if (nextState.players[nextState.activePlayerIndex]?.isAI) {
            processAITurns(nextState);
          }
        },

        dispatchAction: async (action: PlayerAction) => {
          const { gameState } = get();
          if (!gameState || gameState.stage === 'ended' || gameState.stage === 'showdown') {
            return;
          }

          // Audio feedback
          if (action.type === 'raise') {
            const activeP = gameState.players[gameState.activePlayerIndex];
            if (action.amount && action.amount >= activeP.chips + activeP.currentBet) {
              pokerSFX.playAllIn();
            } else {
              pokerSFX.playChipBet();
            }
          } else if (action.type === 'call') {
            pokerSFX.playChipBet();
          } else if (action.type === 'check') {
            pokerSFX.playCheckKnock();
          } else if (action.type === 'fold') {
            pokerSFX.playFold();
          }

          const nextState = applyAction(gameState, action);
          set({ gameState: nextState, actionTimeRemaining: 15 });

          if (nextState.stage === 'ended') {
            handleHandCompletion(nextState);
          } else if (nextState.players[nextState.activePlayerIndex]?.isAI) {
            await processAITurns(nextState);
          }
        },

        toggleFastForward: () => {
          set((prev) => ({ isFastForward: !prev.isFastForward }));
        },

        togglePauseTournament: () => {
          set((prev) => ({
            tournament: {
              ...prev.tournament,
              isPaused: !prev.tournament.isPaused,
            },
          }));
        },

        tickTimer: () => {
          const { tournament, gameState, isAITurn, actionTimeRemaining, dispatchAction } = get();

          // 1. 15-Second Action Shot Clock for Human Player
          const isHumanTurn =
            gameState &&
            gameState.stage !== 'ended' &&
            gameState.stage !== 'showdown' &&
            !isAITurn &&
            gameState.activePlayerIndex === 0;

          if (isHumanTurn) {
            if (actionTimeRemaining <= 1) {
              // Time expired! Auto-action (check if allowed, else fold)
              const valid = getValidActions(gameState);
              dispatchAction({ type: valid.canCheck ? 'check' : 'fold' });
              set({ actionTimeRemaining: 15 });
            } else {
              const nextSec = actionTimeRemaining - 1;
              if (nextSec <= 5) {
                pokerSFX.playTimerTick();
              }
              set({ actionTimeRemaining: nextSec });
            }
          } else {
            if (actionTimeRemaining !== 15) {
              set({ actionTimeRemaining: 15 });
            }
          }

          if (tournament.isPaused || tournament.isComplete) return;

          let seconds = tournament.secondsRemaining - 1;
          let levelIdx = tournament.currentLevelIndex;

          if (seconds <= 0) {
            // Level Up!
            if (levelIdx < BLIND_STRUCTURE.length - 1) {
              levelIdx += 1;
              const newLevel = BLIND_STRUCTURE[levelIdx];
              seconds = newLevel.durationSeconds;

              // Play alert
              pokerSFX.playTimerTick();

              // Add chat alert
              const levelUpMsg: BanterMessage = {
                id: `lvl_${Date.now()}`,
                sender: 'Tournament Clock',
                avatar: '⏱️',
                text: `⚠️ BLINDS INCREASE: Level ${newLevel.level} — Blinds now ${newLevel.smallBlind}/${newLevel.bigBlind}${newLevel.ante ? ` (Ante ${newLevel.ante})` : ''}`,
                isAI: false,
                timestamp: Date.now(),
              };

              set((prev) => ({
                banterLog: [...prev.banterLog.slice(-25), levelUpMsg],
              }));

              if (gameState) {
                set({
                  gameState: {
                    ...gameState,
                    smallBlind: newLevel.smallBlind,
                    bigBlind: newLevel.bigBlind,
                    ante: newLevel.ante,
                  },
                });
              }
            } else {
              seconds = 180;
            }
          }

          set({
            tournament: {
              ...tournament,
              secondsRemaining: seconds,
              currentLevelIndex: levelIdx,
            },
          });
        },

        customBots: [],

        createCustomBot: (botData: Omit<CustomBot, 'id' | 'createdAt'>) => {
          const newBot: CustomBot = {
            ...botData,
            id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: Date.now(),
          };
          set((prev) => ({ customBots: [...prev.customBots, newBot] }));
          return newBot;
        },

        updateCustomBot: (bot: CustomBot) => {
          set((prev) => ({
            customBots: prev.customBots.map((b) => (b.id === bot.id ? bot : b)),
          }));
        },

        deleteCustomBot: (botId: string) => {
          set((prev) => ({
            customBots: prev.customBots.filter((b) => b.id !== botId),
          }));
        },

        resetBankroll: () => {
          get().restartTournament();
        },

        updateSettings: (newSettings: Partial<UserSettings>) => {
          set((prev) => {
            const updated = { ...prev.settings, ...newSettings };
            if (typeof updated.isSoundMuted === 'boolean') {
              pokerSFX.setMuted(updated.isSoundMuted);
            }
            return { settings: updated };
          });
        },

        clearBanter: () => {
          set({ banterLog: [] });
        },

        restartTournament: () => {
          get().initTournament();
        },

        registerForTournament: () => {
          const { tournament, settings, initTournament } = get();
          const currentBal = settings.userBalance ?? 1000;
          const newBal = Math.max(0, currentBal - tournament.buyIn);
          set((prev) => ({
            settings: { ...prev.settings, userBalance: newBal },
            tournament: { ...prev.tournament, isRegistered: true },
          }));
          initTournament();
        },
      };
    },
    {
      name: 'ai-poker-challenge-storage',
      partialize: (state) => ({
        settings: state.settings,
        stats: state.stats,
        tournament: state.tournament,
        customBots: state.customBots,
      }),
    }
  )
);
