export default function Header({ meta }) {
  if (!meta) return null;
  const { team1, team2, score1, score2, venue, date, competition } = meta;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0 14px' }}>
      <span className="label">Match Dashboard</span>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 32,
        padding: '16px 48px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}>
        <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
          {team1}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            color: 'var(--text)', fontWeight: 700, fontSize: 30,
            letterSpacing: 4, lineHeight: 1,
          }}>
            {score1}
          </span>
          <span style={{
            color: 'var(--muted)', fontSize: 13, fontWeight: 500,
            padding: '2px 10px',
            border: '1px solid var(--border)',
            borderRadius: 6,
            letterSpacing: '0.04em',
          }}>VS</span>
          <span style={{
            color: 'var(--text)', fontWeight: 700, fontSize: 30,
            letterSpacing: 4, lineHeight: 1,
          }}>
            {score2}
          </span>
        </div>

        <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
          {team2}
        </span>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        color: 'var(--muted)', fontSize: 11,
      }}>
        <span>{competition}</span>
        <span style={{ color: 'var(--border)', fontSize: 14 }}>|</span>
        <span>{venue}</span>
        <span style={{ color: 'var(--border)', fontSize: 14 }}>|</span>
        <span>{date}</span>
      </div>
    </div>
  );
}
