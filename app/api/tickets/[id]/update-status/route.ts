import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { updateTicketStatus } from '@/lib/zendesk/client';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { status } = await req.json();
  const res = await updateTicketStatus(Number(params.id), status);
  return NextResponse.json({ ok: true, res });
}
