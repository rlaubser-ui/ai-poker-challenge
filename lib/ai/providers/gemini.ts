import { GoogleGenAI } from '@google/genai';

const GEMINI_RETRY_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

function isQuotaError(err: any): boolean {
  const str = String(err?.message || err || '');
  return (
    str.includes('429') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('Quota exceeded') ||
    str.includes('rate-limit')
  );
}

export async function callGemini(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  signal?: AbortSignal,
  modelName: string = 'gemini-1.5-flash'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const tryGenerate = async (targetModel: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
        abortSignal: signal,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error(`Gemini (${targetModel}) returned empty response text.`);
    }
    return text;
  };

  try {
    return await tryGenerate(modelName);
  } catch (err: any) {
    if (signal?.aborted) {
      throw err;
    }

    // If quota/rate limit exceeded on requested model (e.g. gemini-3.7-flash 20 req limit),
    // attempt alternate flash models with independent/higher free tiers
    if (isQuotaError(err)) {
      console.warn(`[Gemini] Quota limit encountered on ${modelName}. Attempting alternate flash models...`);

      for (const fallbackModel of GEMINI_RETRY_FALLBACKS) {
        if (fallbackModel === modelName || signal?.aborted) continue;
        try {
          console.info(`[Gemini] Retrying with ${fallbackModel}...`);
          return await tryGenerate(fallbackModel);
        } catch (retryErr: any) {
          if (signal?.aborted) throw retryErr;
          // continue to next fallback
        }
      }

      throw new Error(`Gemini API Quota Exceeded (429): Free tier limit reached for ${modelName}.`);
    }

    // Clean up raw JSON error messages if any
    let errMsg = err?.message || 'Error communicating with Gemini API';
    try {
      if (typeof errMsg === 'string' && (errMsg.startsWith('{') || errMsg.includes('{"error"'))) {
        const jsonStart = errMsg.indexOf('{');
        const parsed = JSON.parse(errMsg.slice(jsonStart));
        if (parsed?.error?.message) {
          errMsg = parsed.error.message.split('\n')[0].replace(/https?:\/\/\S+/g, '').trim();
        }
      }
    } catch {
      // keep original errMsg
    }

    throw new Error(errMsg);
  }
}

