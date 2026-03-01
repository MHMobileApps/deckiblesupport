import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLlmClient } from '../lib/llm/client';

describe('llm client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends supported OpenAI message roles', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"ok":true}' } }] }),
    }));

    vi.stubGlobal('fetch', fetchMock as any);

    const client = getLlmClient();
    await client.generate({
      system: 'sys',
      developer: 'dev',
      user: 'user',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.messages).toEqual([
      { role: 'system', content: expect.stringContaining('Developer instructions:\ndev') },
      { role: 'user', content: 'user' },
    ]);
  });

  it('surfaces status and body when llm request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => 'unsupported_value: messages[1].role',
    })) as any);

    const client = getLlmClient();

    await expect(client.generate({ system: 'sys', developer: 'dev', user: 'user' })).rejects.toThrow(
      'LLM request failed (400): unsupported_value: messages[1].role',
    );
  });
});
