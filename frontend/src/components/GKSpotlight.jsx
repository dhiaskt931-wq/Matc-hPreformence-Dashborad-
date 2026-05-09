export default function GKSpotlight({ goalkeepers, team1, team2 }) {
  const gk1 = goalkeepers?.find(g => g.team === team1);
  const gk2 = goalkeepers?.find(g => g.team === team2);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="label" style={{ marginBottom: 14 }}>GK Spotlight</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[{ gk: gk1, color: 'var(--arg)' }, { gk: gk2, color: 'var(--fra)' }].map(({ gk, color }, i) => {
          if (!gk) return null;
          return (
            <div key={gk.player}>
              {i === 1 && (
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
              )}
              <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 10 }}>
                <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  {gk.player}
                </div>
                <div style={{ color, fontSize: 12, marginBottom: 3 }}>
                  Saves {gk.saves}&nbsp;&nbsp;
                  Conceded {gk.conceded}&nbsp;&nbsp;
                  PSxG prevented {gk.psxgPrevented >= 0 ? '+' : ''}{gk.psxgPrevented.toFixed(2)}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 11 }}>
                  {gk.penaltiesSaved > 0 ? `Shootout saves: ${gk.penaltiesSaved}` : 'No shootout saves'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
