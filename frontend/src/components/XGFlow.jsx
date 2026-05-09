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
  const { cx, cy, payload, dataKey, flow } = props;
  const teamFlow = flow[dataKey] ?? [];
  const point = teamFlow.find(d => d.minute === payload.minute && d.isGoal);
  if (!point) return null;
  return <polygon points={`${cx},${cy-5} ${cx+4},${cy+3} ${cx-4},${cy+3}`} fill={props.stroke} />;
};

export default function XGFlow({ flow, team1, team2 }) {
  const data = buildChartData(flow, team1, team2);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="label" style={{ marginBottom: 8 }}>xG Flow</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
          <XAxis
            dataKey="minute"
            stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 10 }}
            label={{ value: 'Minute', position: 'insideBottom', offset: -2, fill: '#8b949e', fontSize: 10 }}
          />
          <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 10 }} width={34} />
          <Tooltip
            contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, fontSize: 11 }}
            labelStyle={{ color: '#8b949e' }}
            itemStyle={{ color: '#e6edf3' }}
            formatter={(v) => v.toFixed(2)}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#8b949e', paddingTop: 4 }} />
          <ReferenceLine x={45} stroke="#30363d" strokeDasharray="4 2" label={{ value: 'HT', fill: '#8b949e', fontSize: 9 }} />
          <ReferenceLine x={90} stroke="#30363d" strokeDasharray="4 2" label={{ value: 'FT', fill: '#8b949e', fontSize: 9 }} />
          <Line
            type="stepAfter" dataKey={team1} stroke="#75AADB" strokeWidth={2}
            dot={(p) => <GoalDot {...p} dataKey={team1} flow={flow} />}
            activeDot={{ r: 4 }} isAnimationActive={false}
          />
          <Line
            type="stepAfter" dataKey={team2} stroke="#EF3340" strokeWidth={2}
            dot={(p) => <GoalDot {...p} dataKey={team2} flow={flow} />}
            activeDot={{ r: 4 }} isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
