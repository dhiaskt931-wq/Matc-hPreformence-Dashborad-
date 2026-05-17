from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from services.match_service import (
    get_competitions as sb_get_competitions,
    get_matches_list as sb_get_matches_list,
    get_match_data,
    get_shot_analysis,
    get_pass_network,
    get_heatmap,
    get_player_stats,
    get_pressure_duels,
    get_defensive_actions,
    get_set_pieces,
    get_momentum,
)
from services.espn_service import (
    get_leagues,
    get_scoreboard,
    get_recent_and_upcoming,
    get_match_summary,
)
import data_sources.understat as us
import data_sources.football_data_org as fdo
from data_sources.resolver import get_source, get_available_features, understat_id

app = FastAPI(title="Football Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:5174", "http://127.0.0.1:5174",
                   "http://localhost:5175", "http://127.0.0.1:5175"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Discovery endpoints ───────────────────────────────────────────────────────

@app.get("/api/competitions")
def competitions():
    sb = _run(sb_get_competitions)
    understat_comps = _run(us.get_competitions)
    fdo_comps = fdo.get_competitions()
    return sb + understat_comps + fdo_comps


@app.get("/api/matches")
def matches_list(competition_id: int, season_id: int):
    if competition_id >= 600:
        return _run(fdo.get_matches, competition_id, season_id)
    if competition_id >= 500:
        return _run(us.get_matches, competition_id, season_id)
    return _run(sb_get_matches_list, competition_id, season_id)


# ── Match data endpoints (source-routed) ─────────────────────────────────────

@app.get("/api/match/{match_id}/available-features")
def available_features(match_id: int):
    return get_available_features(match_id)


@app.get("/api/match/{match_id}")
def match(match_id: int):
    if get_source(match_id) == "understat":
        return _run(us.build_match_overview, understat_id(match_id))
    return _run(get_match_data, match_id)


@app.get("/api/match/{match_id}/shot-analysis")
def shot_analysis(match_id: int):
    if get_source(match_id) == "understat":
        return _run(us.build_shot_analysis, understat_id(match_id))
    return _run(get_shot_analysis, match_id)


@app.get("/api/match/{match_id}/player-stats")
def player_stats(match_id: int):
    if get_source(match_id) == "understat":
        return _run(us.build_player_stats, understat_id(match_id))
    return _run(get_player_stats, match_id)


@app.get("/api/match/{match_id}/set-pieces")
def set_pieces(match_id: int):
    if get_source(match_id) == "understat":
        return _run(us.build_set_pieces, understat_id(match_id))
    return _run(get_set_pieces, match_id)


@app.get("/api/match/{match_id}/pass-network")
def pass_network(match_id: int):
    if get_source(match_id) != "statsbomb":
        return us.UNAVAILABLE
    return _run(get_pass_network, match_id)


@app.get("/api/match/{match_id}/heatmap")
def heatmap(match_id: int):
    if get_source(match_id) != "statsbomb":
        return us.UNAVAILABLE
    return _run(get_heatmap, match_id)


@app.get("/api/match/{match_id}/pressure")
def pressure(match_id: int):
    if get_source(match_id) != "statsbomb":
        return us.UNAVAILABLE
    return _run(get_pressure_duels, match_id)


@app.get("/api/match/{match_id}/defensive")
def defensive(match_id: int):
    if get_source(match_id) != "statsbomb":
        return us.UNAVAILABLE
    return _run(get_defensive_actions, match_id)


@app.get("/api/match/{match_id}/momentum")
def momentum(match_id: int):
    if get_source(match_id) != "statsbomb":
        return us.UNAVAILABLE
    return _run(get_momentum, match_id)


# ── StatsBomb match lookup ────────────────────────────────────────────────────

@app.get("/api/find-match")
def find_match_api(home_team: str, away_team: str, date: str):
    from services.match_index import find_statsbomb_match, is_ready
    result = find_statsbomb_match(home_team, away_team, date)
    if result:
        return {"found": True, **result}
    return {"found": False, "building": not is_ready()}


# ── ESPN live / recent data endpoints ────────────────────────────────────────

@app.get("/api/live/leagues")
def live_leagues():
    return _run(get_leagues)


@app.get("/api/live/scoreboard")
def live_scoreboard(league_id: str, date: Optional[str] = None):
    return _run(get_scoreboard, league_id, date)


@app.get("/api/live/recent")
def live_recent(league_id: str):
    return _run(get_recent_and_upcoming, league_id)


@app.get("/api/live/match/{league_id}/{match_id}")
def live_match(league_id: str, match_id: str):
    return _run(get_match_summary, league_id, match_id)


@app.get("/health")
def health():
    return {"status": "ok"}
