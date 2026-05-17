"""Understat integration — shot-level data via HTML scraping."""
import re, json, math, time, threading, logging, requests
from datetime import datetime as _dt
from . import cache

logger = logging.getLogger(__name__)

UNDERSTAT_OFFSET = 50_000_000

LEAGUE_MAP = {
    501: {"name": "EPL",        "league": "EPL",       "country": "England"},
    502: {"name": "La Liga",    "league": "La_liga",   "country": "Spain"},
    503: {"name": "Bundesliga", "league": "Bundesliga","country": "Germany"},
    504: {"name": "Serie A",    "league": "Serie_A",   "country": "Italy"},
    505: {"name": "Ligue 1",    "league": "Ligue_1",   "country": "France"},
    506: {"name": "RFPL",       "league": "RFPL",      "country": "Russia"},
}

_RESULT_MAP = {
    "Goal":        "Goal",
    "SavedShot":   "Saved",
    "MissedShots": "Off T",
    "BlockedShot": "Blocked",
    "ShotOnPost":  "Post",
}

_SITUATION_MAP = {
    "OpenPlay":       "Open Play",
    "Corner":         "Corner",
    "DirectFreekick": "Direct Free Kick",
    "Penalty":        "Penalty",
    "SetPiece":       "Set Piece",
}

UNAVAILABLE = {
    "available": False,
    "source": "understat",
    "reason": (
        "This feature requires StatsBomb event data (pass/duel/pressure events with x/y coordinates). "
        "Understat provides shot-level data only."
    ),
}


def _extract(html: str, var_name: str):
    pattern = r"var\s+" + re.escape(var_name) + r"\s*=\s*JSON\.parse\('([\s\S]*?)'\)"
    m = re.search(pattern, html)
    if not m:
        logger.warning(
            "Understat HTML structure may have changed — could not find '%s'. "
            "Page preview: %.300s", var_name, html
        )
        raise ValueError(
            f"Could not find variable '{var_name}' in Understat HTML. "
            "The page structure may have changed."
        )
    raw = m.group(1).replace("\\'", "'")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse JSON from Understat variable '%s': %s", var_name, e)
        raise


_ratelimit_lock = threading.Lock()
_last_fetch_time = 0.0
_MIN_INTERVAL = 1.5  # seconds between requests


def _fetch_html(url: str) -> str:
    global _last_fetch_time
    with _ratelimit_lock:
        wait = _MIN_INTERVAL - (time.time() - _last_fetch_time)
        if wait > 0:
            time.sleep(wait)
        _last_fetch_time = time.time()

    last_exc: Exception | None = None
    for attempt in range(3):
        try:
            r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
            r.raise_for_status()
            return r.text
        except requests.RequestException as exc:
            last_exc = exc
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise last_exc  # type: ignore[misc]


def get_competitions() -> list:
    result = []
    _current_year = _dt.now().year
    for comp_id, info in LEAGUE_MAP.items():
        for year in range(2014, _current_year + 1):
            result.append({
                "competition_id": comp_id,
                "season_id": year,
                "competition_name": info["name"],
                "season_name": f"{year}/{str(year + 1)[2:]}",
                "country_name": info["country"],
                "gender": "male",
                "source": "understat",
            })
    return result


def get_matches(comp_id: int, season_id: int) -> list:
    info = LEAGUE_MAP.get(comp_id)
    if not info:
        return []
    league = info["league"]
    cache_key = f"{league}_{season_id}"
    cached = cache.get("us_matches", cache_key, ttl=3600)
    if cached is not None:
        return cached

    url = f"https://understat.com/league/{league}/{season_id}"
    html = _fetch_html(url)
    dates_data = _extract(html, "datesData")

    if isinstance(dates_data, dict):
        matches_raw = [m for day in dates_data.values() for m in day]
    else:
        matches_raw = dates_data

    result = []
    for m in matches_raw:
        if not m.get("isResult"):
            continue
        us_id = int(m["id"])
        goals = m.get("goals") or {}
        entry = {
            "match_id": us_id + UNDERSTAT_OFFSET,
            "home_team": m["h"]["title"],
            "away_team": m["a"]["title"],
            "home_score": int(goals.get("h") or 0),
            "away_score": int(goals.get("a") or 0),
            "match_date": (m.get("datetime") or "")[:10],
            "stage": "Regular Season",
            "stadium": "",
        }
        result.append(entry)
        # store per-match meta for later use
        cache.put("us_meta", str(us_id), {
            "home_team": m["h"]["title"],
            "away_team": m["a"]["title"],
            "home_score": int(goals.get("h") or 0),
            "away_score": int(goals.get("a") or 0),
            "match_date": (m.get("datetime") or "")[:10],
            "competition_name": info["name"],
        })

    result.sort(key=lambda x: x["match_date"], reverse=True)
    cache.put("us_matches", cache_key, result)
    return result


