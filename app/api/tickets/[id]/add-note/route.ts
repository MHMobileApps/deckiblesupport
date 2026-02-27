import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { addInternalNote } from '@/lib/zendesk/client';
import { prisma } from '@/lib/prisma';
import { sha256 } from '@/lib/security/hash';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const body = await req.json();
  const res = await addInternalNote(Number(params.id), body.noteText);

  await prisma.auditLog.create({
    data: {
      ticketId: params.id,
      adminUserId: auth.userId,
      actionType: 'add_internal_note',
      contentHash: sha256(body.noteText),
      zendeskResultJson: JSON.stringify(res),
      success: true,
    }
  });

  return NextResponse.json({ ok: true });
}
