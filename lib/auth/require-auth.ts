import { NextRequest } from 'next/server';
import { verifySession } from './session';

export function requireAuth(req: NextRequest) {
  const cookie = req.cookies.get('deckible_session')?.value;
  const session = verifySession(cookie);
  if (!session) {
    return { ok: false as const, response: new Response('Unauthorized', { status: 401 }) };
  }
  return { ok: true as const, userId: session.userId };
}
