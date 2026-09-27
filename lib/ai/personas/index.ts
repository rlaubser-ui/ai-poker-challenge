import { AIPersonaConfig, AIPersonaId } from '@/types/ai';
import { claudePersona } from './claude';
import { geminiPersona } from './gemini';
import { gptPersona } from './gpt';
import { mockPersona } from './mock';

export const PERSONAS: Record<AIPersonaId, AIPersonaConfig> = {
  gemini: geminiPersona,
  claude: claudePersona,
  gpt: gptPersona,
  mock: mockPersona,
};

export const DEFAULT_PERSONA_ID: AIPersonaId = 'gemini';

export function getPersonaConfig(id: AIPersonaId): AIPersonaConfig {
  return PERSONAS[id] || PERSONAS[DEFAULT_PERSONA_ID];
}
