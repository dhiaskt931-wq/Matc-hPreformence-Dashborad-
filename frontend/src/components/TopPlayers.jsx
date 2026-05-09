const BADGE_COLORS = ['var(--gold)', 'var(--silver)', 'var(--bronze)'];

export default function TopPlayers({ players, color, title }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 8, marginBottom: 14 }}>
        <span className="label">{title}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {players.map((p, i) => (
          <div key={p.player} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 5,
              background: BADGE_COLORS[i],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12, color: '#0d1117', flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div>
              <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                {p.player}
              </div>
              <div style={{ color, fontSize: 11 }}>
                xG {p.xg.toFixed(2)}&nbsp;&nbsp;G {p.goals}&nbsp;&nbsp;A {p.assists}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
