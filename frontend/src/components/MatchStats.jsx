const METRICS = ['passes', 'fouls', 'corners', 'recoveries', 'dribbles'];
const LABELS   = ['Passes', 'Fouls', 'Corners', 'Recoveries', 'Dribbles'];

export default function MatchStats({ stats, team1, team2 }) {
  const t1 = stats[team1] ?? {};
  const t2 = stats[team2] ?? {};

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="label" style={{ marginBottom: 12 }}>Match Stats</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 12 }}>{team1}</span>
        <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 12 }}>{team2}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {METRICS.map((key, i) => {
          const v1 = t1[key] ?? 0;
          const v2 = t2[key] ?? 0;
          const total = (v1 + v2) || 1;
          const pct1 = (v1 / total) * 100;
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 12 }}>{v1}</span>
                <span style={{ color: 'var(--muted)', fontSize: 11 }}>{LABELS[i]}</span>
                <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 12 }}>{v2}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${pct1}%`, background: 'var(--arg)', borderRadius: '3px 0 0 3px' }} />
                <div style={{ flex: 1, background: 'var(--fra)', borderRadius: '0 3px 3px 0' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
