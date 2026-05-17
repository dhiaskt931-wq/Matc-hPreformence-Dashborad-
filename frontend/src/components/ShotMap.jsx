// StatsBomb pitch: 120 x 80 yards
const PW = 120, PH = 80;

function PitchLines() {
  const stroke = 'rgba(255,255,255,0.12)';
  const sw = 0.5;
  return (
    <g stroke={stroke} strokeWidth={sw} fill="none">
      <rect x={0} y={0} width={PW} height={PH} />
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
  const t1Short = team1?.slice(0,3).toUpperCase();
  const t2Short = team2?.slice(0,3).toUpperCase();

  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <span className="label">Shot Map</span>
      </div>

      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
        {/* Subtle pitch grass gradient */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(20,40,20,0.6) 0%, rgba(4,6,15,0.95) 100%)',
          zIndex: 0,
        }} />
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: '100%', display: 'block', position: 'relative', zIndex: 1 }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Shot map — ${team1} vs ${team2}`}
        >
          {/* Pitch fill */}
          <rect x={0} y={0} width={VW} height={VH} fill="rgba(10,20,10,0.7)" />
          <g transform={`scale(${sx},${sy})`}>
            <PitchLines />
            {shots.map((s, i) => {
              const isT2 = s.team === team2;
              const x = isT2 ? PW - s.x : s.x;
              const y = isT2 ? PH - s.y : s.y;
              const r = Math.max(1.4, Math.sqrt(s.xg) * 5.5);
              const color = isT2 ? '#f87171' : '#60a5fa';
              const isGoal = s.outcome === 'Goal';
              return (
                <g key={i}>
                  {isGoal && (
                    <circle cx={x} cy={y} r={r * 1.8}
                      fill={color} opacity={0.12} />
                  )}
                  <circle
                    cx={x} cy={y} r={r}
                    fill={isGoal ? color : 'none'}
                    stroke={color}
                    strokeWidth={isGoal ? 0 : 0.7}
                    opacity={isGoal ? 0.95 : 0.5}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          { color: '#60a5fa', filled: true,  label: `${t1Short} goal` },
          { color: '#60a5fa', filled: false, label: `${t1Short} shot` },
          { color: '#f87171', filled: true,  label: `${t2Short} goal` },
          { color: '#f87171', filled: false, label: `${t2Short} shot` },
        ].map(({ color, filled, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
            <svg width={10} height={10}>
              <circle cx={5} cy={5} r={4} fill={filled ? color : 'none'} stroke={color} strokeWidth={1.2}
                style={{ filter: filled ? `drop-shadow(0 0 3px ${color})` : 'none' }} />
            </svg>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
