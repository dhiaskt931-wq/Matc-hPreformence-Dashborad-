// Renders a grid-density heatmap overlay on a 120×80 StatsBomb pitch.
// props: touches=[{x,y}], color (hex), cols=24, rows=16
import PitchBase from './PitchBase';

const DEFAULT_COLS = 24, DEFAULT_ROWS = 16;

function buildGrid(touches, cols, rows) {
  const cw = 120 / cols, rh = 80 / rows;
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
  touches.forEach(({ x, y }) => {
    const c = Math.min(Math.floor(x / cw), cols - 1);
    const r = Math.min(Math.floor(y / rh), rows - 1);
    grid[r][c]++;
  });
  return { grid, cw, rh };
}

export default function GridHeatmap({ touches = [], color = '#5b9bd5', cols = DEFAULT_COLS, rows = DEFAULT_ROWS, height = 260 }) {
  const { grid, cw, rh } = buildGrid(touches, cols, rows);
  const maxVal = Math.max(1, ...grid.flat());

  return (
    <svg viewBox="0 0 120 80" style={{ width: '100%', height, background: '#0a0d12', borderRadius: 4 }}
         preserveAspectRatio="xMidYMid meet">
      {grid.map((row, ri) =>
        row.map((val, ci) => {
          if (val === 0) return null;
          const alpha = 0.08 + (val / maxVal) * 0.75;
          return (
            <rect key={`${ri}-${ci}`}
              x={ci * cw} y={ri * rh} width={cw} height={rh}
              fill={color} opacity={alpha} />
          );
        })
      )}
      <PitchBase />
    </svg>
  );
}
