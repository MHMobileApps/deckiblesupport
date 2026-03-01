import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authenticateZendeskCredentials,
  getZendeskAuthHeader,
  getZendeskAuthHeaderForUser,
  isZendeskConfigured,
  normalizeZendeskSubdomain,
} from '../lib/zendesk/client';

describe('zendesk client auth header', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses email/token basic auth format', () => {
    const header = getZendeskAuthHeader();
    expect(header.startsWith('Basic ')).toBe(true);
    const decoded = Buffer.from(header.replace('Basic ', ''), 'base64').toString('utf8');
    expect(decoded.includes('/token:')).toBe(true);
  });

  it('builds auth header for a provided user', () => {
    const header = getZendeskAuthHeaderForUser('agent@deckible.com', 'api-token');
    const decoded = Buffer.from(header.replace('Basic ', ''), 'base64').toString('utf8');
    expect(decoded).toBe('agent@deckible.com/token:api-token');
  });

  it('normalizes zendesk subdomain values', () => {
    expect(normalizeZendeskSubdomain('deckible')).toBe('deckible');
    expect(normalizeZendeskSubdomain('deckible.zendesk.com')).toBe('deckible');
    expect(normalizeZendeskSubdomain('https://deckible.zendesk.com')).toBe('deckible');
  });

  it('detects placeholder configuration', () => {
    expect(isZendeskConfigured()).toBe(false);
  });

  it('authenticates valid zendesk credentials', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ user: { email: 'agent@deckible.com', name: 'Deckible Agent' } }),
    })) as any);

    const user = await authenticateZendeskCredentials('agent@deckible.com', 'api-token');
    expect(user).toEqual({ email: 'agent@deckible.com', name: 'Deckible Agent' });
  });

  it('returns null when zendesk auth request throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down');
    }) as any);

    const user = await authenticateZendeskCredentials('agent@deckible.com', 'wrong-token');
    expect(user).toBeNull();
  });

  it('returns null for invalid zendesk credentials', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })) as any);

    const user = await authenticateZendeskCredentials('agent@deckible.com', 'wrong-token');
    expect(user).toBeNull();
  });
});
