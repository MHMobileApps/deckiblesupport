import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { getTicketWithDraft } from '@/lib/tickets';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const data = await getTicketWithDraft(params.id);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load ticket details';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
