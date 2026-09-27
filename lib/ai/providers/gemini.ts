import { GoogleGenAI } from '@google/genai';

export async function callGemini(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  signal?: AbortSignal,
  modelName: string = 'gemini-1.5-flash'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: modelName,
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
    throw new Error('Gemini returned empty response text.');
  }
  return text;
}
