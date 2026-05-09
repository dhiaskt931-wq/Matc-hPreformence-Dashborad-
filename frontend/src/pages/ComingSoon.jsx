const IDEAS = {
  '/xg-timeline': {
    icon: '📈',
    title: 'xG Timeline',
    description: 'Minute-by-minute xG accumulation with period markers, goal events, and momentum swings. Shows when the game shifted.',
    metrics: ['Cumulative xG per team', 'Rolling xG (5-min window)', 'Goal markers with player labels', 'HT / FT / ET period lines'],
  },
  '/shot-analysis': {
    icon: '🎯',
    title: 'Shot Analysis',
    description: 'Deep dive into shot quality, locations, and outcomes. Compare open-play vs set-piece shots.',
    metrics: ['xG distribution histogram', 'Shot distance vs xG scatter', 'Body part breakdown (foot/head)', 'Shot zone map (on/off target)'],
  },
  '/pass-network': {
    icon: '🔗',
    title: 'Pass Network',
    description: 'Visualise how each team connected passes. Node size = passes received, edge thickness = passes between pair.',
    metrics: ['Player node graph on pitch', 'Most common passing lanes', 'Progressive passes map', 'Pass completion % per player'],
  },
  '/heatmaps': {
    icon: '🌡️',
    title: 'Player Heatmaps',
    description: 'KDE heatmap of any player\'s touch locations across the pitch — see who covers what zones.',
    metrics: ['Touch location heatmap', 'Carry / dribble start map', 'Defensive action zones', 'Player comparison side-by-side'],
  },
  '/top-stats': {
    icon: '🏅',
    title: 'Top Performers',
    description: 'Full player stat leaderboard ranked by any metric — xG, progressive carries, pressures, duel success.',
    metrics: ['Sortable stat table', 'Bar chart race per metric', 'Radar chart for player profile', 'xG vs Goals scatter (over/underperformers)'],
  },
  '/duels': {
    icon: '⚔️',
    title: 'Duels & Pressure',
    description: 'Where were duels won/lost? Where did each team press? Pressure map overlaid on the pitch.',
    metrics: ['Pressure map heatmap', 'Duel win % by zone', 'High press success rate', 'PPDA (passes per defensive action)'],
  },
  '/defensive': {
    icon: '🛡️',
    title: 'Defensive Actions',
    description: 'Tackles, interceptions, clearances, and blocks mapped spatially. See defensive shape and coverage.',
    metrics: ['Tackle / interception map', 'Clearance zones', 'Block map by area', 'Defensive line height over time'],
  },
  '/set-pieces': {
    icon: '📐',
    title: 'Set Pieces',
    description: 'Analyse corners, free kicks, and throw-ins. Show delivery zones, headed zones, and outcomes.',
    metrics: ['Corner delivery map', 'Free kick shot map', 'Set piece xG breakdown', 'Outcome: goal / shot / clearance'],
  },
  '/momentum': {
    icon: '⚡',
    title: 'Momentum Chart',
    description: 'Rolling window of events (shots, pressures, carries) weighted to show which team controlled the game at each moment.',
    metrics: ['Smoothed momentum line', 'Event volume per minute', 'Dangerous actions per phase', 'Territory control over time'],
  },
};

export default function ComingSoon({ path }) {
  const page = IDEAS[path] ?? { icon: '🔧', title: 'Coming Soon', description: 'This page is under construction.', metrics: [] };

  return (
    <div style={{ padding: '40px 24px', maxWidth: 640 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{page.icon}</div>
      <h2 style={{ color: 'var(--text)', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>{page.title}</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{page.description}</p>

      <div className="card">
        <div className="label" style={{ marginBottom: 12 }}>Planned metrics</div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {page.metrics.map(m => (
            <li key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
              <span style={{ color: 'var(--arg)', fontSize: 10 }}>▸</span>
              {m}
            </li>
          ))}
        </ul>
      </div>

      <div style={{
        marginTop: 20, padding: '10px 14px', borderRadius: 6,
        border: '1px dashed var(--border)',
        color: 'var(--muted)', fontSize: 12,
      }}>
        Ready to build this? The backend endpoint just needs a new function in{' '}
        <code style={{ background: 'var(--card)', padding: '1px 5px', borderRadius: 3 }}>
          backend/services/match_service.py
        </code>
      </div>
    </div>
  );
}
