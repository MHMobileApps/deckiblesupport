import { prisma } from '@/lib/prisma';
import * as zendesk from '@/lib/zendesk/client';
import { generateDraft } from '@/lib/llm/draft-engine';
import { blockedDomains } from '@/lib/env';
import { containsSecretPatterns } from '@/lib/security/redaction';

export async function syncUnresolvedTickets(cursor?: string) {
  const page = await zendesk.listUnresolvedTickets(cursor);
  for (const item of page.results ?? []) {
    await prisma.ticketCache.upsert({
      where: { ticketId: String(item.id) },
      create: {
        ticketId: String(item.id),
        subject: item.subject ?? '',
        status: item.status ?? 'open',
        requesterId: String(item.requester_id ?? ''),
        requesterEmail: item.via?.source?.from?.address ?? '',
        requesterName: item.requester?.name ?? 'Unknown',
        updatedAtZendesk: new Date(item.updated_at),
        updatedAtLocal: new Date(),
        rawMetadataJson: JSON.stringify(item),
      },
      update: {
        subject: item.subject ?? '',
        status: item.status ?? 'open',
        updatedAtZendesk: new Date(item.updated_at),
        updatedAtLocal: new Date(),
        rawMetadataJson: JSON.stringify(item),
      }
    });
  }
  return page;
}

export async function syncTicketDetails(ticketId: string, force = false) {
  const cache = await prisma.ticketCache.findUnique({ where: { ticketId } });
  const remote = await zendesk.getTicket(Number(ticketId));
  const updatedAtZendesk = new Date(remote.ticket.updated_at);

  let comments: any[] = [];
  if (force || !cache?.lastCommentsFetchedAt || updatedAtZendesk > cache.lastCommentsFetchedAt) {
    comments = (await zendesk.getTicketComments(Number(ticketId))).comments;
  }

  await prisma.ticketCache.upsert({
    where: { ticketId },
    create: {
      ticketId,
      subject: remote.ticket.subject,
      status: remote.ticket.status,
      requesterId: String(remote.ticket.requester_id ?? ''),
      requesterEmail: '',
      requesterName: '',
      updatedAtZendesk,
      updatedAtLocal: new Date(),
      lastCommentsFetchedAt: comments.length ? new Date() : cache?.lastCommentsFetchedAt,
      rawMetadataJson: JSON.stringify(remote.ticket),
    },
    update: {
      subject: remote.ticket.subject,
      status: remote.ticket.status,
      updatedAtZendesk,
      updatedAtLocal: new Date(),
      lastCommentsFetchedAt: comments.length ? new Date() : cache?.lastCommentsFetchedAt,
      rawMetadataJson: JSON.stringify(remote.ticket),
    }
  });

  return { ticket: remote.ticket, comments };
}

export async function regenerateDraft(ticketId: string, currentDraft?: string) {
  const details = await syncTicketDetails(ticketId, false);
  const output = await generateDraft({ ticket: details.ticket, comments: details.comments.slice(-8) }, currentDraft);
  const latest = await prisma.draft.findFirst({ where: { ticketId }, orderBy: { version: 'desc' } });
  const version = (latest?.version ?? 0) + 1;

  const draft = await prisma.draft.create({
    data: {
      ticketId,
      version,
      model: process.env.LLM_MODEL ?? 'unknown',
      promptVersion: 'v1',
      language: output.language,
      summaryBulletsJson: JSON.stringify(output.summaryBullets),
      category: output.category,
      urgency: output.urgency,
      suggestedReply: output.suggestedReply,
      suggestedInternalNote: output.suggestedInternalNote,
      followUpQuestionsJson: JSON.stringify(output.followUpQuestions),
      confidence: output.confidence,
      redFlagsJson: JSON.stringify(output.redFlags),
      nextStepsJson: JSON.stringify(output.nextSteps),
    }
  });

  return { draft, output, details };
}

export function preflightCanSend(ticket: { doNotSend: boolean; status: string; requesterEmail: string }, reply: string) {
  if (ticket.doNotSend) return { ok: false, reason: 'do_not_send_enabled' };
  if (ticket.status === 'solved' || ticket.status === 'closed') return { ok: false, reason: 'ticket_not_unresolved' };
  if (!reply || reply.length < 20 || reply.length > 8000) return { ok: false, reason: 'invalid_reply_length' };
  if (containsSecretPatterns(reply)) return { ok: false, reason: 'secret_pattern_detected' };
  const domain = ticket.requesterEmail.split('@')[1]?.toLowerCase();
  if (domain && blockedDomains.includes(domain)) return { ok: false, reason: 'blocked_email_domain' };
  return { ok: true as const };
}
