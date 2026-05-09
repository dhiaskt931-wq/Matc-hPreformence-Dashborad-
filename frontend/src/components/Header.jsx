export default function Header({ meta }) {
  if (!meta) return null;
  const { team1, team2, score1, score2, venue, date, competition } = meta;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 0 10px' }}>
      <span style={{ color: 'var(--muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Match Dashboard
      </span>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '14px 40px' }}>
        <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 18 }}>{team1}</span>
        <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 32, letterSpacing: 2 }}>
          {score1} &nbsp;–&nbsp; {score2}
        </span>
        <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 18 }}>{team2}</span>
      </div>

      <span style={{ color: 'var(--muted)', fontSize: 11 }}>
        {competition} &nbsp;·&nbsp; {venue} &nbsp;·&nbsp; {date}
      </span>
    </div>
  );
}
