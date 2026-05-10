import { useMatch } from '../context/MatchContext';
import useFetch from '../hooks/useFetch';
import { fetchMatch } from '../api/matchApi';
import PageShell from '../components/PageShell';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';


function buildTimeline(flow, team1, team2) {
  const allMins = new Set([
    ...(flow[team1] ?? []).map(d => d.minute),
    ...(flow[team2] ?? []).map(d => d.minute),
  ]);
  const sorted = [...allMins].sort((a, b) => a - b);
  let l1 = 0, l2 = 0;
  return sorted.map(min => {
    const p1 = flow[team1]?.find(d => d.minute === min);
    const p2 = flow[team2]?.find(d => d.minute === min);
    if (p1) l1 = p1.cumxg;
    if (p2) l2 = p2.cumxg;
    return { minute: min, [team1]: l1, [team2]: l2 };
  });
}

const GoalDot = ({ cx, cy, payload, dataKey, flow }) => {
  const point = (flow[dataKey] ?? []).find(d => d.minute === payload?.minute && d.isGoal);
  if (!point || !cx || !cy) return null;
  return <polygon points={`${cx},${cy - 6} ${cx + 5},${cy + 3} ${cx - 5},${cy + 3}`}
    fill={dataKey.includes('Argentina') ? '#75AADB' : '#EF3340'} />;
};

export default function XGTimeline() {
  const { selected } = useMatch();
  const { data, error, loading } = useFetch(fetchMatch, selected.matchId);
  return (
    <PageShell loading={loading} error={error}>
      {data && (() => {
        const { team1, team2 } = data.meta;
        const flow = data.xgFlow;
        const chartData = buildTimeline(flow, team1, team2);
        const allShots = [
          ...(flow[team1] ?? []).map(s => ({ ...s, team: team1 })),
          ...(flow[team2] ?? []).map(s => ({ ...s, team: team2 })),
        ].sort((a, b) => a.minute - b.minute);

        return (
          <div style={{ padding: '20px 20px 32px' }}>
            <div className="label" style={{ marginBottom: 16 }}>xG Timeline — Full Match</div>

            {/* big chart */}
            <div className="card" style={{ marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 8, right: 20, bottom: 20, left: 0 }}>
                  <defs>
                    <linearGradient id="gArg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#75AADB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#75AADB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFra" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF3340" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#EF3340" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                  <XAxis dataKey="minute" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 10 }}
                    label={{ value: 'Minute', position: 'insideBottom', offset: -10, fill: '#8b949e', fontSize: 10 }} />
                  <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 10 }} width={36} />
                  <Tooltip contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, fontSize: 11 }}
                    labelStyle={{ color: '#8b949e' }} formatter={v => v.toFixed(3)} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#8b949e', paddingTop: 8 }} />
                  <ReferenceLine x={45} stroke="#30363d" strokeDasharray="4 2" label={{ value: 'HT', fill: '#8b949e', fontSize: 9 }} />
                  <ReferenceLine x={90} stroke="#30363d" strokeDasharray="4 2" label={{ value: 'FT', fill: '#8b949e', fontSize: 9 }} />
                  <Area type="stepAfter" dataKey={team1} stroke="#75AADB" strokeWidth={2.5}
                    fill="url(#gArg)" dot={p => <GoalDot {...p} dataKey={team1} flow={flow} />} isAnimationActive={false} />
                  <Area type="stepAfter" dataKey={team2} stroke="#EF3340" strokeWidth={2.5}
                    fill="url(#gFra)" dot={p => <GoalDot {...p} dataKey={team2} flow={flow} />} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* shot event strip */}
            <div className="card">
              <div className="label" style={{ marginBottom: 12 }}>Every Shot</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allShots.map((s, i) => {
                  const c = s.team === team1 ? '#75AADB' : '#EF3340';
                  const isGoal = s.isGoal;
                  return (
                    <div key={i} title={`${s.team} — min ${s.minute} — xG ${s.xg?.toFixed(2)} ${isGoal ? '⚽ GOAL' : ''}`}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isGoal ? c : 'none',
                        border: `2px solid ${c}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: isGoal ? '#0d1117' : c, fontWeight: 700,
                        cursor: 'default', opacity: isGoal ? 1 : 0.6,
                      }}>
                      {s.minute}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                {[team1, team2].map(t => {
                  const shots = flow[t] ?? [];
                  const goals = shots.filter(s => s.isGoal).length;
                  const xg = shots.at(-1)?.cumxg ?? 0;
                  const c = t === team1 ? '#75AADB' : '#EF3340';
                  return (
                    <div key={t} style={{ color: c, fontSize: 12 }}>
                      <strong>{t}</strong>: {shots.length} shots · {goals} goals · {xg.toFixed(2)} xG
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
