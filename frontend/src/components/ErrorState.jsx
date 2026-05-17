export default function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      padding: '32px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      textAlign: 'center',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--fra-dim)',
        border: '1px solid rgba(248,113,113,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="var(--fra)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <div>
        <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, marginBottom: 6 }}>
          Couldn&apos;t load this section
        </p>
        <details style={{ cursor: 'pointer' }}>
          <summary style={{ fontSize: 12, color: 'var(--text-dim)', listStyle: 'none', userSelect: 'none' }}>
            Show details
          </summary>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontFamily: 'monospace' }}>
            {message}
          </p>
        </details>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn"
          style={{ marginTop: 4 }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
