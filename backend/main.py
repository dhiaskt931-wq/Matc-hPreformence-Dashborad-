from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from services.match_service import (
    get_competitions,
    get_matches_list,
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

app = FastAPI(title="Football Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _run(fn, *args):
    try:
        return fn(*args)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/competitions")
def competitions():
    return _run(get_competitions)


@app.get("/api/matches")
def matches_list(competition_id: int, season_id: int):
    return _run(get_matches_list, competition_id, season_id)


@app.get("/api/match/{match_id}")
def match(match_id: int):
    return _run(get_match_data, match_id)


@app.get("/api/match/{match_id}/shot-analysis")
def shot_analysis(match_id: int):
    return _run(get_shot_analysis, match_id)


@app.get("/api/match/{match_id}/pass-network")
def pass_network(match_id: int):
    return _run(get_pass_network, match_id)


@app.get("/api/match/{match_id}/heatmap")
def heatmap(match_id: int):
    return _run(get_heatmap, match_id)


@app.get("/api/match/{match_id}/player-stats")
def player_stats(match_id: int):
    return _run(get_player_stats, match_id)


@app.get("/api/match/{match_id}/pressure")
def pressure(match_id: int):
    return _run(get_pressure_duels, match_id)


@app.get("/api/match/{match_id}/defensive")
def defensive(match_id: int):
    return _run(get_defensive_actions, match_id)


@app.get("/api/match/{match_id}/set-pieces")
def set_pieces(match_id: int):
    return _run(get_set_pieces, match_id)


@app.get("/api/match/{match_id}/momentum")
def momentum(match_id: int):
    return _run(get_momentum, match_id)


@app.get("/health")
def health():
    return {"status": "ok"}
