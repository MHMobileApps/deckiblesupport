import { NextRequest } from 'next/server';

const AUTH_BYPASSED_USER_ID = 'auth-disabled-local-user';

type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: Response };

export function requireAuth(_req: NextRequest): AuthResult {
  // Temporary bypass requested for preview/testing environments.
  return { ok: true as const, userId: AUTH_BYPASSED_USER_ID };
}
