import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { loginRateLimit } from '@/lib/auth/rate-limit';
import { authenticateZendeskCredentials } from '@/lib/zendesk/client';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (!loginRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '').trim();

  if (!email || !password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const zendeskUser = await authenticateZendeskCredentials(email, password);

  if (!zendeskUser) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  await createSession(zendeskUser.email.toLowerCase());
  return NextResponse.json({ ok: true, user: zendeskUser });
}
