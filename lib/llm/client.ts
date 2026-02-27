import { env } from '@/lib/env';

export interface LLMClient {
  generate(params: { system: string; developer: string; user: string; model?: string }): Promise<string>
}

class OpenAIStyleClient implements LLMClient {
  async generate(params: { system: string; developer: string; user: string; model?: string }): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: params.model ?? env.LLM_MODEL,
        messages: [
          { role: 'system', content: params.system },
          { role: 'developer', content: params.developer },
          { role: 'user', content: params.user }
        ],
        temperature: 0.2,
      })
    });
    if (!response.ok) throw new Error('LLM request failed');
    const json = await response.json();
    return json.choices?.[0]?.message?.content ?? '{}';
  }
}

export function getLlmClient() {
  switch (env.LLM_PROVIDER) {
    case 'openai':
    default:
      return new OpenAIStyleClient();
  }
}
