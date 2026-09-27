import OpenAI from 'openai';

export async function callOpenAI(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  signal?: AbortSignal,
  modelName: string = 'gpt-4o'
): Promise<string> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create(
    {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 300,
    },
    { signal }
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty message content.');
  }
  return content;
}
