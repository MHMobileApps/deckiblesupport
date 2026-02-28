import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { loginRateLimit } from '@/lib/auth/rate-limit';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (!loginRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '');
  const password = String(body.password ?? '');
  const validEmail = email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
  const validPassword = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);

  if (!validEmail || !validPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  await createSession(env.ADMIN_EMAIL);
  return NextResponse.json({ ok: true });
}
