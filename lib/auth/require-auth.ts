import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: Response };

export function requireAuth(req: NextRequest): AuthResult {
  const raw = req.cookies.get('deckible_session')?.value;
  const session = verifySession(raw);

  if (!session?.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true as const, userId: session.userId };
}
