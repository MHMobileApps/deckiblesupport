import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { prisma } from '@/lib/prisma';
import { addPublicReply, updateTicketStatus } from '@/lib/zendesk/client';
import { preflightCanSend } from '@/lib/tickets';
import { sha256 } from '@/lib/security/hash';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const cache = await prisma.ticketCache.findUnique({ where: { ticketId: params.id } });
  if (!cache) return NextResponse.json({ error: 'ticket_not_cached' }, { status: 404 });

  const body = await req.json();
  const check = preflightCanSend(cache, body.replyText ?? '');
  if (!check.ok) {
    await prisma.auditLog.create({
      data: {
        ticketId: params.id,
        adminUserId: auth.userId,
        actionType: 'send_reply_blocked',
        contentHash: sha256(body.replyText ?? ''),
        success: false,
        errorMessage: check.reason,
      }
    });
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  try {
    const res = await addPublicReply(Number(params.id), body.replyText);
    if (body.setPendingAfterSend) {
      await updateTicketStatus(Number(params.id), 'pending');
    }

    await prisma.auditLog.create({
      data: {
        ticketId: params.id,
        adminUserId: auth.userId,
        actionType: 'send_reply',
        contentHash: sha256(body.replyText),
        zendeskResultJson: JSON.stringify(res),
        success: true,
      }
    });

    return NextResponse.json({ ok: true, result: res });
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        ticketId: params.id,
        adminUserId: auth.userId,
        actionType: 'send_reply',
        contentHash: sha256(body.replyText ?? ''),
        success: false,
        errorMessage: error instanceof Error ? error.message : 'unknown_error',
      }
    });
    return NextResponse.json({ error: 'send_failed' }, { status: 500 });
  }
}
