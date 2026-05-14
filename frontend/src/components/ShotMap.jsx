// StatsBomb pitch: 120 x 80 yards
const PW = 120, PH = 80;

function PitchLines() {
  const stroke = '#1e2733';
  const sw = 0.6;
  return (
    <g stroke={stroke} strokeWidth={sw} fill="none">
      {/* outline */}
      <rect x={0} y={0} width={PW} height={PH} />
      {/* halfway */}
      <line x1={60} y1={0} x2={60} y2={PH} />
      <circle cx={60} cy={40} r={10} />
      <circle cx={60} cy={40} r={0.5} fill={stroke} />
      {/* left penalty area */}
      <rect x={0} y={18} width={18} height={44} />
      <rect x={0} y={30} width={6} height={20} />
      <circle cx={12} cy={40} r={0.5} fill={stroke} />
      {/* right penalty area */}
      <rect x={102} y={18} width={18} height={44} />
      <rect x={114} y={30} width={6} height={20} />
      <circle cx={108} cy={40} r={0.5} fill={stroke} />
      {/* corner arcs */}
      <path d="M 0 2 A 2 2 0 0 1 2 0" />
      <path d="M 118 0 A 2 2 0 0 1 120 2" />
      <path d="M 120 78 A 2 2 0 0 1 118 80" />
      <path d="M 2 80 A 2 2 0 0 1 0 78" />
    </g>
  );
}

export default function ShotMap({ shots, team1, team2 }) {
  const VW = 480, VH = 320;
  const sx = VW / PW, sy = VH / PH;

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="label" style={{ marginBottom: 8 }}>Shot Map</div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: '100%', background: '#0a0d12', borderRadius: 6 }}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`scale(${sx},${sy})`}>
          <PitchLines />
          {shots.map((s, i) => {
            const isT2 = s.team === team2;
            const x = isT2 ? PW - s.x : s.x;
            const y = isT2 ? PH - s.y : s.y;
            const r = Math.max(1.2, Math.sqrt(s.xg) * 5);
            const color = isT2 ? '#d94f5c' : '#5b9bd5';
            const isGoal = s.outcome === 'Goal';
            return (
              <circle
                key={i}
                cx={x} cy={y} r={r}
                fill={isGoal ? color : 'none'}
                stroke={color}
                strokeWidth={0.7}
                opacity={isGoal ? 0.9 : 0.55}
              />
            );
          })}
        </g>
      </svg>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        {[
          { color: '#5b9bd5', filled: true,  label: `${team1?.slice(0,3).toUpperCase()} goal` },
          { color: '#5b9bd5', filled: false, label: `${team1?.slice(0,3).toUpperCase()} shot` },
          { color: '#d94f5c', filled: true,  label: `${team2?.slice(0,3).toUpperCase()} goal` },
          { color: '#d94f5c', filled: false, label: `${team2?.slice(0,3).toUpperCase()} shot` },
        ].map(({ color, filled, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--muted)' }}>
            <svg width={10} height={10}>
              <circle cx={5} cy={5} r={4} fill={filled ? color : 'none'} stroke={color} strokeWidth={1.2} />
            </svg>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
