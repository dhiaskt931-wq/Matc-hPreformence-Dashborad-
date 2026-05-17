"""
StatsBomb match index — maps (home_team, away_team, date) → match_id.
Built once in a background thread and cached to disk.
"""

import json
import os
import re
import threading
from pathlib import Path

from statsbombpy import sb

_CACHE_PATH = Path(__file__).parent.parent / "statsbomb_cache.json"

_index: dict | None = None   # {"{ht}|{at}|{date}": match_id}
_building = False
_lock = threading.Lock()


def _normalize(name: str) -> str:
    name = name.lower().strip()
    # Common abbreviations / variant spellings
    subs = {
        "manchester city": "man city",
        "manchester united": "man united",
        "atletico": "atletico",
        "atlético": "atletico",
        "real madrid": "real madrid",
        "fc barcelona": "barcelona",
        "paris saint-germain": "paris saint germain",
        "psg": "paris saint germain",
        "bayern munich": "bayern munchen",
        "bayern münchen": "bayern munchen",
        "borussia dortmund": "dortmund",
        "inter milan": "internazionale",
        "ac milan": "milan",
    }
    for k, v in subs.items():
        name = name.replace(k, v)
    name = re.sub(r"[^a-z0-9 ]", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def _build_index() -> dict:
    global _building
    _building = True
    index = {}
    try:
        comps = sb.competitions()
        for _, c in comps.iterrows():
            try:
                matches = sb.matches(
                    competition_id=int(c["competition_id"]),
                    season_id=int(c["season_id"]),
                )
                for _, m in matches.iterrows():
                    ht = _normalize(str(m["home_team"]))
                    at = _normalize(str(m["away_team"]))
                    dt = str(m["match_date"])[:10]
                    key = f"{ht}|{at}|{dt}"
                    index[key] = {
                        "match_id": int(m["match_id"]),
                        "home_team": str(m["home_team"]),
                        "away_team": str(m["away_team"]),
                        "home_score": int(m.get("home_score", 0) or 0),
                        "away_score": int(m.get("away_score", 0) or 0),
                        "match_date": dt,
                        "competition_name": str(c.get("competition_name", "")),
                        "season_name": str(c.get("season_name", "")),
                        "competition_id": int(c["competition_id"]),
                        "season_id": int(c["season_id"]),
                    }
            except Exception:
                continue
        # Persist to disk
        _CACHE_PATH.write_text(json.dumps(index), encoding="utf-8")
    finally:
        _building = False
    return index


def _load_or_build():
    global _index
    # Try loading from disk cache first
    if _CACHE_PATH.exists():
        try:
            data = json.loads(_CACHE_PATH.read_text(encoding="utf-8"))
            with _lock:
                _index = data
            return
        except Exception:
            pass
    # Build in background
    def _bg():
        global _index
        built = _build_index()
        with _lock:
            _index = built
    t = threading.Thread(target=_bg, daemon=True)
    t.start()


def is_ready() -> bool:
    return _index is not None


def find_statsbomb_match(home_team: str, away_team: str, match_date: str) -> dict | None:
    if _index is None:
        return None

    ht = _normalize(home_team)
    at = _normalize(away_team)
    dt = (match_date or "")[:10]

    # Exact key
    exact = _index.get(f"{ht}|{at}|{dt}")
    if exact:
        return exact

    # Fuzzy: same date, partial team name overlap
    for key, val in _index.items():
    	parts = key.split("|")
    	if len(parts) != 3:
    		continue
    	h, a, d = parts
    	if d != dt:
    		continue
    	# Accept if one name contains the other or they share a significant word
    	if (ht in h or h in ht) and (at in a or a in at):
    		return val

    # Try reversed (home/away sometimes swapped in different sources)
    reversed_key = _index.get(f"{at}|{ht}|{dt}")
    if reversed_key:
        return reversed_key

    return None


def rebuild_index():
    """Force a rebuild (called from API endpoint)."""
    global _index
    built = _build_index()
    with _lock:
        _index = built
    return len(_index)


# Start loading on import
_load_or_build()
