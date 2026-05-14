const METRICS = ['passes', 'fouls', 'corners', 'recoveries', 'dribbles'];
const LABELS   = ['Passes', 'Fouls', 'Corners', 'Recoveries', 'Dribbles'];

export default function MatchStats({ stats, team1, team2 }) {
  const t1 = stats[team1] ?? {};
  const t2 = stats[team2] ?? {};

  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 11 }}>{team1}</span>
        <span className="label">Match Stats</span>
        <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 11 }}>{team2}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {METRICS.map((key, i) => {
          const v1 = t1[key] ?? 0;
          const v2 = t2[key] ?? 0;
          const total = (v1 + v2) || 1;
          const pct1 = (v1 / total) * 100;
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 12 }}>{v1}</span>
                <span style={{ color: 'var(--muted)', fontSize: 11 }}>{LABELS[i]}</span>
                <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 12 }}>{v2}</span>
              </div>
              <div className="stat-bar">
                <div style={{
                  width: `${pct1}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--arg) 0%, #3a7cbf 100%)',
                  borderRadius: '99px 0 0 99px',
                  float: 'left',
                }} />
                <div style={{
                  width: `${100 - pct1}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #a83040 0%, var(--fra) 100%)',
                  borderRadius: '0 99px 99px 0',
                  float: 'right',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
