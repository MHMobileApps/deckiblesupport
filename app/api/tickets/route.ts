import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/require-auth';
import { syncUnresolvedTickets } from '@/lib/tickets';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined;
  const sync = req.nextUrl.searchParams.get('sync') === 'true';
  if (sync) {
    try {
      await syncUnresolvedTickets(cursor);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Zendesk sync error';
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const status = req.nextUrl.searchParams.get('status');
  const q = req.nextUrl.searchParams.get('q') ?? '';

  const tickets = await prisma.ticketCache.findMany({
    where: {
      ...(status === 'unresolved' ? { status: { in: ['new', 'open', 'pending'] } } : {}),
      ...(q ? { subject: { contains: q, mode: 'insensitive' } } : {}),
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lt: new Date() } }]
    },
    orderBy: { updatedAtZendesk: 'desc' },
    take: 200,
  });

  return NextResponse.json({ tickets });
}
