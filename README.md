# Football Analytics Dashboard

Interactive web dashboard for football match analysis, powered by [StatsBomb open data](https://github.com/statsbomb/open-data), live ESPN scores, and optional Understat / football-data.org data.

**Default match:** 2022 FIFA World Cup Final — Argentina 3–3 France (18 Dec 2022)

---

## Stack

| Layer    | Technology |
|----------|------------|
| Backend  | Python 3.11 · FastAPI · StatsBombPy · Pandas · httpx |
| Frontend | React 18 · Vite · Recharts |
| Data     | StatsBomb Open Data · ESPN live scores |

---

## Architecture

### Source routing & ID offset system

Every match has a single integer `match_id`. The backend resolves which data source to use based on numeric ranges:

| Range | Source | Native ID |
|-------|--------|-----------|
| `1 – 49 999 999` | StatsBomb | same as `match_id` |
| `50 000 001 – 59 999 999` | Understat | `match_id − 50 000 000` |
| `60 000 001+` | football-data.org | `match_id − 60 000 000` |
| ESPN live | ESPN API | stored separately by `league_id` + `match_id` |

`resolver.py` exposes `get_source_info(match_id) → SourceInfo` which all 9 analysis routes call once to avoid re-deriving the source inside each endpoint.

### Caching strategy

| Layer | Implementation | TTL |
|-------|---------------|-----|
| Match events (StatsBomb) | Thread-safe `OrderedDict` (LRU, max 50 entries) | 24 h |
| Live ESPN data | File-based JSON cache (`data_sources/cache.py`) | 60 s |
| Today's scoreboard | File-based JSON cache | 1 h |
| Completed matches | File-based JSON cache | 24 h |
| Historical StatsBomb | File-based JSON cache | 365 d |
| Competition index | File-based JSON cache | 24 h |

StatsBomb events are serialised as `list[dict]` (`to_dict(orient='records')`) before caching to avoid pickling a live DataFrame.

### Available-features contract

`GET /api/match/{id}/available-features` returns a per-feature availability map:

```json
{
  "source": "statsbomb",
  "features": {
    "match-overview": "full",
    "shot-analysis":  "full",
    "pass-network":   "full",
    "heatmap":        "full",
    "player-stats":   "full",
    "pressure":       "full",
    "defensive":      "full",
    "set-pieces":     "full",
    "momentum":       "full"
  }
}
```

The frontend reads this once per match and uses it to grey out nav items that are `"unavailable"` or `"partial"` for the current data source.

---

## Project Structure

```
├── backend/
│   ├── main.py                     # FastAPI app, CORS, validation, routing
│   ├── requirements.txt
│   ├── Makefile                    # dev / test / lint targets
│   ├── .python-version             # 3.11
│   ├── services/
│   │   ├── match_service.py        # StatsBomb analysis (xG, passes, shots…)
│   │   └── espn_service.py         # ESPN live scores via httpx + retry
│   ├── data_sources/
│   │   ├── resolver.py             # SourceInfo dataclass + get_source_info()
│   │   └── cache.py                # File-based JSON cache with TTL
│   └── tests/
│       ├── test_services.py        # Unit tests for match_service helpers
│       ├── test_smoke.py           # Smoke tests for all API endpoints
│       └── test_cache.py           # Unit tests for cache module
└── frontend/
    └── src/
        ├── api/matchApi.js         # Typed fetch wrapper with AbortController
        ├── context/MatchContext.jsx # Global match state + features cache
        ├── hooks/
        │   ├── useFetch.js         # Abort-safe data fetching hook
        │   └── useDebounce.js      # 250 ms debounce
        ├── components/
        │   ├── Sidebar.jsx         # Collapsible nav, feature-aware locking
        │   ├── ErrorState.jsx      # Retry-capable error card
        │   └── Skeleton.jsx        # Loading placeholder
        └── pages/                  # One file per analysis view
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
make dev          # uvicorn main:app --reload --port 8000
```

Or without Make:
```bash
uvicorn main:app --reload --port 8000
```

The first StatsBomb request downloads ~3 000 match events — expect a 20–30 s wait. Subsequent requests hit the in-process LRU cache instantly.

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

### Tests

```bash
cd backend
make test         # pytest -v
```

---

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/competitions` | List all StatsBomb competitions |
| `GET /api/matches?competition_id=&season_id=` | Matches for a season |
| `GET /api/match/{id}` | Full dashboard data |
| `GET /api/match/{id}/available-features` | Feature availability for the match |
| `GET /api/match/{id}/shot-analysis` | xG & shot breakdown |
| `GET /api/match/{id}/pass-network` | Pass network nodes & edges |
| `GET /api/match/{id}/heatmap` | Player touch heatmaps |
| `GET /api/match/{id}/player-stats` | Per-player stat table |
| `GET /api/match/{id}/pressure` | Pressure events & PPDA |
| `GET /api/match/{id}/defensive` | Tackles, interceptions, clearances |
| `GET /api/match/{id}/set-pieces` | Corner / free-kick breakdown |
| `GET /api/match/{id}/momentum` | Rolling event momentum |
| `GET /api/live/leagues` | ESPN league list |
| `GET /api/live/scoreboard?league_id=&date=` | Live or dated scoreboard |
| `GET /api/live/recent?league_id=` | Last 7 days of matches |
| `GET /api/live/match/{league_id}/{match_id}` | ESPN match detail |
| `GET /api/find-match?home_team=&away_team=&date=` | Fuzzy StatsBomb lookup |
| `GET /health` | Health check with cache & index status |

---

## Dashboard Pages

| Page | Data Required |
|------|--------------|
| Overview | All sources |
| xG Timeline | StatsBomb |
| Shot Analysis | StatsBomb |
| Pass Network | StatsBomb |
| Player Heatmaps | StatsBomb |
| Top Performers | StatsBomb |
| Duels & Pressure | StatsBomb |
| Defensive Actions | StatsBomb |
| Set Pieces | StatsBomb |
| Momentum | StatsBomb |
