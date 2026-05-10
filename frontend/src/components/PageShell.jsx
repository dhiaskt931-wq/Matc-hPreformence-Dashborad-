export default function PageShell({ loading, error, children }) {
  if (loading) return (
    <div style={{ padding: 40, color: 'var(--muted)', textAlign: 'center' }}>Loading…</div>
  );
  if (error) return (
    <div style={{ padding: 40, color: 'var(--fra)', textAlign: 'center' }}>
      <p style={{ fontWeight: 700, marginBottom: 6 }}>Failed to load</p>
      <p style={{ color: 'var(--muted)', fontSize: 12 }}>{error}</p>
    </div>
  );
  return children;
}
