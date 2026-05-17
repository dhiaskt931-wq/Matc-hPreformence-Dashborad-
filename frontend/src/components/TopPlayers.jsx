const BADGES = [
  { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0a0d12' },
  { bg: 'linear-gradient(135deg, #94a3b8, #64748b)', color: '#0a0d12' },
  { bg: 'linear-gradient(135deg, #c07850, #a0522d)', color: '#f1f5f9' },
];

export default function TopPlayers({ players, color, title, teamName }) {
  const shortName = teamName?.slice(0, 3).toUpperCase();
  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)',
      }}>
        <span className="label">{title}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          color, background: `${color}18`,
          border: `1px solid ${color}30`,
          padding: '2px 8px', borderRadius: 99,
        }}>
          {shortName}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {players.map((p, i) => (
          <div key={p.player} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            transition: 'background var(--transition)',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 11,
              background: BADGES[i]?.bg ?? 'rgba(255,255,255,0.08)',
              color: BADGES[i]?.color ?? 'var(--text-dim)',
              boxShadow: i === 0 ? '0 0 10px rgba(251,191,36,0.3)' : 'none',
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: 'var(--text)', fontWeight: 600, fontSize: 12.5,
                marginBottom: 3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {p.player}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>
                  xG <strong style={{ color }}>{p.xg.toFixed(2)}</strong>
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>
                  G <strong style={{ color }}>{p.goals}</strong>
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>
                  A <strong style={{ color }}>{p.assists}</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
