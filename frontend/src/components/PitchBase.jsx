// Reusable StatsBomb pitch outline (120 x 80 yards)
export default function PitchBase({ stroke = '#1e2733', sw = 0.7 }) {
  return (
    <g stroke={stroke} strokeWidth={sw} fill="none">
      <rect x={0} y={0} width={120} height={80} />
      <line x1={60} y1={0} x2={60} y2={80} />
      <circle cx={60} cy={40} r={10} />
      <circle cx={60} cy={40} r={0.6} fill={stroke} stroke="none" />
      {/* left box */}
      <rect x={0} y={18} width={18} height={44} />
      <rect x={0} y={30} width={6} height={20} />
      <circle cx={12} cy={40} r={0.6} fill={stroke} stroke="none" />
      {/* right box */}
      <rect x={102} y={18} width={18} height={44} />
      <rect x={114} y={30} width={6} height={20} />
      <circle cx={108} cy={40} r={0.6} fill={stroke} stroke="none" />
      {/* corners */}
      <path d="M0 2 A2 2 0 0 1 2 0" /><path d="M118 0 A2 2 0 0 1 120 2" />
      <path d="M120 78 A2 2 0 0 1 118 80" /><path d="M2 80 A2 2 0 0 1 0 78" />
    </g>
  );
}
