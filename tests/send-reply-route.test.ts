import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/tickets/[id]/send-reply/route';
import { preflightCanSend } from '../lib/tickets';

describe('send reply route guard', () => {
  it('requires auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/tickets/1/send-reply', { method: 'POST', body: JSON.stringify({ replyText: 'hello world this is long enough' }) });
    const res = await POST(req, { params: { id: '1' } });
    expect(res.status).toBe(401);
  });

  it('blocks doNotSend tickets in preflight', () => {
    const check = preflightCanSend({ doNotSend: true, status: 'open', requesterEmail: 'x@example.com' }, 'hello this is a sufficiently long response body');
    expect(check.ok).toBe(false);
  });
});
