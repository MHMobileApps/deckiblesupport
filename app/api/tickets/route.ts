import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { listUnresolvedTickets } from '@/lib/tickets';
import { ZendeskConfigurationError } from '@/lib/zendesk/client';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined;
    const data = await listUnresolvedTickets(cursor);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ZendeskConfigurationError) {
      return NextResponse.json({
        tickets: [],
        nextPage: null,
        needsSetup: true,
        error: error.message,
      });
    }

    const message = error instanceof Error ? error.message : 'Unable to load tickets from Zendesk';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
