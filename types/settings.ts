export type ReasoningVisibility = 'live' | 'showdown' | 'hidden';

export type CardFaceTheme = 'four-color' | 'two-color' | 'classic';
export type CardBackTheme = 'pokerbet-magenta' | 'midnight-navy' | 'casino-red' | 'cyber-gold';

export interface BanterMessage {
  id: string;
  sender: string;
  text: string;
  avatar: string;
  isAI: boolean;
  timestamp: number;
}

export interface UserSettings {
  reasoningVisibility: ReasoningVisibility;
  isSoundMuted?: boolean;
  cardFaceTheme?: CardFaceTheme;
  cardBackTheme?: CardBackTheme;
  userBalance?: number; // In ZAR
  apiKeys: {
    gemini?: string;
    anthropic?: string;
    openai?: string;
  };
  customModels?: {
    gemini?: string;
    anthropic?: string;
    openai?: string;
  };
}
