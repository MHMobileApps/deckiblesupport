import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const from = new Date(req.nextUrl.searchParams.get('from') ?? Date.now() - 30 * 24 * 3600_000);
  const to = new Date(req.nextUrl.searchParams.get('to') ?? Date.now());

  const logs = await prisma.auditLog.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: 'desc' },
  });

  const csv = ['ticketId,adminUserId,timestamp,actionType,contentHash,success,errorMessage'];
  for (const l of logs) {
    csv.push([l.ticketId, l.adminUserId, l.createdAt.toISOString(), l.actionType, l.contentHash, l.success, l.errorMessage ?? ''].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','));
  }

  return new NextResponse(csv.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="audit.csv"',
    }
  });
}
