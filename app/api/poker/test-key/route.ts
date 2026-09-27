import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 5) {
      return NextResponse.json(
        { valid: false, error: 'Please enter a valid API key.' },
        { status: 400 }
      );
    }

    const key = apiKey.trim();

    // 1. Google Gemini Provider
    if (provider === 'gemini') {
      try {
        // Query Gemini API to validate key and dynamically discover all available models
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
          { method: 'GET' }
        );

        const data = await res.json();

        if (!res.ok) {
          const errMsg = data?.error?.message || 'Invalid Gemini API Key or permission denied.';
          return NextResponse.json({ valid: false, error: errMsg });
        }

        // Filter models that support content generation and are gemini models
        let discoveredModels: { id: string; name: string }[] = [];
        if (Array.isArray(data.models)) {
          discoveredModels = data.models
            .filter(
              (m: any) =>
                m.name?.includes('gemini') &&
                Array.isArray(m.supportedGenerationMethods) &&
                m.supportedGenerationMethods.includes('generateContent') &&
                !m.name?.includes('embedding') &&
                !m.name?.includes('aqa')
            )
            .map((m: any) => {
              const cleanId = m.name.replace(/^models\//, '');
              const displayName = m.displayName || cleanId;
              return {
                id: cleanId,
                name: `${displayName} (${cleanId})`,
              };
            });
        }

        // If list was empty for some reason, provide standard modern fallbacks
        if (discoveredModels.length === 0) {
          discoveredModels = [
            { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Latest - Recommended)' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Analytical)' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
          ];
        }

        return NextResponse.json({ valid: true, models: discoveredModels });
      } catch (err: any) {
        return NextResponse.json({
          valid: false,
          error: err?.message || 'Failed to connect to Google Gemini API.',
        });
      }
    }

    // 2. Anthropic Claude Provider
    if (provider === 'anthropic') {
      try {
        const anthropic = new Anthropic({ apiKey: key });
        // Lightweight probe to verify connection
        await anthropic.messages.create({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
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

    // 3. OpenAI Provider
    if (provider === 'openai') {
      try {
        const openai = new OpenAI({ apiKey: key });
        const list = await openai.models.list();

        // Extract chat-capable GPT models
        const chatModels = list.data
          .filter(
            (m) =>
              (m.id.startsWith('gpt-4') || m.id.startsWith('o1') || m.id.startsWith('gpt-3.5')) &&
              !m.id.includes('instruct') &&
              !m.id.includes('audio') &&
              !m.id.includes('realtime')
          )
          .sort((a, b) => b.created - a.created)
          .map((m) => ({
            id: m.id,
            name: `${m.id} ${m.id === 'gpt-4o' ? '(Recommended)' : ''}`.trim(),
          }));

        const models =
          chatModels.length > 0
            ? chatModels
            : [
                { id: 'gpt-4o', name: 'GPT-4o (Recommended)' },
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
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
