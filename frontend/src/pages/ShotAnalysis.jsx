import { useMatch } from '../context/MatchContext';
import useFetch from '../hooks/useFetch';
import { fetchShotAnalysis, fetchMatch } from '../api/matchApi';
import { abbrev } from '../utils/teamAbbrev';
import PageShell from '../components/PageShell';
import ShotMap from '../components/ShotMap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';


function StatCard({ label, t1val, t2val, team1, team2 }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="label" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: 'var(--arg)', fontWeight: 700 }}>{t1val}</span>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>vs</span>
        <span style={{ color: 'var(--fra)', fontWeight: 700 }}>{t2val}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ color: 'var(--muted)', fontSize: 10 }}>{team1}</span>
        <span style={{ color: 'var(--muted)', fontSize: 10 }}>{team2}</span>
      </div>
    </div>
  );
}

const SHOT_BAR_SCALE = 2;

export default function ShotAnalysis() {
  const { selected } = useMatch();
  const { data: analysis, error: e1, loading: l1 } = useFetch(fetchShotAnalysis, selected.matchId);
  const { data: matchData, error: e2, loading: l2 } = useFetch(fetchMatch, selected.matchId);

  return (
    <PageShell loading={l1 || l2} error={e1 || e2}>
      {analysis && matchData && (() => {
        const { team1, team2 } = analysis;
        const a1 = analysis.analysis[team1] ?? {};
        const a2 = analysis.analysis[team2] ?? {};

        // distance chart data
        const distData = (a1.distanceBins ?? []).map((bin, i) => ({
          range: bin.range,
          [team1]: bin.shots,
          [team2]: (a2.distanceBins ?? [])[i]?.shots ?? 0,
        }));

        // body part chart data (union of keys)
        const bpKeys = [...new Set([...Object.keys(a1.bodyParts ?? {}), ...Object.keys(a2.bodyParts ?? {})])];
        const bpData = bpKeys.map(k => ({
          part: k.replace(' Foot', '').replace('Right', 'Right Foot').replace('Left', 'Left Foot'),
          [team1]: a1.bodyParts?.[k] ?? 0,
          [team2]: a2.bodyParts?.[k] ?? 0,
        }));

        return (
          <div style={{ padding: '20px 20px 32px' }}>
            <div className="label" style={{ marginBottom: 14 }}>Shot Analysis</div>

            {/* headline stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
              <StatCard label="Total Shots" t1val={a1.total} t2val={a2.total} team1={team1} team2={team2} />
              <StatCard label="Goals" t1val={a1.goals} t2val={a2.goals} team1={team1} team2={team2} />
              <StatCard label="Total xG" t1val={a1.xg != null ? Number(a1.xg).toFixed(2) : '—'} t2val={a2.xg != null ? Number(a2.xg).toFixed(2) : '—'} team1={team1} team2={team2} />
              <StatCard label="Avg Distance (yds)" t1val={a1.avgDistance} t2val={a2.avgDistance} team1={team1} team2={team2} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* shot map */}
              <ShotMap shots={matchData.shotMap} team1={team1} team2={team2} />

              {/* zones */}
              <div className="card">
                <div className="label" style={{ marginBottom: 12 }}>Zones</div>
                {['insideBox', 'outsideBox'].map(zone => {
                  const z1 = a1.zones?.[zone] ?? {};
                  const z2 = a2.zones?.[zone] ?? {};
                  const label = zone === 'insideBox' ? 'Inside Box' : 'Outside Box';
                  return (
                    <div key={zone} style={{ marginBottom: 14 }}>
                      <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 6 }}>{label}</div>
                      {[{ team: team1, z: z1, c: 'var(--arg)' }, { team: team2, z: z2, c: 'var(--fra)' }].map(({ team, z, c }) => (
                        <div key={team} style={{ marginBottom: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ color: c, fontSize: 11, fontWeight: 600 }}>{abbrev(team)}</span>
                            <span style={{ color: 'var(--muted)', fontSize: 10 }}>
                              {z.shots} shots · {z.goals} G · {z.xg?.toFixed(2)} xG
                            </span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                            <div style={{ height: '100%', width: `${Math.min((z.shots / Math.max(a1.total + a2.total, 1)) * 100 * SHOT_BAR_SCALE, 100)}%`, background: c, borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* by half */}
                <div className="label" style={{ margin: '14px 0 8px' }}>By Half</div>
                {['first', 'second'].map(half => (
                  <div key={half} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--arg)', fontWeight: 700 }}>{a1.byHalf?.[half]?.shots ?? 0}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>{half === 'first' ? '1st Half' : '2nd Half'}</span>
                    <span style={{ color: 'var(--fra)', fontWeight: 700 }}>{a2.byHalf?.[half]?.shots ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* distance distribution */}
              <div className="card">
                <div className="label" style={{ marginBottom: 8 }}>Shots by Distance (yards from goal)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={distData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" vertical={false} />
                    <XAxis dataKey="range" stroke="#5a6478" tick={{ fill: '#5a6478', fontSize: 10 }} />
                    <YAxis stroke="#5a6478" tick={{ fill: '#5a6478', fontSize: 10 }} width={28} />
                    <Tooltip contentStyle={{ background: '#141920', border: '1px solid #1e2733', borderRadius: 6, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#5a6478' }} />
                    <Bar dataKey={team1} fill="#5b9bd5" radius={[2, 2, 0, 0]} />
                    <Bar dataKey={team2} fill="#d94f5c" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* body part */}
              <div className="card">
                <div className="label" style={{ marginBottom: 8 }}>Body Part</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={bpData} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" horizontal={false} />
                    <XAxis type="number" stroke="#5a6478" tick={{ fill: '#5a6478', fontSize: 10 }} />
                    <YAxis type="category" dataKey="part" stroke="#5a6478" tick={{ fill: '#5a6478', fontSize: 10 }} width={60} />
                    <Tooltip contentStyle={{ background: '#141920', border: '1px solid #1e2733', borderRadius: 6, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#5a6478' }} />
                    <Bar dataKey={team1} fill="#5b9bd5" radius={[0, 2, 2, 0]} />
                    <Bar dataKey={team2} fill="#d94f5c" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
