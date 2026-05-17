const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_MESSAGES = {
  404: 'Match data not available',
  500: 'Server error — try again in a moment',
};

async function get(path, signal) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('No connection to the server', { cause: e });
  }
  if (!res.ok) {
    throw new Error(STATUS_MESSAGES[res.status] ?? `API ${res.status} — ${path}`);
  }
  return res.json();
}

// ── StatsBomb ──────────────────────────────────────────────────────────────
export const fetchCompetitions       = (_, sig)              => get('/api/competitions', sig);
export const fetchMatchesList        = (compId, seasonId, sig) => get(`/api/matches?competition_id=${compId}&season_id=${seasonId}`, sig);
export const fetchMatch              = (id, sig)             => get(`/api/match/${id}`, sig);
export const fetchShotAnalysis       = (id, sig)             => get(`/api/match/${id}/shot-analysis`, sig);
export const fetchPassNetwork        = (id, sig)             => get(`/api/match/${id}/pass-network`, sig);
export const fetchHeatmap            = (id, sig)             => get(`/api/match/${id}/heatmap`, sig);
export const fetchPlayerStats        = (id, sig)             => get(`/api/match/${id}/player-stats`, sig);
export const fetchPressure           = (id, sig)             => get(`/api/match/${id}/pressure`, sig);
export const fetchDefensive          = (id, sig)             => get(`/api/match/${id}/defensive`, sig);
export const fetchSetPieces          = (id, sig)             => get(`/api/match/${id}/set-pieces`, sig);
export const fetchMomentum           = (id, sig)             => get(`/api/match/${id}/momentum`, sig);
export const fetchAvailableFeatures  = (id, sig)             => get(`/api/match/${id}/available-features`, sig);

// ── StatsBomb match lookup ─────────────────────────────────────────────────
export const findStatsBombMatch = (homeTeam, awayTeam, date, sig) =>
  get(`/api/find-match?home_team=${encodeURIComponent(homeTeam)}&away_team=${encodeURIComponent(awayTeam)}&date=${encodeURIComponent(date)}`, sig);

// ── ESPN live data ─────────────────────────────────────────────────────────
export const fetchLiveLeagues    = (_, sig)                        => get('/api/live/leagues', sig);
export const fetchLiveScoreboard = (leagueId, date, sig)           => get(`/api/live/scoreboard?league_id=${leagueId}${date ? `&date=${date}` : ''}`, sig);
export const fetchLiveRecent     = (leagueId, sig)                 => get(`/api/live/recent?league_id=${leagueId}`, sig);
export const fetchLiveMatch      = (leagueId, matchId, sig)        => get(`/api/live/match/${leagueId}/${matchId}`, sig);
