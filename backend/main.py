import logging
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Path as FPath, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import data_sources.understat as us
import data_sources.football_data_org as fdo
from data_sources import cache
from data_sources.resolver import get_source_info, get_available_features
from services.match_index import find_statsbomb_match, is_ready
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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("football_api")

# ── CORS ─────────────────────────────────────────────────────────────────────

_allowed_origins = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if o.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Football Dashboard API starting up...")
    logger.info("CORS allowed origins: %s", _allowed_origins)
    yield
    logger.info("Football Dashboard API shutting down.")


app = FastAPI(title="Football Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


# ── Global error handlers ─────────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "Invalid request", "detail": str(exc.errors())},
    )


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Error in %s: %s", fn.__name__, e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Discovery endpoints ───────────────────────────────────────────────────────

@app.get("/api/competitions")
def competitions():
    cached = cache.get("competitions", "all", ttl=cache.TTL_TODAY)
    if cached is not None:
        return cached

    sources = {
        "statsbomb":        sb_get_competitions,
        "understat":        us.get_competitions,
        "football-data.org": lambda: fdo.get_competitions() if fdo.is_enabled() else [],
    }
    result = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(fn): name for name, fn in sources.items()}
        for future in as_completed(futures):
            source_name = futures[future]
            try:
                result.extend(future.result())
            except Exception as e:
                logger.warning("Failed to fetch competitions from %s: %s", source_name, e)

    cache.put("competitions", "all", result)
    return result


@app.get("/api/matches")
def matches_list(
    competition_id: int = Query(..., gt=0, description="Competition ID"),
    season_id:      int = Query(..., gt=0, description="Season ID"),
):
    if competition_id >= 600:
        return _run(fdo.get_matches, competition_id, season_id)
    if competition_id >= 500:
        return _run(us.get_matches, competition_id, season_id)
    return _run(sb_get_matches_list, competition_id, season_id)


# ── Match data endpoints (source-routed) ─────────────────────────────────────

@app.get("/api/match/{match_id}/available-features")
def available_features(match_id: int = FPath(..., gt=0, description="Match ID")):
    return get_available_features(match_id)


@app.get("/api/match/{match_id}")
def match(match_id: int = FPath(..., gt=0, description="Match ID")):
    info = get_source_info(match_id)
    if info.source == "understat":
        return _run(us.build_match_overview, info.native_id)
    return _run(get_match_data, match_id)


@app.get("/api/match/{match_id}/shot-analysis")
def shot_analysis(match_id: int = FPath(..., gt=0, description="Match ID")):
    info = get_source_info(match_id)
    if info.source == "understat":
        return _run(us.build_shot_analysis, info.native_id)
    return _run(get_shot_analysis, match_id)


@app.get("/api/match/{match_id}/player-stats")
def player_stats(match_id: int = FPath(..., gt=0, description="Match ID")):
    info = get_source_info(match_id)
    if info.source == "understat":
        return _run(us.build_player_stats, info.native_id)
    return _run(get_player_stats, match_id)


@app.get("/api/match/{match_id}/set-pieces")
def set_pieces(match_id: int = FPath(..., gt=0, description="Match ID")):
    info = get_source_info(match_id)
    if info.source == "understat":
        return _run(us.build_set_pieces, info.native_id)
    return _run(get_set_pieces, match_id)


@app.get("/api/match/{match_id}/pass-network")
def pass_network(match_id: int = FPath(..., gt=0, description="Match ID")):
    info = get_source_info(match_id)
    if info.source != "statsbomb":
        return us.UNAVAILABLE
    return _run(get_pass_network, match_id)


@app.get("/api/match/{match_id}/heatmap")
def heatmap(match_id: int = FPath(..., gt=0, description="Match ID")):
    info = get_source_info(match_id)
    if info.source != "statsbomb":
        return us.UNAVAILABLE
    return _run(get_heatmap, match_id)


@app.get("/api/match/{match_id}/pressure")
def pressure(match_id: int = FPath(..., gt=0, description="Match ID")):
    info = get_source_info(match_id)
    if info.source != "statsbomb":
        return us.UNAVAILABLE
    return _run(get_pressure_duels, match_id)


@app.get("/api/match/{match_id}/defensive")
def defensive(match_id: int = FPath(..., gt=0, description="Match ID")):
    info = get_source_info(match_id)
    if info.source != "statsbomb":
        return us.UNAVAILABLE
    return _run(get_defensive_actions, match_id)


@app.get("/api/match/{match_id}/momentum")
def momentum(match_id: int = FPath(..., gt=0, description="Match ID")):
    info = get_source_info(match_id)
    if info.source != "statsbomb":
        return us.UNAVAILABLE
    return _run(get_momentum, match_id)


# ── StatsBomb match lookup ────────────────────────────────────────────────────

@app.get("/api/find-match")
def find_match_api(home_team: str, away_team: str, date: str):
    result = find_statsbomb_match(home_team, away_team, date)
    if result:
        return {"found": True, **result}
    return {"found": False, "building": not is_ready()}


# ── ESPN live / recent data endpoints ────────────────────────────────────────

@app.get("/api/live/leagues")
def live_leagues():
    return _run(get_leagues)


@app.get("/api/live/scoreboard")
def live_scoreboard(
    league_id: str = Query(..., min_length=3, max_length=30, pattern=r"^[a-z0-9_.]+$"),
    date: Optional[str] = None,
):
    return _run(get_scoreboard, league_id, date)


@app.get("/api/live/recent")
def live_recent(
    league_id: str = Query(..., min_length=3, max_length=30, pattern=r"^[a-z0-9_.]+$"),
):
    return _run(get_recent_and_upcoming, league_id)


@app.get("/api/live/match/{league_id}/{match_id}")
def live_match(league_id: str, match_id: str):
    return _run(get_match_summary, league_id, match_id)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    checks: dict = {}
    checks["statsbomb_index"] = "ready" if is_ready() else "building"
    cache_dir = Path(__file__).parent / "cache"
    checks["cache_dir"] = "ok" if cache_dir.exists() and cache_dir.is_dir() else "missing"
    try:
        keys = list(cache_dir.glob("us_*")) if cache_dir.exists() else []
        checks["understat_cache"] = f"{len(keys)} cached items"
    except Exception:
        checks["understat_cache"] = "unknown"
    overall = "ok" if checks.get("statsbomb_index") in ("ready", "building") else "degraded"
    return {"status": overall, "checks": checks}
