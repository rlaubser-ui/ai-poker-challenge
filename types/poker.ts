export type Suit = 's' | 'h' | 'd' | 'c'; // spades, hearts, diamonds, clubs

export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'T'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type HandRankType =
  | 'high_card'
  | 'pair'
  | 'two_pair'
  | 'three_of_a_kind'
  | 'straight'
  | 'flush'
  | 'full_house'
  | 'four_of_a_kind'
  | 'straight_flush'
  | 'royal_flush';

export interface HandEvaluation {
  rankType: HandRankType;
  score: number; // Higher is better, enables strict numerical tiebreaker comparisons
  description: string; // e.g. "Full House, Aces full of Kings"
  bestFiveCards: Card[];
}

export type PlayerActionType = 'fold' | 'check' | 'call' | 'raise';

export interface PlayerAction {
  type: PlayerActionType;
  amount?: number; // For raise: the total bet amount player is raising to
}

export type GameStage =
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'showdown'
  | 'ended';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  style?: string;
  chips: number;
  currentBet: number;
  holeCards: Card[];
  isFolded: boolean;
  isAllIn: boolean;
  isAI: boolean;
}

export interface WinnerResult {
  playerId: string;
  amount: number;
  description: string;
  bestFiveCards?: Card[];
}

export interface ActionRecord {
  id: string;
  stage: GameStage;
  playerId: string;
  action: PlayerAction;
  potAfter: number;
  timestamp: number;
}

export interface GameState {
  handId: string;
  stage: GameStage;
  communityCards: Card[];
  pot: number;
  currentBet: number; // Current highest bet amount on this street
  minRaise: number; // Minimum valid raise amount on top of currentBet
  dealerIndex: number; // 0 or 1 (in Heads-Up: Dealer is Small Blind)
  activePlayerIndex: number; // 0 or 1
  players: [Player, Player];
  deck: Card[];
  winners?: WinnerResult[];
  handHistory: ActionRecord[];
  smallBlind: number;
  bigBlind: number;
}

export interface ValidActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  minRaiseAmount: number;
  maxRaiseAmount: number;
}
