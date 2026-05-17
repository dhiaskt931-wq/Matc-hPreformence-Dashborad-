"""
football-data.org integration.
Requires FOOTBALL_DATA_API_KEY environment variable (free tier — register at football-data.org).
Without key, this source is disabled and returns empty results.
"""
import os, requests
from . import cache

_BASE = "https://api.football-data.org/v4"
_KEY = os.getenv("FOOTBALL_DATA_API_KEY", "")

FDO_COMPS = {
    600: {"code": "PL",  "name": "Premier League",   "country": "England"},
    601: {"code": "PD",  "name": "La Liga",           "country": "Spain"},
    602: {"code": "BL1", "name": "Bundesliga",        "country": "Germany"},
    603: {"code": "SA",  "name": "Serie A",           "country": "Italy"},
    604: {"code": "FL1", "name": "Ligue 1",           "country": "France"},
    605: {"code": "CL",  "name": "Champions League",  "country": "Europe"},
}
FDO_OFFSET = 90_000_000


def is_enabled() -> bool:
    return bool(_KEY)


def get_competitions() -> list:
    if not is_enabled():
        return []
    result = []
    for comp_id, info in FDO_COMPS.items():
        for year in range(2020, 2026):
            result.append({
                "competition_id": comp_id,
                "season_id": year,
                "competition_name": f"{info['name']} (FDO)",
                "season_name": f"{year}/{str(year+1)[2:]}",
                "country_name": info["country"],
                "gender": "male",
                "source": "football-data.org",
            })
    return result


def get_matches(comp_id: int, season_id: int) -> list:
    if not is_enabled():
        return []
    info = FDO_COMPS.get(comp_id)
    if not info:
        return []
    cached = cache.get("fdo_matches", f"{info['code']}_{season_id}", ttl=3600)
    if cached is not None:
        return cached
    try:
        r = requests.get(
            f"{_BASE}/competitions/{info['code']}/matches?season={season_id}",
            headers={"X-Auth-Token": _KEY, "Accept": "application/json"},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
    except Exception:
        return []
    result = []
    for m in data.get("matches", []):
        if m.get("status") != "FINISHED":
            continue
        fdo_id = int(m["id"])
        hs = m.get("score", {}).get("fullTime", {})
        result.append({
            "match_id": fdo_id + FDO_OFFSET,
            "home_team": m["homeTeam"]["name"],
            "away_team": m["awayTeam"]["name"],
            "home_score": int(hs.get("home") or 0),
            "away_score": int(hs.get("away") or 0),
            "match_date": (m.get("utcDate") or "")[:10],
            "stage": m.get("stage", ""),
            "stadium": "",
        })
    result.sort(key=lambda x: x["match_date"], reverse=True)
    cache.put("fdo_matches", f"{info['code']}_{season_id}", result)
    return result
