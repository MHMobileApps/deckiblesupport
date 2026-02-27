import crypto from 'crypto';
import { cookies } from 'next/headers';
import { env } from '../env';

const COOKIE_NAME = 'deckible_session';

function sign(payload: string) {
  return crypto.createHmac('sha256', env.SESSION_SECRET).update(payload).digest('hex');
}

export async function createSession(userId: string) {
  const payload = `${userId}.${Date.now()}`;
  const signature = sign(payload);
  cookies().set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24
  });
}

export async function destroySession() {
  cookies().delete(COOKIE_NAME);
}

export function verifySession(raw?: string) {
  if (!raw) return null;
  const [userId, ts, sig] = raw.split('.');
  if (!userId || !ts || !sig) return null;
  const payload = `${userId}.${ts}`;
  if (sign(payload) !== sig) return null;
  return { userId };
}

export function getSessionFromCookies() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  return verifySession(raw);
}
