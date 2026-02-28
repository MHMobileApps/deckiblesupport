'use client';

import { useEffect, useMemo, useState } from 'react';

type Ticket = {
  ticketId: string;
  subject: string;
  status: string;
  requesterName: string;
  updatedAtZendesk: string;
};

type Details = {
  ticket: { id: number; subject: string; status: string };
  comments: Array<{ id: number; body: string; public: boolean; created_at: string }>;
  output: {
    summaryBullets: string[];
    category: string;
    urgency: string;
    confidence: number;
    suggestedReply: string;
  };
};

export default function TicketDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Details | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIndex = useMemo(() => tickets.findIndex((ticket) => ticket.ticketId === selectedId), [tickets, selectedId]);

  async function loadTickets() {
    setError(null);
    try {
      const res = await fetch('/api/tickets');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Unable to load tickets');
      setTickets(json.tickets ?? []);
      if (json?.needsSetup) setError(json?.error ?? 'Configure Zendesk credentials to load tickets.');
      if (!selectedId && json.tickets?.length) setSelectedId(json.tickets[0].ticketId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load tickets');
      setTickets([]);
    }
  }

  async function loadDetails(ticketId: string, currentDraft?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = currentDraft
        ? await fetch(`/api/tickets/${ticketId}/draft/regenerate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentDraft }),
          })
        : await fetch(`/api/tickets/${ticketId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Unable to load ticket details');
      setDetails(json);
      setReply(json.output?.suggestedReply ?? '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unexpected error');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetails(selectedId);
  }, [selectedId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'j' && selectedIndex < tickets.length - 1) setSelectedId(tickets[selectedIndex + 1].ticketId);
      if (event.key.toLowerCase() === 'k' && selectedIndex > 0) setSelectedId(tickets[selectedIndex - 1].ticketId);
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, tickets]);

  return (
    <div className="grid grid-cols-12 min-h-screen bg-slate-50">
      <aside className="col-span-4 border-r bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Zendesk Inbox</h1>
          <button className="rounded bg-slate-200 px-3 py-1 text-sm" onClick={() => void loadTickets()}>
            Refresh
          </button>
        </div>
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket.ticketId}
              className={`w-full rounded border p-3 text-left ${selectedId === ticket.ticketId ? 'border-blue-400 bg-blue-50' : 'bg-white'}`}
              onClick={() => setSelectedId(ticket.ticketId)}
            >
              <p className="text-xs text-slate-500">#{ticket.ticketId} · {ticket.status}</p>
              <p className="font-medium">{ticket.subject}</p>
              <p className="text-xs text-slate-500">{ticket.requesterName}</p>
            </button>
          ))}
        </div>
      </aside>

      <main className="col-span-8 p-4">
        {error && <p className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-red-700">{error}</p>}
        {!selectedId && <p>Select a ticket.</p>}
        {selectedId && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{details?.ticket.subject ?? 'Loading ticket...'}</h2>
              <button
                className="rounded bg-slate-200 px-3 py-1 text-sm"
                onClick={() => void loadDetails(selectedId, reply)}
                disabled={loading}
              >
                {loading ? 'Generating…' : 'Regenerate with ChatGPT'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <section className="rounded border bg-white p-3">
                <h3 className="mb-2 font-medium">Conversation</h3>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {(details?.comments ?? []).map((comment) => (
                    <div key={comment.id} className={`rounded p-2 ${comment.public ? 'bg-blue-50' : 'bg-amber-50'}`}>
                      <p className="text-xs text-slate-500">{comment.public ? 'Public reply' : 'Internal note'} · {comment.created_at}</p>
                      <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded border bg-white p-3">
                <h3 className="font-medium">AI Suggestion</h3>
                <p className="text-sm">Category: {details?.output.category ?? 'n/a'}</p>
                <p className="text-sm">Urgency: {details?.output.urgency ?? 'n/a'}</p>
                <p className="text-sm">Confidence: {Math.round((details?.output.confidence ?? 0) * 100)}%</p>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {(details?.output.summaryBullets ?? []).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>

                <h4 className="mt-3 font-medium">Suggested response</h4>
                <textarea className="mt-2 h-72 w-full rounded border p-2" value={reply} onChange={(event) => setReply(event.target.value)} />
                <button className="mt-2 rounded bg-slate-200 px-3 py-1 text-sm" onClick={() => navigator.clipboard.writeText(reply)}>
                  Copy response
                </button>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
