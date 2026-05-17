import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';

function buildChartData(flow, team1, team2) {
  const allMinutes = new Set();
  [...(flow[team1] ?? []), ...(flow[team2] ?? [])].forEach(d => allMinutes.add(d.minute));
  const sorted = [...allMinutes].sort((a, b) => a - b);
  let last1 = 0, last2 = 0;
  return sorted.map(min => {
    const t1 = flow[team1]?.find(d => d.minute === min);
    const t2 = flow[team2]?.find(d => d.minute === min);
    if (t1) last1 = t1.cumxg;
    if (t2) last2 = t2.cumxg;
    return { minute: min, [team1]: last1, [team2]: last2 };
  });
}

const GoalDot = (props) => {
  const { cx, cy, payload, dataKey, flow, stroke } = props;
  const teamFlow = flow[dataKey] ?? [];
  const point = teamFlow.find(d => d.minute === payload.minute && d.isGoal);
  if (!point) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={stroke} stroke={stroke} strokeWidth={2} opacity={0.9} />
      <circle cx={cx} cy={cy} r={9} fill="none" stroke={stroke} strokeWidth={1} opacity={0.35} />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(7,10,24,0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '8px 12px', fontSize: 11,
    }}>
      <div style={{ color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>Minute {label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.stroke, fontWeight: 700, marginBottom: 2 }}>
          {p.dataKey?.slice(0,3).toUpperCase()}: {Number(p.value).toFixed(2)} xG
        </div>
      ))}
    </div>
  );
};

export default function XGFlow({ flow, team1, team2 }) {
  const data = buildChartData(flow, team1, team2);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <span className="label">xG Flow</span>
      </div>
      <div aria-label={`xG flow chart — ${team1} vs ${team2}`} role="img">
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 12, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="minute"
            stroke="rgba(255,255,255,0.08)"
            tick={{ fill: 'var(--muted)', fontSize: 10 }}
            label={{ value: 'min', position: 'insideBottom', offset: -4, fill: 'var(--muted)', fontSize: 9 }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.08)"
            tick={{ fill: 'var(--muted)', fontSize: 10 }}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => <span style={{ color: 'var(--text-dim)' }}>{value?.slice(0,3).toUpperCase()}</span>}
          />
          <ReferenceLine x={45} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 2"
            label={{ value: 'HT', fill: 'var(--muted)', fontSize: 9, position: 'insideTopRight' }} />
          <ReferenceLine x={90} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 2"
            label={{ value: 'FT', fill: 'var(--muted)', fontSize: 9, position: 'insideTopRight' }} />
          <Line
            type="stepAfter" dataKey={team1}
            stroke="var(--arg)" strokeWidth={2.5}
            dot={(p) => <GoalDot {...p} dataKey={team1} flow={flow} stroke="var(--arg)" />}
            activeDot={{ r: 5, fill: 'var(--arg)', stroke: 'transparent' }}
            isAnimationActive={false}
          />
          <Line
            type="stepAfter" dataKey={team2}
            stroke="var(--fra)" strokeWidth={2.5}
            dot={(p) => <GoalDot {...p} dataKey={team2} flow={flow} stroke="var(--fra)" />}
            activeDot={{ r: 5, fill: 'var(--fra)', stroke: 'transparent' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
