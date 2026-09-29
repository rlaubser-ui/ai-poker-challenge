import { Player } from './poker';

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationSeconds: number; // 180s for 3-minute turbo
}

export const TURBO_SNG_BLINDS: BlindLevel[] = [
  { level: 1, smallBlind: 10, bigBlind: 20, ante: 0, durationSeconds: 180 },
  { level: 2, smallBlind: 15, bigBlind: 30, ante: 0, durationSeconds: 180 },
  { level: 3, smallBlind: 25, bigBlind: 50, ante: 0, durationSeconds: 180 },
  { level: 4, smallBlind: 50, bigBlind: 100, ante: 0, durationSeconds: 180 },
  { level: 5, smallBlind: 75, bigBlind: 150, ante: 15, durationSeconds: 180 },
  { level: 6, smallBlind: 100, bigBlind: 200, ante: 25, durationSeconds: 180 },
  { level: 7, smallBlind: 150, bigBlind: 300, ante: 30, durationSeconds: 180 },
  { level: 8, smallBlind: 200, bigBlind: 400, ante: 50, durationSeconds: 180 },
  { level: 9, smallBlind: 300, bigBlind: 600, ante: 75, durationSeconds: 180 },
  { level: 10, smallBlind: 500, bigBlind: 1000, ante: 100, durationSeconds: 180 },
];

export const BLIND_STRUCTURE = TURBO_SNG_BLINDS;

export interface TournamentElimination {
  playerId: string;
  name: string;
  avatar: string;
  rank: number; // 1 to 7
  handNumber: number;
  prize: number;
}

export interface PayoutTier {
  rank: number;
  percentage: number;
  amount: number;
}

export const SNG_7MAX_PAYOUTS: PayoutTier[] = [
  { rank: 1, percentage: 0.7, amount: 49 },
  { rank: 2, percentage: 0.3, amount: 21 },
];

export interface TournamentState {
  id: string;
  name: string;
  buyIn: number;
  startingChips: number;
  totalPlayers: number;
  currentLevelIndex: number;
  secondsRemaining: number;
  isPaused: boolean;
  isComplete: boolean;
  prizePool: number;
  payouts: PayoutTier[];
  eliminations: TournamentElimination[];
  winner?: Player;
  handNumber: number;
}
