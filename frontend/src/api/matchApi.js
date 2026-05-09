const BASE = 'http://localhost:8000';

export async function fetchMatch(matchId) {
  const res = await fetch(`${BASE}/api/match/${matchId}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
