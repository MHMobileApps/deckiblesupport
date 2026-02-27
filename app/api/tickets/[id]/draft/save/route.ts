import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { prisma } from '@/lib/prisma';
import { sha256 } from '@/lib/security/hash';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const latest = await prisma.draft.findFirst({ where: { ticketId: params.id }, orderBy: { version: 'desc' } });
  const version = (latest?.version ?? 0) + 1;

  const draft = await prisma.draft.create({
    data: {
      ticketId: params.id,
      version,
      model: body.model ?? 'manual',
      promptVersion: 'v1',
      language: body.language ?? 'en',
      summaryBulletsJson: JSON.stringify(body.summaryBullets ?? []),
      category: body.category ?? 'other',
      urgency: body.urgency ?? 'medium',
      confidence: body.confidence ?? 0.5,
      suggestedReply: body.suggestedReply ?? '',
      suggestedInternalNote: body.suggestedInternalNote ?? '',
      followUpQuestionsJson: JSON.stringify(body.followUpQuestions ?? []),
      redFlagsJson: JSON.stringify(body.redFlags ?? []),
      nextStepsJson: JSON.stringify(body.nextSteps ?? []),
    }
  });

  await prisma.auditLog.create({
    data: {
      ticketId: params.id,
      adminUserId: auth.userId,
      actionType: 'save_draft',
      contentHash: sha256(draft.suggestedReply),
      success: true,
    }
  });

  return NextResponse.json({ draft });
}
