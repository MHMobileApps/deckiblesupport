import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { syncTicketDetails } from '@/lib/tickets';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const details = await syncTicketDetails(params.id, true);
  return NextResponse.json(details);
}
