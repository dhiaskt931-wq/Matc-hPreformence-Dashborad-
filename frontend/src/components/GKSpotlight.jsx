function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 12px', borderRadius: 8,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--border)',
      minWidth: 60, flex: 1,
      transition: 'background var(--transition)',
    }}>
      <span style={{ color, fontWeight: 800, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{label}</span>
    </div>
  );
}

export default function GKSpotlight({ goalkeepers, team1, team2 }) {
  const gk1 = goalkeepers?.find(g => g.team === team1);
  const gk2 = goalkeepers?.find(g => g.team === team2);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <span className="label">GK Spotlight</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[{ gk: gk1, color: 'var(--arg)' }, { gk: gk2, color: 'var(--fra)' }].map(({ gk, color }, i) => {
          if (!gk) return null;
          const prevented = gk.psxgPrevented ?? 0;
          return (
            <div key={gk.player}>
              {i === 1 && <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 4, height: 16, background: color,
                    borderRadius: 99, flexShrink: 0,
                    boxShadow: `0 0 8px ${color}66`,
                  }} />
                  <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em' }}>
                    {gk.player}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <StatPill label="Saves"    value={gk.saves}    color={color} />
                  <StatPill label="Conceded" value={gk.conceded} color="var(--text-dim)" />
                  <StatPill
                    label="PSxG +"
                    value={`${prevented >= 0 ? '+' : ''}${prevented.toFixed(2)}`}
                    color={prevented >= 0 ? 'var(--green)' : 'var(--fra)'}
                  />
                </div>
                {gk.penaltiesSaved > 0 && (
                  <div style={{
                    marginTop: 8, fontSize: 11, color: 'var(--text-dim)',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '5px 10px', display: 'inline-block',
                  }}>
                    Shootout saves: <span style={{ color, fontWeight: 700 }}>{gk.penaltiesSaved}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
