import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { prisma } from '@/lib/prisma';
import { regenerateDraft } from '@/lib/tickets';
import { sha256 } from '@/lib/security/hash';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => ({}));

  const result = await regenerateDraft(params.id, body.currentDraft);
  await prisma.ticketCache.update({ where: { ticketId: params.id }, data: { language: result.output.language, category: result.output.category, urgency: result.output.urgency } });

  await prisma.auditLog.create({
    data: {
      ticketId: params.id,
      adminUserId: auth.userId,
      actionType: 'regenerate_draft',
      contentHash: sha256(result.output.suggestedReply),
      success: true,
    }
  });

  return NextResponse.json(result);
}
