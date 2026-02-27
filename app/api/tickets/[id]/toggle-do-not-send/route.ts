import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const body = await req.json();
  const updated = await prisma.ticketCache.update({
    where: { ticketId: params.id },
    data: { doNotSend: Boolean(body.doNotSend), snoozedUntil: body.snoozeHours ? new Date(Date.now() + Number(body.snoozeHours) * 3600000) : undefined }
  });
  return NextResponse.json({ ticket: updated });
}
