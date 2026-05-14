const RANK_STYLE = [
  { background: 'var(--gold)',   color: '#0a0d12' },
  { background: 'var(--silver)', color: '#0a0d12' },
  { background: 'var(--bronze)', color: '#0a0d12' },
];

export default function TopPlayers({ players, color, title }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
        paddingBottom: 12, borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ width: 3, height: 14, background: color, borderRadius: 99 }} />
        <span className="label">{title}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {players.map((p, i) => (
          <div key={p.player} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 5, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 11,
              ...(RANK_STYLE[i] ?? { background: 'var(--border)', color: 'var(--muted)' }),
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: 'var(--text)', fontWeight: 600, fontSize: 12.5,
                marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {p.player}
              </div>
              <div style={{ color, fontSize: 11, opacity: 0.85 }}>
                xG {p.xg.toFixed(2)}&ensp;G {p.goals}&ensp;A {p.assists}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
