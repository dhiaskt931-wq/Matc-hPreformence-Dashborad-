function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '6px 10px', borderRadius: 6,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border)',
      minWidth: 56,
    }}>
      <span style={{ color, fontWeight: 700, fontSize: 14 }}>{value}</span>
      <span style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</span>
    </div>
  );
}

export default function GKSpotlight({ goalkeepers, team1, team2 }) {
  const gk1 = goalkeepers?.find(g => g.team === team1);
  const gk2 = goalkeepers?.find(g => g.team === team2);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="label" style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        GK Spotlight
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[{ gk: gk1, color: 'var(--arg)' }, { gk: gk2, color: 'var(--fra)' }].map(({ gk, color }, i) => {
          if (!gk) return null;
          return (
            <div key={gk.player}>
              {i === 1 && <div className="divider" />}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 3, height: 14, background: color, borderRadius: 99 }} />
                  <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>{gk.player}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <StatPill label="Saves"    value={gk.saves}    color={color} />
                  <StatPill label="Conceded" value={gk.conceded} color="var(--muted)" />
                  <StatPill
                    label="PSxG Prevented"
                    value={`${gk.psxgPrevented >= 0 ? '+' : ''}${gk.psxgPrevented.toFixed(2)}`}
                    color={gk.psxgPrevented >= 0 ? 'var(--success)' : 'var(--fra)'}
                  />
                </div>
                {gk.penaltiesSaved > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                    Shootout saves: <span style={{ color }}>{gk.penaltiesSaved}</span>
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
