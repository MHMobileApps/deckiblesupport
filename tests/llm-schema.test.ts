import { describe, expect, it } from 'vitest';
import { draftSchema } from '../lib/llm/schema';

describe('llm output validation', () => {
  it('accepts valid payload', () => {
    const result = draftSchema.safeParse({
      language: 'en',
      detectedLanguageName: 'English',
      summaryBullets: ['a', 'b'],
      category: 'other',
      urgency: 'low',
      confidence: 0.8,
      suggestedReply: 'Hello\n\nMark',
      suggestedInternalNote: 'Internal note',
      followUpQuestions: [],
      redFlags: [],
      nextSteps: ['Review'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid category', () => {
    const result = draftSchema.safeParse({ language: 'en', detectedLanguageName: 'English', summaryBullets: ['a', 'b'], category: 'bad', urgency: 'low', confidence: 0.8, suggestedReply: 'x', suggestedInternalNote: 'y', followUpQuestions: [], redFlags: [], nextSteps: ['z'] });
    expect(result.success).toBe(false);
  });
});
