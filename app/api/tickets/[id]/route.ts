import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { prisma } from '@/lib/prisma';
import { syncTicketDetails } from '@/lib/tickets';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const local = await prisma.ticketCache.findUnique({ where: { ticketId: params.id } });
  const details = await syncTicketDetails(params.id, false);
  const draft = await prisma.draft.findFirst({ where: { ticketId: params.id }, orderBy: { version: 'desc' } });

  return NextResponse.json({ local, ...details, draft });
}
