import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 5) {
      return NextResponse.json(
        { valid: false, error: 'Please enter a valid API key string.' },
        { status: 400 }
      );
    }

    const key = apiKey.trim();

    if (provider === 'gemini') {
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        // Quick verification probe
        await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'ping',
          config: { maxOutputTokens: 1 },
        });

        const models = [
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fastest & Sharp - Recommended)' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Analytical)' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Balanced)' },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
        ];

        return NextResponse.json({ valid: true, models });
      } catch (err: any) {
        return NextResponse.json({
          valid: false,
          error: err?.message || 'Invalid Gemini API key or quota exceeded.',
        });
      }
    }

    if (provider === 'anthropic') {
      try {
        const anthropic = new Anthropic({ apiKey: key });
        // Quick verification probe
        await anthropic.messages.create({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        });

        const models = [
          { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (Strategic & Balanced - Recommended)' },
          { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Lightning Fast)' },
          { id: 'claude-3-opus-latest', name: 'Claude 3 Opus (Deep Reasoning)' },
        ];

        return NextResponse.json({ valid: true, models });
      } catch (err: any) {
        return NextResponse.json({
          valid: false,
          error: err?.message || 'Invalid Anthropic API key or authentication failed.',
        });
      }
    }

    if (provider === 'openai') {
      try {
        const openai = new OpenAI({ apiKey: key });
        // Quick verification probe
        await openai.models.list();

        const models = [
          { id: 'gpt-4o', name: 'GPT-4o (Aggressive & High Bluffing - Recommended)' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Low Cost)' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
          { id: 'o1-mini', name: 'o1-mini (Advanced Reasoning)' },
        ];

        return NextResponse.json({ valid: true, models });
      } catch (err: any) {
        return NextResponse.json({
          valid: false,
          error: err?.message || 'Invalid OpenAI API key or quota exceeded.',
        });
      }
    }

    return NextResponse.json(
      { valid: false, error: `Unsupported provider: ${provider}` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err?.message || 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
