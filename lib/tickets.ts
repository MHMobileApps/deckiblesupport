import * as zendesk from '@/lib/zendesk/client';
import { generateDraft } from '@/lib/llm/draft-engine';

export type SimpleTicket = {
  ticketId: string;
  subject: string;
  status: string;
  updatedAtZendesk: string;
  requesterName: string;
};

export function mapZendeskTicket(item: any): SimpleTicket {
  return {
    ticketId: String(item.id),
    subject: item.subject ?? '(no subject)',
    status: item.status ?? 'open',
    updatedAtZendesk: item.updated_at ?? new Date().toISOString(),
    requesterName: item.requester?.name ?? 'Unknown requester',
  };
}

export async function listUnresolvedTickets(cursor?: string) {
  const page = await zendesk.listUnresolvedTickets(cursor);
  return {
    tickets: (page.results ?? []).map(mapZendeskTicket),
    nextPage: page.next_page ?? null,
  };
}

export async function getTicketWithDraft(ticketId: string, currentDraft?: string) {
  const [{ ticket }, { comments }] = await Promise.all([
    zendesk.getTicket(Number(ticketId)),
    zendesk.getTicketComments(Number(ticketId)),
  ]);

  const output = await generateDraft(
    {
      ticket,
      comments: comments.slice(-12),
    },
    currentDraft,
  );

  return { ticket, comments, output };
}
