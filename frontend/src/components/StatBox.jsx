export default function StatBox({ label, team1, team2, val1, val2, unit = '', color1 = 'var(--arg)', color2 = 'var(--fra)' }) {
  const n1 = parseFloat(val1) || 0;
  const n2 = parseFloat(val2) || 0;
  const total = n1 + n2 || 1;
  const pct1 = (n1 / total) * 100;

  return (
    <div className="card animate-fade-up" style={{ padding: '16px 18px' }}>
      <div className="label" style={{ marginBottom: 14 }}>{label}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: color1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {val1}{unit}
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>vs</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: color2, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {val2}{unit}
        </span>
      </div>

      {/* Split bar */}
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${color1} ${pct1}%, ${color2} ${pct1}%)`,
          transition: 'width 0.6s ease',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
        <span style={{ fontSize: 10, color: color1, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{team1?.slice(0,3).toUpperCase()}</span>
        <span style={{ fontSize: 10, color: color2, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{team2?.slice(0,3).toUpperCase()}</span>
      </div>
    </div>
  );
}
