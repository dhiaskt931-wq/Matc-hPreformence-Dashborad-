// eslint-disable-next-line react-refresh/only-export-components
export const DATA_SOURCES = {
  STATSBOMB: 'statsbomb',
  UNDERSTAT: 'understat',
  ESPN: 'espn',
  FDO: 'football-data',
};

function Spinner() {
  return (
    <div style={{
      padding: 72, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 16,
    }}>
      <div style={{ position: 'relative', width: 40, height: 40 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none"
          style={{ animation: 'spin 0.9s linear infinite' }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="20" cy="20" r="17" stroke="rgba(96,165,250,0.12)" strokeWidth="3" />
          <path d="M20 3a17 17 0 0 1 17 17" stroke="var(--arg)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading data…</span>
    </div>
  );
}

export function EventDataRequired({ source = 'understat' }) {
  return (
    <div style={{
      padding: 64, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 16, textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'rgba(251,191,36,0.08)',
        border: '1px solid rgba(251,191,36,0.20)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <div>
        <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15, margin: 0 }}>
          Full Event Data Required
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, maxWidth: 380, margin: '8px auto 0', lineHeight: 1.6 }}>
          This feature needs pass-by-pass tracking with x/y pitch coordinates.
          The current match uses <strong style={{ color: 'var(--gold)' }}>{source}</strong> data
          which provides shot-level information only.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>
          Switch to a <strong style={{ color: 'var(--arg)' }}>StatsBomb</strong> match for full analysis.
        </p>
      </div>
    </div>
  );
}

export default function PageShell({ loading, error, children }) {
  if (loading) return <Spinner />;

  if (error) return (
    <div style={{
      padding: 72, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--fra-dim)',
        border: '1px solid rgba(248,113,113,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="var(--fra)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>Failed to load</p>
      <p style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', maxWidth: 340 }}>{error}</p>
    </div>
  );

  return children;
}
