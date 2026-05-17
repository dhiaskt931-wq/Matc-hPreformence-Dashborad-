export function teamColor(team, selected) {
  if (!selected) return 'var(--team1)';
  return team === selected.home_team ? 'var(--team1)' : 'var(--team2)';
}
