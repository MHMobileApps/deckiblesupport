import { env } from '@/lib/env';
import { log } from '@/lib/logger';

type ZendeskResponse<T> = T & { next_page?: string | null };

const baseUrl = `https://${env.ZENDESK_SUBDOMAIN}.zendesk.com`;
const basic = Buffer.from(`${env.ZENDESK_EMAIL}/token:${env.ZENDESK_API_TOKEN}`).toString('base64');

export function getZendeskAuthHeader() {
  return `Basic ${basic}`;
}

const queue: Array<() => Promise<void>> = [];
let active = 0;
const MAX_CONCURRENT = 3;

function schedule<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      try {
        active += 1;
        resolve(await fn());
      } catch (e) {
        reject(e);
      } finally {
        active -= 1;
        runNext();
      }
    });
    runNext();
  });
}

function runNext() {
  while (active < MAX_CONCURRENT && queue.length) {
    const task = queue.shift();
    if (task) void task();
  }
}

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function request<T>(path: string, init?: RequestInit, attempt = 0): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getZendeskAuthHeader(),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    const retryAfter = Number(res.headers.get('retry-after') ?? 0);
    const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * (2 ** attempt);
    await wait(delay);
    return request(path, init, attempt + 1);
  }

  if (!res.ok) {
    const body = await res.text();
    log('error', 'Zendesk request failed', { status: res.status, path, body: body.slice(0, 200) });
    throw new Error(`Zendesk error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function listUnresolvedTickets(cursor?: string) {
  const query = cursor
    ? cursor.replace(baseUrl, '')
    : `/api/v2/search.json?query=${encodeURIComponent('type:ticket status<solved order_by:updated_at sort:desc')}`;
  return schedule(() => request<ZendeskResponse<{ results: any[] }>>(query));
}

export async function getTicket(ticketId: number) {
  return schedule(() => request<{ ticket: any }>(`/api/v2/tickets/${ticketId}.json`));
}

export async function getTicketComments(ticketId: number) {
  return schedule(() => request<{ comments: any[] }>(`/api/v2/tickets/${ticketId}/comments.json`));
}

export async function addPublicReply(ticketId: number, bodyText: string) {
  return schedule(() => request<{ ticket: any }>(`/api/v2/tickets/${ticketId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ ticket: { comment: { body: bodyText, public: true } } })
  }));
}

export async function addInternalNote(ticketId: number, bodyText: string) {
  return schedule(() => request<{ ticket: any }>(`/api/v2/tickets/${ticketId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ ticket: { comment: { body: bodyText, public: false } } })
  }));
}

export async function updateTicketStatus(ticketId: number, status: 'open' | 'pending' | 'solved') {
  return schedule(() => request<{ ticket: any }>(`/api/v2/tickets/${ticketId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ ticket: { status } })
  }));
}

export async function listTicketFields() {
  return schedule(() => request<{ ticket_fields: any[] }>(`/api/v2/ticket_fields.json`));
}

export async function getUser(userId: number) {
  return schedule(() => request<{ user: any }>(`/api/v2/users/${userId}.json`));
}