def _get_raw_shots(us_id: int) -> dict:
    cached = cache.get("us_shots", str(us_id), ttl=365 * 86400)
    if cached is not None:
        return cached
    url = f"https://understat.com/match/{us_id}"
    html = _fetch_html(url)
    shots = _extract(html, "shotsData")
    cache.put("us_shots", str(us_id), shots)
    return shots


def _parse_shots(raw: dict) -> tuple:
    """Returns (home_team, away_team, shots_list)."""
    home_team = ""
    away_team = ""
    shots_list = []

    for side in ("h", "a"):
        team_shots = raw.get(side) or []
        for s in team_shots:
            if not home_team and side == "h" and s.get("h_team"):
                home_team = s["h_team"]
            if not away_team and side == "a" and s.get("a_team"):
                away_team = s["a_team"]

            x_raw = float(s.get("X", 0))
            y_raw = float(s.get("Y", 0))

            if side == "h":
                x_sb = x_raw * 120
                y_sb = y_raw * 80
            else:
                x_sb = (1 - x_raw) * 120
                y_sb = y_raw * 80

            shots_list.append({
                "team": s.get("h_team") if side == "h" else s.get("a_team"),
                "x": x_sb,
                "y": y_sb,
                "xg": float(s.get("xG", 0)),
                "outcome": _RESULT_MAP.get(s.get("result", ""), s.get("result", "")),
                "player": s.get("player", ""),
                "minute": int(s.get("minute", 0)),
                "situation": _SITUATION_MAP.get(s.get("situation", ""), s.get("situation", "")),
                "shot_type": s.get("shotType", ""),
                "side": side,
            })

    # fallback: derive team names from first shots if not found
    if not home_team and raw.get("h"):
        home_team = raw["h"][0].get("h_team", "Home") if raw["h"] else "Home"
    if not away_team and raw.get("a"):
        away_team = raw["a"][0].get("a_team", "Away") if raw["a"] else "Away"

    return home_team, away_team, shots_list


