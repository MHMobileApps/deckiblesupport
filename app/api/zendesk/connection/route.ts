import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { testZendeskConnection } from '@/lib/zendesk/client';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const user = await testZendeskConnection();
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Zendesk API error';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
