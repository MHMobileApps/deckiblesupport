import { env } from '@/lib/env';

export interface LLMClient {
  generate(params: { system: string; developer: string; user: string; model?: string }): Promise<string>
}

class OpenAIStyleClient implements LLMClient {
  async generate(params: { system: string; developer: string; user: string; model?: string }): Promise<string> {
    const combinedSystemPrompt = `${params.system}\n\nDeveloper instructions:\n${params.developer}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: params.model ?? env.LLM_MODEL,
        messages: [
          { role: 'system', content: combinedSystemPrompt },
          { role: 'user', content: params.user }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LLM request failed (${response.status}): ${body.slice(0, 200)}`);
    }
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