def build_match_overview(us_id: int) -> dict:
    raw = _get_raw_shots(us_id)
    home_team, away_team, shots = _parse_shots(raw)

    # load meta from cache if available
    meta_cached = cache.get("us_meta", str(us_id), ttl=365 * 86400)
    if meta_cached:
        home_team = meta_cached.get("home_team", home_team)
        away_team = meta_cached.get("away_team", away_team)
        home_score = meta_cached.get("home_score", 0)
        away_score = meta_cached.get("away_score", 0)
        match_date = meta_cached.get("match_date", "")
        competition_name = meta_cached.get("competition_name", "Understat")
    else:
        home_score = sum(1 for s in shots if s["side"] == "h" and s["outcome"] == "Goal")
        away_score = sum(1 for s in shots if s["side"] == "a" and s["outcome"] == "Goal")
        match_date = ""
        competition_name = "Understat"

    t1, t2 = home_team, away_team

    # xG per team
    xg_t1 = round(sum(s["xg"] for s in shots if s["side"] == "h"), 2)
    xg_t2 = round(sum(s["xg"] for s in shots if s["side"] == "a"), 2)

    # shots on target
    sot_t1 = sum(1 for s in shots if s["side"] == "h" and s["outcome"] in ("Goal", "Saved"))
    sot_t2 = sum(1 for s in shots if s["side"] == "a" and s["outcome"] in ("Goal", "Saved"))

    # top players per team
    def _top_players(side):
        player_stats = {}
        for s in shots:
            if s["side"] != side:
                continue
            p = s["player"]
            if p not in player_stats:
                player_stats[p] = {"player": p, "goals": 0, "xg": 0.0}
            if s["outcome"] == "Goal":
                player_stats[p]["goals"] += 1
            player_stats[p]["xg"] += s["xg"]
        ranked = sorted(player_stats.values(), key=lambda x: (-x["goals"], -x["xg"]))[:3]
        return [{"player": r["player"], "goals": r["goals"], "xg": round(r["xg"], 2), "assists": 0} for r in ranked]

    # shot map (non-penalty shots)
    shot_map = [
        {"team": s["team"], "x": s["x"], "y": s["y"], "xg": s["xg"], "outcome": s["outcome"]}
        for s in shots if s["situation"] != "Penalty"
    ]

    # xG flow per team
    def _xg_flow(side):
        team_shots = [s for s in shots if s["side"] == side]
        team_shots.sort(key=lambda s: s["minute"])
        flow = []
        cumxg = 0.0
        for s in team_shots:
            cumxg += s["xg"]
            flow.append({
                "minute": s["minute"],
                "cumxg": round(cumxg, 3),
                "isGoal": s["outcome"] == "Goal",
                "player": s["player"],
                "xg": s["xg"],
            })
        return flow

    # goalkeepers: each keeper faces opponent shots
    gk = []
    for team, opp_side in ((t1, "a"), (t2, "h")):
        opp_shots = [s for s in shots if s["side"] == opp_side]
        saves = sum(1 for s in opp_shots if s["outcome"] == "Saved")
        conceded = sum(1 for s in opp_shots if s["outcome"] == "Goal")
        total_xg_faced = sum(s["xg"] for s in opp_shots)
        psxg_prevented = round(total_xg_faced - conceded, 2)
        gk.append({
            "team": team,
            "player": f"{team} GK",
            "nameUnavailable": True,
            "saves": saves,
            "conceded": conceded,
            "psxgPrevented": psxg_prevented,
        })

    return {
        "meta": {
            "team1": t1,
            "team2": t2,
            "score1": home_score,
            "score2": away_score,
            "venue": "—",
            "date": match_date,
            "competition": competition_name,
            "source": "understat",
        },
        "statBoxes": {
            "xg": {t1: xg_t1, t2: xg_t2},
            "possession": {t1: "—", t2: "—"},
            "shotsOnTarget": {t1: sot_t1, t2: sot_t2},
        },
        "topPlayers": {
            t1: _top_players("h"),
            t2: _top_players("a"),
        },
        "shotMap": shot_map,
        "matchStats": {
            t1: {"passes": 0, "fouls": 0, "corners": 0, "recoveries": 0, "dribbles": 0},
            t2: {"passes": 0, "fouls": 0, "corners": 0, "recoveries": 0, "dribbles": 0},
        },
        "xgFlow": {
            t1: _xg_flow("h"),
            t2: _xg_flow("a"),
        },
        "goalkeepers": gk,
    }


