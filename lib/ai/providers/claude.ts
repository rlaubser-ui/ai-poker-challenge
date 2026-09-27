import Anthropic from '@anthropic-ai/sdk';

export async function callClaude(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  signal?: AbortSignal,
  modelName: string = 'claude-3-5-sonnet-latest'
): Promise<string> {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create(
    {
      model: modelName,
      max_tokens: 300,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    },
    { signal }
  );

  const block = response.content[0];
  if (block.type === 'text') {
    return block.text;
  }
  throw new Error('Claude response content was not text.');
}
