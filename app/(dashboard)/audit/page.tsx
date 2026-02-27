export default function AuditPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Audit Export</h1>
      <p className="text-sm mb-4">Download the last 30 days of audit logs as CSV.</p>
      <a className="bg-blue-600 text-white px-4 py-2 rounded" href="/api/audit">Download CSV</a>
    </main>
  );
}
