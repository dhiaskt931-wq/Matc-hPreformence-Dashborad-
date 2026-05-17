const METRICS = ['passes', 'fouls', 'corners', 'recoveries', 'dribbles'];
const LABELS   = ['Passes', 'Fouls', 'Corners', 'Recoveries', 'Dribbles'];

export default function MatchStats({ stats, team1, team2 }) {
  const t1 = stats[team1] ?? {};
  const t2 = stats[team2] ?? {};
  const t1Short = team1?.slice(0,3).toUpperCase();
  const t2Short = team2?.slice(0,3).toUpperCase();

  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em' }}>{t1Short}</span>
        <span className="label">Match Stats</span>
        <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em' }}>{t2Short}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {METRICS.map((key, i) => {
          const v1 = t1[key] ?? 0;
          const v2 = t2[key] ?? 0;
          const total = (v1 + v2) || 1;
          const pct1 = (v1 / total) * 100;
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, alignItems: 'center' }}>
                <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{v1}</span>
                <span style={{ color: 'var(--muted)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{LABELS[i]}</span>
                <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{v2}</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
                <div style={{
                  width: `${pct1}%`, height: '100%',
                  background: 'linear-gradient(90deg, rgba(96,165,250,0.6) 0%, var(--arg) 100%)',
                  borderRadius: '99px 0 0 99px',
                  transition: 'width 0.5s ease',
                }} />
                <div style={{
                  flex: 1, height: '100%',
                  background: 'linear-gradient(90deg, var(--fra) 0%, rgba(248,113,113,0.6) 100%)',
                  borderRadius: '0 99px 99px 0',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
