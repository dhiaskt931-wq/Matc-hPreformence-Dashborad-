import { useMatch } from '../context/MatchContext';
import useFetch from '../hooks/useFetch';
import { fetchSetPieces } from '../api/matchApi';
import PageShell from '../components/PageShell';
import PitchBase from '../components/PitchBase';

const VW = 480, VH = 320;

export default function SetPieces() {
  const { selected } = useMatch();
  const { data, error, loading } = useFetch(fetchSetPieces, selected.matchId);

  return (
    <PageShell loading={loading} error={error}>
      {data && (() => {
        const { team1, team2, corners, fkShots, counts } = data;
        const teams = [team1, team2];
        const colors = { [team1]: '#75AADB', [team2]: '#EF3340' };

        return (
          <div style={{ padding: '20px 20px 32px' }}>
            <div className="label" style={{ marginBottom: 16 }}>Set Pieces</div>

            {/* summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
              {['corners', 'fkPasses', 'fkShots', 'spXg', 'spGoals'].map(key => (
                <div key={key} className="card" style={{ textAlign: 'center', padding: '10px 8px' }}>
                  <div className="label" style={{ marginBottom: 6, fontSize: 9 }}>
                    {key === 'corners' ? 'Corners' : key === 'fkPasses' ? 'FK Passes' :
                      key === 'fkShots' ? 'FK Shots' : key === 'spXg' ? 'SP xG' : 'SP Goals'}
                  </div>
                  {teams.map(t => (
                    <div key={t} style={{ color: colors[t], fontWeight: 700, fontSize: 14 }}>
                      {key === 'spXg' ? Number(counts[t]?.[key] ?? 0).toFixed(2) : counts[t]?.[key] ?? 0}
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    {teams.map(t => (
                      <span key={t} style={{ color: colors[t], fontSize: 8 }}>{t.slice(0,3).toUpperCase()}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* corner delivery map */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <div className="label">Corner Delivery Positions</div>
                </div>
                <svg viewBox={`0 0 ${VW} ${VH}`}
                  style={{ width: '100%', background: '#0d1117', display: 'block' }}
                  preserveAspectRatio="xMidYMid meet">
                  <g transform={`scale(${VW / 120},${VH / 80})`}>
                    <PitchBase />
                    {corners.map((c, i) => {
                      const col = colors[c.team] ?? '#8b949e';
                      return (
                        <g key={i}>
                          <circle cx={c.x} cy={c.y} r={1.4} fill={col} opacity={0.9} />
                        </g>
                      );
                    })}
                  </g>
                </svg>
                <div style={{ padding: '8px 12px', display: 'flex', gap: 14 }}>
                  {teams.map(t => (
                    <span key={t} style={{ fontSize: 10, color: colors[t] }}>
                      ● {t.slice(0,3).toUpperCase()} ({counts[t]?.corners ?? 0} corners)
                    </span>
                  ))}
                </div>
              </div>

              {/* free kick shots */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <div className="label">Free Kick Shots</div>
                </div>
                <svg viewBox={`0 0 ${VW} ${VH}`}
                  style={{ width: '100%', background: '#0d1117', display: 'block' }}
                  preserveAspectRatio="xMidYMid meet">
                  <g transform={`scale(${VW / 120},${VH / 80})`}>
                    <PitchBase />
                    {fkShots.map((s, i) => {
                      const col = colors[s.team] ?? '#8b949e';
                      const r = Math.max(1, Math.sqrt(s.xg || 0.05) * 5);
                      return (
                        <circle key={i}
                          cx={s.x} cy={s.y} r={r}
                          fill={s.goal ? col : 'none'}
                          stroke={col} strokeWidth={0.8}
                          opacity={s.goal ? 0.9 : 0.6} />
                      );
                    })}
                  </g>
                </svg>
                <div style={{ padding: '8px 12px', display: 'flex', gap: 14 }}>
                  {teams.map(t => {
                    const shots = fkShots.filter(s => s.team === t);
                    const goals = shots.filter(s => s.goal).length;
                    return (
                      <span key={t} style={{ fontSize: 10, color: colors[t] }}>
                        {t.slice(0,3).toUpperCase()}: {shots.length} shots · {goals} goals
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
