'use client';

import { useEffect, useMemo, useState } from 'react';

type Ticket = { ticketId: string; subject: string; status: string; language?: string | null; category?: string | null; urgency?: string | null; doNotSend: boolean; updatedAtZendesk: string };

export default function TicketDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [setPending, setSetPending] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [diff, setDiff] = useState('');

  const selectedIndex = useMemo(() => tickets.findIndex((t) => t.ticketId === selected), [tickets, selected]);

  async function loadTickets(sync = false) {
    const res = await fetch(`/api/tickets?status=unresolved${sync ? '&sync=true' : ''}`);
    const json = await res.json();
    setTickets(json.tickets ?? []);
    if (!selected && json.tickets?.length) setSelected(json.tickets[0].ticketId);
  }

  async function loadDetail(id: string) {
    const res = await fetch(`/api/tickets/${id}`);
    const json = await res.json();
    setDetails(json);
    setReply(json.draft?.suggestedReply ?? '');
    setNote(json.draft?.suggestedInternalNote ?? '');
  }

  useEffect(() => { void loadTickets(true); }, []);
  useEffect(() => { if (selected) void loadDetail(selected); }, [selected]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'j' && selectedIndex < tickets.length - 1) setSelected(tickets[selectedIndex + 1].ticketId);
      if (e.key.toLowerCase() === 'k' && selectedIndex > 0) setSelected(tickets[selectedIndex - 1].ticketId);
      if (e.key.toLowerCase() === 'r' && selected) void regenerate();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') setConfirmOpen(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, tickets, selected, reply]);

  async function regenerate() {
    if (!selected) return;
    const prev = reply;
    const res = await fetch(`/api/tickets/${selected}/draft/regenerate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentDraft: reply }) });
    const json = await res.json();
    setReply(json.output?.suggestedReply ?? '');
    setNote(json.output?.suggestedInternalNote ?? '');
    setDiff(`Old:\n${prev}\n\nNew:\n${json.output?.suggestedReply ?? ''}`);
    await loadDetail(selected);
  }

  async function saveDraft() {
    if (!selected) return;
    await fetch(`/api/tickets/${selected}/draft/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suggestedReply: reply, suggestedInternalNote: note, language: details?.draft?.language ?? 'en', category: details?.draft?.category ?? 'other', urgency: details?.draft?.urgency ?? 'medium', summaryBullets: JSON.parse(details?.draft?.summaryBulletsJson ?? '[]'), followUpQuestions: JSON.parse(details?.draft?.followUpQuestionsJson ?? '[]'), redFlags: JSON.parse(details?.draft?.redFlagsJson ?? '[]'), nextSteps: JSON.parse(details?.draft?.nextStepsJson ?? '[]') }) });
  }

  async function sendReply() {
    if (!selected) return;
    const res = await fetch(`/api/tickets/${selected}/send-reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ replyText: reply, setPendingAfterSend: setPending }) });
    if (res.ok) setConfirmOpen(false);
    await loadDetail(selected);
  }

  async function addNote() {
    if (!selected) return;
    await fetch(`/api/tickets/${selected}/add-note`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteText: note }) });
  }

  async function updateStatus(status: string) {
    if (!selected) return;
    await fetch(`/api/tickets/${selected}/update-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await loadTickets(false);
  }

  async function toggleDoNotSend(checked: boolean) {
    if (!selected) return;
    await fetch(`/api/tickets/${selected}/toggle-do-not-send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doNotSend: checked }) });
    await loadTickets(false);
    await loadDetail(selected);
  }

  async function snooze(hours: number) {
    if (!selected) return;
    await fetch(`/api/tickets/${selected}/toggle-do-not-send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doNotSend: details?.local?.doNotSend ?? false, snoozeHours: hours }) });
    await loadTickets(false);
  }

  return (
    <div className="grid grid-cols-12 h-screen">
      <aside className="col-span-3 border-r bg-white p-3 overflow-y-auto">
        <div className="flex gap-2 mb-2">
          <button className="text-sm bg-slate-200 px-2 py-1 rounded" onClick={() => loadTickets(true)}>Global Sync</button>
          <a className="text-sm bg-slate-200 px-2 py-1 rounded" href="/audit">Export audit CSV</a>
        </div>
        {tickets.map((t) => (
          <button key={t.ticketId} onClick={() => setSelected(t.ticketId)} className={`w-full text-left p-2 rounded mb-2 ${selected === t.ticketId ? 'bg-blue-100' : 'bg-slate-100'}`}>
            <div className="font-medium">#{t.ticketId} {t.subject}</div>
            <div className="text-xs">{t.status} • {t.category ?? 'uncategorized'} • {t.urgency ?? 'n/a'}</div>
          </button>
        ))}
      </aside>
      <main className="col-span-9 p-4 overflow-y-auto">
        {details && (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{details.ticket.subject}</h2>
                <p className="text-sm">Requester: {details.local?.requesterName || 'Unknown'} ({details.local?.requesterEmail || 'Unknown'})</p>
                <p className="text-sm">Language: <span className="px-2 py-1 bg-indigo-100 rounded">{details.draft?.language || details.local?.language || 'Unknown'}</span></p>
              </div>
              <button
                className="bg-slate-200 px-3 py-1 rounded"
                onClick={async () => {
                  await fetch(`/api/tickets/${selected}/sync`, { method: 'POST' });
                  if (selected) {
                    await loadDetail(selected);
                  }
                }}
              >
                Refresh
              </button>
            </div>

            <div className="mt-3 p-3 bg-white rounded border">
              <h3 className="font-medium mb-2">Conversation</h3>
              <div className="space-y-2">
                {(details.comments ?? []).map((c: any) => (
                  <div key={c.id} className={`p-2 rounded ${c.public ? 'bg-blue-50' : 'bg-amber-50'}`}>
                    <div className="text-xs">{c.public ? 'Public' : 'Internal'} • {c.created_at}</div>
                    <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white border rounded p-3">
                <h3 className="font-medium">AI Summary</h3>
                <p className="text-sm">Category: {details.draft?.category ?? 'n/a'}</p>
                <p className="text-sm">Urgency: {details.draft?.urgency ?? 'n/a'}</p>
                <p className="text-sm">Confidence:</p>
                <div className="w-full bg-slate-200 rounded h-2"><div className="h-2 bg-green-500 rounded" style={{ width: `${Math.round((details.draft?.confidence ?? 0) * 100)}%` }} /></div>
                {JSON.parse(details.draft?.redFlagsJson ?? '[]').length > 0 && (
                  <div className="mt-2 bg-red-50 border border-red-200 p-2 rounded text-sm">
                    <strong>Red flags:</strong> {JSON.parse(details.draft?.redFlagsJson ?? '[]').join(', ')}
                  </div>
                )}
                <ul className="list-disc pl-5 mt-2 text-sm">
                  {JSON.parse(details.draft?.summaryBulletsJson ?? '[]').map((b: string) => <li key={b}>{b}</li>)}
                </ul>
              </div>
              <div className="bg-white border rounded p-3">
                <h3 className="font-medium">Draft Diff</h3>
                <pre className="text-xs whitespace-pre-wrap">{diff || 'Regenerate to compare changes.'}</pre>
              </div>
            </div>

            <div className="mt-3 bg-white border rounded p-3">
              <div className="flex justify-between">
                <h3 className="font-medium">Suggested Reply (editable)</h3>
                <button className="text-sm bg-slate-200 px-2 py-1 rounded" onClick={() => navigator.clipboard.writeText(reply)}>One click copy</button>
              </div>
              <textarea className="w-full border p-2 mt-2 h-44" value={reply} onChange={(e) => setReply(e.target.value)} />

              <h3 className="font-medium mt-3">Suggested Internal Note (English)</h3>
              <textarea className="w-full border p-2 mt-2 h-24" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="mt-2 text-sm bg-slate-200 px-2 py-1 rounded" onClick={() => setNote(JSON.parse(details.draft?.summaryBulletsJson ?? '[]').join('\n- '))}>Create internal note from summary</button>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="bg-slate-200 px-3 py-2 rounded" onClick={regenerate}>Regenerate Draft (R)</button>
                <button className="bg-slate-200 px-3 py-2 rounded" onClick={saveDraft}>Save Draft</button>
                <button className="bg-emerald-600 text-white px-3 py-2 rounded" onClick={() => setConfirmOpen(true)} disabled={details.local?.doNotSend}>Approve and Send Reply</button>
                <button className="bg-slate-200 px-3 py-2 rounded" onClick={addNote}>Add Internal Note</button>
                <button className="bg-slate-200 px-3 py-2 rounded" onClick={() => updateStatus('open')}>Set Open</button>
                <button className="bg-slate-200 px-3 py-2 rounded" onClick={() => updateStatus('pending')}>Set Pending</button>
                <button className="bg-slate-200 px-3 py-2 rounded" onClick={() => updateStatus('solved')}>Set Solved</button>
                <button className="bg-slate-200 px-3 py-2 rounded" onClick={() => snooze(4)}>Snooze 4h</button>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={details.local?.doNotSend ?? false} onChange={(e) => toggleDoNotSend(e.target.checked)} /> Do Not Send
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={setPending} onChange={(e) => setSetPending(e.target.checked)} /> Set to pending after send
                </label>
              </div>
            </div>
          </>
        )}
      </main>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-full max-w-xl p-4 rounded">
            <h3 className="font-semibold">Confirm Send</h3>
            <p className="text-sm mb-2">Final reply preview:</p>
            <pre className="text-sm whitespace-pre-wrap bg-slate-100 p-2 rounded max-h-60 overflow-y-auto">{reply}</pre>
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} /> I confirm this is ready to send
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-3 py-1 bg-slate-200 rounded" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="px-3 py-1 bg-emerald-600 text-white rounded disabled:opacity-60" disabled={!confirmChecked} onClick={sendReply}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
