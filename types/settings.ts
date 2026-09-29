export type ReasoningVisibility = 'live' | 'showdown' | 'hidden';

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
