const BASE = 'http://localhost:8000';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} — ${path}`);
  return res.json();
}

export const fetchMatch      = (id) => get(`/api/match/${id}`);
export const fetchShotAnalysis  = (id) => get(`/api/match/${id}/shot-analysis`);
export const fetchPassNetwork   = (id) => get(`/api/match/${id}/pass-network`);
export const fetchHeatmap       = (id) => get(`/api/match/${id}/heatmap`);
export const fetchPlayerStats   = (id) => get(`/api/match/${id}/player-stats`);
export const fetchPressure      = (id) => get(`/api/match/${id}/pressure`);
export const fetchDefensive     = (id) => get(`/api/match/${id}/defensive`);
export const fetchSetPieces     = (id) => get(`/api/match/${id}/set-pieces`);
export const fetchMomentum      = (id) => get(`/api/match/${id}/momentum`);