def build_shot_analysis(us_id: int) -> dict:
    raw = _get_raw_shots(us_id)
    home_team, away_team, shots = _parse_shots(raw)
    t1, t2 = home_team, away_team

    def _dist(s):
        if s["side"] == "h":
            return math.sqrt((s["x"] - 120) ** 2 + (s["y"] - 40) ** 2)
        else:
            return math.sqrt((s["x"] - 0) ** 2 + (s["y"] - 40) ** 2)

    def _in_box(s):
        if s["side"] == "h":
            return s["x"] > 102 and 18 < s["y"] < 62
        else:
            return s["x"] < 18 and 18 < s["y"] < 62

    def _analyse(side):
        team_shots = [s for s in shots if s["side"] == side]
        total = len(team_shots)
        goals = sum(1 for s in team_shots if s["outcome"] == "Goal")
        xg = round(sum(s["xg"] for s in team_shots), 2)
        distances = [_dist(s) for s in team_shots]
        avg_dist = round(sum(distances) / len(distances), 1) if distances else 0.0

        # body parts
        body_parts = {}
        for s in team_shots:
            bp = s["shot_type"] or "Unknown"
            body_parts[bp] = body_parts.get(bp, 0) + 1

        # distance bins
        bins = {"0-6": 0, "6-12": 0, "12-18": 0, "18-25": 0, "25+": 0}
        for d in distances:
            if d < 6:
                bins["0-6"] += 1
            elif d < 12:
                bins["6-12"] += 1
            elif d < 18:
                bins["12-18"] += 1
            elif d < 25:
                bins["18-25"] += 1
            else:
                bins["25+"] += 1

        # zones
        in_box = sum(1 for s in team_shots if _in_box(s))
        out_box = total - in_box
        zones = {"Inside Box": in_box, "Outside Box": out_box}

        # by half
        first = [s for s in team_shots if s["minute"] <= 45]
        second = [s for s in team_shots if s["minute"] > 45]
        by_half = {
            "First Half": {"shots": len(first), "xg": round(sum(s["xg"] for s in first), 2), "goals": sum(1 for s in first if s["outcome"] == "Goal")},
            "Second Half": {"shots": len(second), "xg": round(sum(s["xg"] for s in second), 2), "goals": sum(1 for s in second if s["outcome"] == "Goal")},
        }

        # shot types (situation)
        shot_types = {}
        for s in team_shots:
            sit = s["situation"] or "Unknown"
            shot_types[sit] = shot_types.get(sit, 0) + 1

        return {
            "total": total,
            "goals": goals,
            "xg": xg,
            "avgDistance": avg_dist,
            "bodyParts": body_parts,
            "distanceBins": bins,
            "zones": zones,
            "byHalf": by_half,
            "shotTypes": shot_types,
        }

    return {
        "team1": t1,
        "team2": t2,
        "analysis": {
            t1: _analyse("h"),
            t2: _analyse("a"),
        },
    }


def build_player_stats(us_id: int) -> dict:
    raw = _get_raw_shots(us_id)
    home_team, away_team, shots = _parse_shots(raw)
    t1, t2 = home_team, away_team

    player_data = {}
    for s in shots:
        key = (s["team"], s["player"])
        if key not in player_data:
            player_data[key] = {
                "team": s["team"],
                "player": s["player"],
                "xg": 0.0,
                "shots": 0,
                "goals": 0,
                "assists": 0,
                "passes": 0,
                "keyPasses": 0,
                "pressures": 0,
                "dribbles": 0,
            }
        player_data[key]["shots"] += 1
        player_data[key]["xg"] += s["xg"]
        if s["outcome"] == "Goal":
            player_data[key]["goals"] += 1

    players = []
    for entry in player_data.values():
        entry["xg"] = round(entry["xg"], 2)
        players.append(entry)

    players.sort(key=lambda x: (-x["xg"], -x["shots"]))

    return {
        "team1": t1,
        "team2": t2,
        "players": players,
    }


def build_set_pieces(us_id: int) -> dict:
    raw = _get_raw_shots(us_id)
    home_team, away_team, shots = _parse_shots(raw)
    t1, t2 = home_team, away_team

    fk_shots = [
        {
            "team": s["team"],
            "x": s["x"],
            "y": s["y"],
            "xg": s["xg"],
            "goal": s["outcome"] == "Goal",
        }
        for s in shots if s["situation"] == "Direct Free Kick"
    ]

    def _counts(side, team):
        team_shots = [s for s in shots if s["side"] == side]
        corner_shots = [s for s in team_shots if s["situation"] == "Corner"]
        fk = [s for s in team_shots if s["situation"] == "Direct Free Kick"]
        sp_shots = [s for s in team_shots if s["situation"] in ("Corner", "Direct Free Kick", "Set Piece")]
        return {
            "corners": len(corner_shots),
            "fkPasses": 0,
            "fkShots": len(fk),
            "spXg": round(sum(s["xg"] for s in sp_shots), 2),
            "spGoals": sum(1 for s in sp_shots if s["outcome"] == "Goal"),
        }

    return {
        "team1": t1,
        "team2": t2,
        "corners": [],
        "fkShots": fk_shots,
        "counts": {
            t1: _counts("h", t1),
            t2: _counts("a", t2),
        },
    }
