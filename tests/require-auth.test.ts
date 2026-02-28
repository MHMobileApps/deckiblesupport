import crypto from 'crypto';
import { describe, expect, it } from 'vitest';
import { requireAuth } from '../lib/auth/require-auth';

function sign(payload: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

describe('requireAuth', () => {
  it('returns unauthorized when cookie is missing', () => {
    const req = {
      cookies: { get: () => undefined },
    } as any;

    const result = requireAuth(req);
    expect(result.ok).toBe(false);
  });

  it('accepts a valid signed cookie', () => {
    const secret = process.env.SESSION_SECRET ?? 'change-this-in-production';
    const payload = 'admin@local.1700000000000';
    const cookie = `${payload}.${sign(payload, secret)}`;

    const req = {
      cookies: { get: () => ({ value: cookie }) },
    } as any;

    const result = requireAuth(req);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.userId).toBe('admin@local');
  });
});
