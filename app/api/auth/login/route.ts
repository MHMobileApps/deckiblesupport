import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { loginRateLimit } from '@/lib/auth/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (!loginRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const body = await req.json();
  const { email, password } = body;
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
