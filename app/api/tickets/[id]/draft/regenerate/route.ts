import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { getTicketWithDraft } from '@/lib/tickets';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));

  try {
    const data = await getTicketWithDraft(params.id, body.currentDraft);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to regenerate draft';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
