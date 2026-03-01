import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/llm/client', () => ({
  getLlmClient: () => ({
    generate: vi.fn(async () => {
      throw new Error('provider unavailable');
    }),
  }),
}));

import { generateDraft } from '../lib/llm/draft-engine';

describe('draft engine fallback', () => {
  it('returns fallback output when llm request throws', async () => {
    const output = await generateDraft({ ticket: { id: 1, subject: 'Help' }, comments: [] });

    expect(output.category).toBe('other');
    expect(output.urgency).toBe('medium');
    expect(output.suggestedReply).toContain('Mark');
    expect(output.suggestedInternalNote).toContain('request failure');
  });
});
