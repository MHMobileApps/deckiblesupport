import { describe, expect, it } from 'vitest';
import { mapZendeskTicket } from '../lib/tickets';

describe('ticket mapping', () => {
  it('maps core fields from zendesk result', () => {
    const mapped = mapZendeskTicket({
      id: 123,
      subject: 'Need help',
      status: 'open',
      updated_at: '2024-01-01T00:00:00Z',
      requester: { name: 'Jane' },
    });

    expect(mapped).toEqual({
      ticketId: '123',
      subject: 'Need help',
      status: 'open',
      updatedAtZendesk: '2024-01-01T00:00:00Z',
      requesterName: 'Jane',
    });
  });
});
