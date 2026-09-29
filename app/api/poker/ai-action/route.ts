import { NextRequest, NextResponse } from 'next/server';
import { AIActionResponseSchema, CustomBot } from '@/types/ai';
import { getFallbackAction, sanitizeReason } from '@/lib/ai/fallback';
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
    const customBot = body.customBot as CustomBot | undefined;

    if (!state || !state.players) {
      return NextResponse.json(
        { error: 'Invalid game state provided.' },
        { status: 400 }
      );
    }

    const aiIdx = state.activePlayerIndex;
    const valid = getValidActions(state);

    // 1. Instant Mock Provider (Zero Network, zero key requirement)
    if ((personaId === 'mock' && !customBot) || (customBot && customBot.provider === 'mock')) {
      const mockAction = executeMockAction(state, aiIdx);
      return NextResponse.json(mockAction);
    }

    // Determine target provider, model, and system prompt
    let provider = personaId;
    let model = req.headers.get('x-custom-model') || undefined;
    let systemPrompt = '';

    if (customBot) {
      provider = customBot.provider;
      model = customBot.model;
      systemPrompt = customBot.systemPrompt;
    } else {
      const persona = getPersonaConfig(personaId);
      systemPrompt = persona.systemPrompt;
    }

    // 2. Resolve API Key from headers or server environment
    const headerKey =
      req.headers.get('x-gemini-key') ||
      req.headers.get('x-anthropic-key') ||
      req.headers.get('x-openai-key') ||
      req.headers.get('x-api-key');

    let apiKey = headerKey || '';

    if (!apiKey) {
      if (provider === 'gemini') {
        apiKey = process.env.GEMINI_API_KEY || '';
      } else if (provider === 'claude') {
        apiKey = process.env.ANTHROPIC_API_KEY || '';
      } else if (provider === 'openai') {
        apiKey = process.env.OPENAI_API_KEY || '';
      }
    }

    if (!apiKey) {
      const displayName = customBot ? customBot.name : provider.toUpperCase();
      const fallback = getFallbackAction(
        state,
        `Missing API Key for ${displayName}. Configure key in Settings.`
      );
      return NextResponse.json(fallback);
    }

    const prompt = formatGamePrompt(state, aiIdx);

    // 3. Enforce 2500ms hard timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    let rawOutput = '';
    try {
      if (provider === 'gemini') {
        rawOutput = await callGemini(
          prompt,
          systemPrompt,
          apiKey,
          controller.signal,
          model
        );
      } else if (provider === 'claude') {
        rawOutput = await callClaude(
          prompt,
          systemPrompt,
          apiKey,
          controller.signal,
          model
        );
      } else if (provider === 'openai') {
        rawOutput = await callOpenAI(
          prompt,
          systemPrompt,
          apiKey,
          controller.signal,
          model
        );
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
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
      sanitizedAction = valid.canCall ? 'call' : 'fold';
      sanitizedAmount = 0;
    } else if (sanitizedAction === 'call' && !valid.canCall && valid.canCheck) {
      sanitizedAction = 'check';
      sanitizedAmount = 0;
    } else if (sanitizedAction === 'raise') {
      if (!valid.canRaise) {
        sanitizedAction = valid.canCall ? 'call' : 'check';
        sanitizedAmount = 0;
      } else {
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
        : sanitizeReason(err?.message || 'Error communicating with AI model');

    if (state) {
      return NextResponse.json(getFallbackAction(state, errorMsg));
    }

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
