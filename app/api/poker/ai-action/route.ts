import { NextRequest, NextResponse } from 'next/server';
import { AIActionResponseSchema } from '@/types/ai';
import { getFallbackAction } from '@/lib/ai/fallback';
import { formatGamePrompt } from '@/lib/ai/formatPrompt';
import { getPersonaConfig } from '@/lib/ai/personas';
import { callClaude } from '@/lib/ai/providers/claude';
import { callGemini } from '@/lib/ai/providers/gemini';
import { executeMockAction } from '@/lib/ai/providers/mock';
import { callOpenAI } from '@/lib/ai/providers/openai';
import { getValidActions } from '@/lib/poker/engine';
import { GameState } from '@/types/poker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let state: GameState | null = null;
  try {
    const body = await req.json();
    state = body.gameState as GameState;
    const personaId = body.personaId || 'mock';

    if (!state || !state.players) {
      return NextResponse.json(
        { error: 'Invalid game state provided.' },
        { status: 400 }
      );
    }

    const aiIdx = state.activePlayerIndex;
    const aiPlayer = state.players[aiIdx];
    const valid = getValidActions(state);

    // 1. Instant Mock Provider (Zero Network, zero key requirement)
    if (personaId === 'mock') {
      const mockAction = executeMockAction(state, aiIdx);
      return NextResponse.json(mockAction);
    }

    // 2. Resolve API Key from headers or server environment
    const headerKey =
      req.headers.get('x-gemini-key') ||
      req.headers.get('x-anthropic-key') ||
      req.headers.get('x-openai-key') ||
      req.headers.get('x-api-key');

    let apiKey = headerKey || '';

    if (!apiKey) {
      if (personaId === 'gemini') {
        apiKey = process.env.GEMINI_API_KEY || '';
      } else if (personaId === 'claude') {
        apiKey = process.env.ANTHROPIC_API_KEY || '';
      } else if (personaId === 'gpt') {
        apiKey = process.env.OPENAI_API_KEY || '';
      }
    }

    if (!apiKey) {
      // Gracefully fallback to mock/heuristic if key is missing
      const fallback = getFallbackAction(
        state,
        `Missing ${personaId.toUpperCase()} API Key. Configure key in Settings.`
      );
      return NextResponse.json(fallback);
    }

    const persona = getPersonaConfig(personaId);
    const prompt = formatGamePrompt(state, aiIdx);

    // 3. Enforce 2500ms hard timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    let rawOutput = '';
    try {
      if (personaId === 'gemini') {
        rawOutput = await callGemini(
          prompt,
          persona.systemPrompt,
          apiKey,
          controller.signal
        );
      } else if (personaId === 'claude') {
        rawOutput = await callClaude(
          prompt,
          persona.systemPrompt,
          apiKey,
          controller.signal
        );
      } else if (personaId === 'gpt') {
        rawOutput = await callOpenAI(
          prompt,
          persona.systemPrompt,
          apiKey,
          controller.signal
        );
      } else {
        throw new Error(`Unsupported persona: ${personaId}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // 4. Validate output with Zod schema
    const parsedJson = JSON.parse(rawOutput);
    const validated = AIActionResponseSchema.parse(parsedJson);

    // 5. Sanitize and ensure action is 100% legal within current poker engine rules
    let sanitizedAction = validated.action;
    let sanitizedAmount = validated.amount;

    if (sanitizedAction === 'check' && !valid.canCheck) {
      // LLM attempted illegal check facing a bet -> convert to call if affordable, else fold
      sanitizedAction = valid.canCall ? 'call' : 'fold';
      sanitizedAmount = 0;
    } else if (sanitizedAction === 'call' && !valid.canCall && valid.canCheck) {
      // LLM called when checking is free -> convert to check
      sanitizedAction = 'check';
      sanitizedAmount = 0;
    } else if (sanitizedAction === 'raise') {
      if (!valid.canRaise) {
        sanitizedAction = valid.canCall ? 'call' : 'check';
        sanitizedAmount = 0;
      } else {
        // Clamp raise between min and max
        sanitizedAmount = Math.max(
          valid.minRaiseAmount,
          Math.min(sanitizedAmount, valid.maxRaiseAmount)
        );
      }
    }

    return NextResponse.json({
      action: sanitizedAction,
      amount: sanitizedAmount,
      thinking: validated.thinking || 'Strategic play.',
      chat: validated.chat || 'My move.',
    });
  } catch (err: any) {
    const errorMsg =
      err?.name === 'AbortError'
        ? 'AI request timed out (>2.5s)'
        : err?.message || 'Error communicating with AI model';

    // Defensive fallback guarantees the game loop never crashes
    if (state) {
      return NextResponse.json(getFallbackAction(state, errorMsg));
    }

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
