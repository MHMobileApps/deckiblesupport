import { NextRequest } from 'next/server';

const AUTH_BYPASSED_USER_ID = 'auth-disabled-local-user';

export function requireAuth(_req: NextRequest) {
  // Temporary bypass requested for preview/testing environments.
  return { ok: true as const, userId: AUTH_BYPASSED_USER_ID };
}
