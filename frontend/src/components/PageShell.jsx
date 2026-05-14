function Spinner() {
  return (
    <div style={{ padding: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--arg)"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: 'spin 0.9s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span style={{ color: 'var(--muted)', fontSize: 12 }}>Loading data…</span>
    </div>
  );
}

export default function PageShell({ loading, error, children }) {
  if (loading) return <Spinner />;

  if (error) return (
    <div style={{ padding: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'var(--fra-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--fra)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>Failed to load</p>
      <p style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', maxWidth: 320 }}>{error}</p>
    </div>
  );

  return children;
}
