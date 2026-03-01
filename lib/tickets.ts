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
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        tags: ticket.tags,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
      },
      comments: comments.slice(-12).map((comment) => ({
        id: comment.id,
        public: comment.public,
        created_at: comment.created_at,
        body: comment.body,
      })),
    },
    currentDraft,
  );

  return { ticket, comments, output };
}
