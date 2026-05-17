const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} — ${path}`);
  return res.json();
}

// ── StatsBomb ──────────────────────────────────────────────────────────────
export const fetchCompetitions = ()               => get('/api/competitions');
export const fetchMatchesList  = (compId, seasonId) => get(`/api/matches?competition_id=${compId}&season_id=${seasonId}`);
export const fetchMatch        = (id)             => get(`/api/match/${id}`);
export const fetchShotAnalysis = (id)             => get(`/api/match/${id}/shot-analysis`);
export const fetchPassNetwork  = (id)             => get(`/api/match/${id}/pass-network`);
export const fetchHeatmap      = (id)             => get(`/api/match/${id}/heatmap`);
export const fetchPlayerStats  = (id)             => get(`/api/match/${id}/player-stats`);
export const fetchPressure     = (id)             => get(`/api/match/${id}/pressure`);
export const fetchDefensive    = (id)             => get(`/api/match/${id}/defensive`);
export const fetchSetPieces    = (id)             => get(`/api/match/${id}/set-pieces`);
export const fetchMomentum     = (id)             => get(`/api/match/${id}/momentum`);
export const fetchAvailableFeatures = (id)        => get(`/api/match/${id}/available-features`);

// ── StatsBomb match lookup ─────────────────────────────────────────────────
export const findStatsBombMatch = (homeTeam, awayTeam, date) =>
  get(`/api/find-match?home_team=${encodeURIComponent(homeTeam)}&away_team=${encodeURIComponent(awayTeam)}&date=${encodeURIComponent(date)}`);

// ── ESPN live data ─────────────────────────────────────────────────────────
export const fetchLiveLeagues    = ()                   => get('/api/live/leagues');
export const fetchLiveScoreboard = (leagueId, date)     => get(`/api/live/scoreboard?league_id=${leagueId}${date ? `&date=${date}` : ''}`);
export const fetchLiveRecent     = (leagueId)           => get(`/api/live/recent?league_id=${leagueId}`);
export const fetchLiveMatch      = (leagueId, matchId)  => get(`/api/live/match/${leagueId}/${matchId}`);
