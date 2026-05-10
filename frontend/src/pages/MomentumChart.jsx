import useFetch from '../hooks/useFetch';
import { fetchMomentum } from '../api/matchApi';
import PageShell from '../components/PageShell';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';

const MATCH_ID = 3869685;

export default function MomentumChart() {
  const { data, error, loading } = useFetch(fetchMomentum, MATCH_ID);

  return (
    <PageShell loading={loading} error={error}>
      {data && (() => {
        const { team1, team2, momentum } = data;

        // merge into single chart dataset keyed by minute
        const minuteSet = new Set([
          ...(momentum[team1] ?? []).map(d => d.minute),
          ...(momentum[team2] ?? []).map(d => d.minute),
        ]);
        const chartData = [...minuteSet].sort((a, b) => a - b).map(min => {
          const p1 = (momentum[team1] ?? []).find(d => d.minute === min);
          const p2 = (momentum[team2] ?? []).find(d => d.minute === min);
          return {
            minute: min,
            [team1]: p1?.smoothed ?? 0,
            [team2]: p2?.smoothed ?? 0,
            [`${team1}_raw`]: p1?.actions ?? 0,
            [`${team2}_raw`]: p2?.actions ?? 0,
          };
        });

        // find dominant phases (runs of 5+ consecutive bins where one team leads)
        const phases = [];
        let cur = null;
        chartData.forEach(d => {
          const lead = d[team1] > d[team2] ? team1 : d[team2] > d[team1] ? team2 : null;
          if (!lead) { cur = null; return; }
          if (!cur || cur.team !== lead) {
            cur = { team: lead, start: d.minute, end: d.minute };
            phases.push(cur);
          } else {
            cur.end = d.minute;
          }
        });
        const longPhases = phases.filter(p => p.end - p.start >= 9);

        return (
          <div style={{ padding: '20px 20px 32px' }}>
            <div className="label" style={{ marginBottom: 6 }}>Momentum Chart</div>
            <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 16 }}>
              Smoothed 3-minute action volume · higher = more dominant in that phase
            </div>

            {/* dominant phases */}
            {longPhases.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {longPhases.map((p, i) => {
                  const c = p.team === team1 ? '#75AADB' : '#EF3340';
                  return (
                    <div key={i} style={{
                      background: 'var(--card)', border: `1px solid ${c}`,
                      borderRadius: 5, padding: '4px 10px', fontSize: 10,
                    }}>
                      <span style={{ color: c, fontWeight: 700 }}>{p.team.slice(0, 3).toUpperCase()}</span>
                      <span style={{ color: 'var(--muted)', marginLeft: 4 }}>{p.start}'–{p.end}'</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="card">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 8, right: 20, bottom: 20, left: 0 }}>
                  <defs>
                    <linearGradient id="mArg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#75AADB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#75AADB" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="mFra" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF3340" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF3340" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                  <XAxis dataKey="minute" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 10 }}
                    label={{ value: 'Minute', position: 'insideBottom', offset: -10, fill: '#8b949e', fontSize: 10 }} />
                  <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 10 }} width={32}
                    label={{ value: 'Actions / 3 min', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, fontSize: 11 }}
                    labelStyle={{ color: '#8b949e' }}
                    labelFormatter={v => `Minute ${v}`}
                    formatter={(v, name) => [v, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#8b949e', paddingTop: 8 }} />
                  <ReferenceLine x={45} stroke="#30363d" strokeDasharray="4 2"
                    label={{ value: 'HT', fill: '#8b949e', fontSize: 9 }} />
                  <ReferenceLine x={90} stroke="#30363d" strokeDasharray="4 2"
                    label={{ value: 'FT', fill: '#8b949e', fontSize: 9 }} />
                  <Area type="monotone" dataKey={team1} stroke="#75AADB" strokeWidth={2}
                    fill="url(#mArg)" dot={false} isAnimationActive={false} />
                  <Area type="monotone" dataKey={team2} stroke="#EF3340" strokeWidth={2}
                    fill="url(#mFra)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* phase summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              {[team1, team2].map((team, i) => {
                const c = i === 0 ? '#75AADB' : '#EF3340';
                const dominated = longPhases.filter(p => p.team === team).reduce((s, p) => s + p.end - p.start, 0);
                const totalActions = (momentum[team] ?? []).reduce((s, d) => s + d.actions, 0);
                return (
                  <div key={team} className="card">
                    <div style={{ color: c, fontWeight: 700, marginBottom: 8 }}>{team}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 11 }}>
                      Dominant phases: <strong style={{ color: c }}>{dominated} min</strong>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>
                      Total actions: <strong style={{ color: c }}>{totalActions}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
