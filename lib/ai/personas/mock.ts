import { AIPersonaConfig } from '@/types/ai';

export const mockPersona: AIPersonaConfig = {
  id: 'mock',
  name: 'Mock Bot (Offline)',
  model: 'heuristic-solver-v1',
  avatar: '🤖',
  style: 'Instant Heuristic / Offline',
  badge: 'bg-zinc-800 text-zinc-300 border-zinc-600',
  defaultTemperature: 0.1,
  systemPrompt: 'Offline deterministic poker heuristic bot. Generates instant valid actions without external API keys.',
};
