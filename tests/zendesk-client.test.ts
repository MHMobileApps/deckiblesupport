import { describe, expect, it } from 'vitest';
import { getZendeskAuthHeader } from '../lib/zendesk/client';

describe('zendesk client auth header', () => {
  it('uses email/token basic auth format', () => {
    const header = getZendeskAuthHeader();
    expect(header.startsWith('Basic ')).toBe(true);
    const decoded = Buffer.from(header.replace('Basic ', ''), 'base64').toString('utf8');
    expect(decoded.includes('/token:')).toBe(true);
  });
});
