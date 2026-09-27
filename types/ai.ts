import { z } from 'zod';
import { GameState } from './poker';

export type AIPersonaId = 'gemini' | 'claude' | 'gpt' | 'mock';

export const AIActionResponseSchema = z.object({
  action: z.enum(['fold', 'check', 'call', 'raise']),
  amount: z.number().default(0),
  thinking: z.string().default(''),
  chat: z.string().default(''),
});

export type AIActionResponse = z.infer<typeof AIActionResponseSchema>;

export interface AIPersonaConfig {
  id: string;
  name: string;
  model: string;
  avatar: string;
  style: string;
  badge: string;
  systemPrompt: string;
  defaultTemperature: number;
}

export interface CustomBot {
  id: string;
  name: string;
  avatar: string;
  provider: 'gemini' | 'claude' | 'openai' | 'mock';
  model: string;
  style: string;
  banterFlavor: string;
  systemPrompt: string;
  temperature: number;
  createdAt: number;
}

export interface AIActionRequest {
  gameState: GameState;
  personaId: string;
  customBot?: CustomBot;
}
