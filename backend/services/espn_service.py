"""
ESPN public API integration — no auth required.
Provides live scores, recent results, and match stats for 20+ leagues.
"""

import urllib.request
import json
from datetime import datetime, timedelta

_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer"

LEAGUES = [
    # Top 5 European
    {"id": "eng.1",             "name": "Premier League",       "country": "England",      "group": "Top Leagues"},
    {"id": "esp.1",             "name": "La Liga",              "country": "Spain",        "group": "Top Leagues"},
    {"id": "ger.1",             "name": "Bundesliga",           "country": "Germany",      "group": "Top Leagues"},
    {"id": "ita.1",             "name": "Serie A",              "country": "Italy",        "group": "Top Leagues"},
    {"id": "fra.1",             "name": "Ligue 1",              "country": "France",       "group": "Top Leagues"},
    # Europe
    {"id": "uefa.champions",    "name": "Champions League",     "country": "UEFA",         "group": "Europe"},
    {"id": "uefa.europa",       "name": "Europa League",        "country": "UEFA",         "group": "Europe"},
    {"id": "uefa.europa.conf",  "name": "Conference League",    "country": "UEFA",         "group": "Europe"},
    {"id": "eng.2",             "name": "Championship",         "country": "England",      "group": "Europe"},
    {"id": "esp.2",             "name": "Segunda División",     "country": "Spain",        "group": "Europe"},
    {"id": "ger.2",             "name": "2. Bundesliga",        "country": "Germany",      "group": "Europe"},
    {"id": "ita.2",             "name": "Serie B",              "country": "Italy",        "group": "Europe"},
    {"id": "por.1",             "name": "Primeira Liga",        "country": "Portugal",     "group": "Europe"},
    {"id": "ned.1",             "name": "Eredivisie",           "country": "Netherlands",  "group": "Europe"},
    {"id": "tur.1",             "name": "Süper Lig",            "country": "Turkey",       "group": "Europe"},
    {"id": "sco.1",             "name": "Scottish Premiership", "country": "Scotland",     "group": "Europe"},
    {"id": "bel.1",             "name": "Pro League",           "country": "Belgium",      "group": "Europe"},
    # Americas
    {"id": "usa.1",             "name": "MLS",                  "country": "USA",          "group": "Americas"},
    {"id": "mex.1",             "name": "Liga MX",              "country": "Mexico",       "group": "Americas"},
    {"id": "bra.1",             "name": "Brasileirão",          "country": "Brazil",       "group": "Americas"},
    {"id": "arg.1",             "name": "Liga Profesional",     "country": "Argentina",    "group": "Americas"},
    {"id": "col.1",             "name": "Liga BetPlay",         "country": "Colombia",     "group": "Americas"},
    # International
    {"id": "fifa.world",        "name": "FIFA World Cup",       "country": "FIFA",         "group": "International"},
    {"id": "conmebol.america",  "name": "Copa América",         "country": "CONMEBOL",     "group": "International"},
    {"id": "uefa.euro",         "name": "UEFA Euro",            "country": "UEFA",         "group": "International"},
    # Asia / Other
    {"id": "sau.1",             "name": "Saudi Pro League",     "country": "Saudi Arabia", "group": "Asia & Other"},
    {"id": "jpn.1",             "name": "J1 League",            "country": "Japan",        "group": "Asia & Other"},
    {"id": "aus.1",             "name": "A-League",             "country": "Australia",    "group": "Asia & Other"},
]

LEAGUE_MAP = {lg["id"]: lg for lg in LEAGUES}


def _fetch(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def _parse_event(event: dict, league_id: str) -> dict:
    comp = event.get("competitions", [{}])[0]
    status = event.get("status", {})
    status_type = status.get("type", {})

    competitors = comp.get("competitors", [])
    home = next((c for c in competitors if c.get("homeAway") == "home"), competitors[0] if competitors else {})
    away = next((c for c in competitors if c.get("homeAway") == "away"), competitors[1] if len(competitors) > 1 else {})

    venue = comp.get("venue", {})

    return {
        "match_id":       event.get("id"),
        "league_id":      league_id,
        "league_name":    LEAGUE_MAP.get(league_id, {}).get("name", league_id),
        "home_team":      home.get("team", {}).get("displayName", ""),
        "away_team":      away.get("team", {}).get("displayName", ""),
        "home_team_short": home.get("team", {}).get("abbreviation", ""),
        "away_team_short": away.get("team", {}).get("abbreviation", ""),
        "home_score":     int(home.get("score", 0) or 0),
        "away_score":     int(away.get("score", 0) or 0),
        "home_logo":      home.get("team", {}).get("logo", ""),
        "away_logo":      away.get("team", {}).get("logo", ""),
        "status":         status_type.get("description", ""),
        "status_short":   status_type.get("shortDetail", ""),
        "clock":          status.get("displayClock", ""),
        "period":         status.get("period", 0),
        "is_live":        status_type.get("state") == "in",
        "is_final":       status_type.get("completed", False),
        "match_date":     event.get("date", ""),
        "venue":          venue.get("fullName", ""),
        "source":         "espn",
    }


def get_leagues() -> list:
    return LEAGUES


def get_scoreboard(league_id: str, date: str | None = None) -> list:
    """
    Returns matches for a league on a given date (YYYYMMDD).
    Defaults to today. Also fetches yesterday + tomorrow for richer results.
    """
    base_url = f"{_BASE}/{league_id}/scoreboard"
    if date:
        url = f"{base_url}?dates={date}"
    else:
        url = base_url

    try:
        data = _fetch(url)
        events = data.get("events", [])
        return [_parse_event(e, league_id) for e in events]
    except Exception:
        return []


def get_recent_and_upcoming(league_id: str) -> list:
    """Fetches last 7 days + next 7 days for a league."""
    today = datetime.utcnow()
    results = []
    for delta in range(-7, 8):
        d = (today + timedelta(days=delta)).strftime("%Y%m%d")
        results.extend(get_scoreboard(league_id, d))

    # De-duplicate by match_id
    seen = set()
    unique = []
    for m in results:
        if m["match_id"] not in seen:
            seen.add(m["match_id"])
            unique.append(m)
    return sorted(unique, key=lambda x: x["match_date"], reverse=True)


def get_match_summary(league_id: str, match_id: str) -> dict:
    """Returns full stats for one ESPN match."""
    url = f"{_BASE}/{league_id}/summary?event={match_id}"
    try:
        data = _fetch(url)
    except Exception as e:
        return {"error": str(e)}

    # Header
    header = data.get("header", {})
    competitions = header.get("competitions", [{}])
    comp = competitions[0] if competitions else {}
    competitors = comp.get("competitors", [])
    home = next((c for c in competitors if c.get("homeAway") == "home"), {})
    away = next((c for c in competitors if c.get("homeAway") == "away"), {})

    status = comp.get("status", {})
    status_type = status.get("type", {})
    venue = data.get("gameInfo", {}).get("venue", {})

    meta = {
        "match_id":    match_id,
        "league_id":   league_id,
        "team1":       home.get("team", {}).get("displayName", ""),
        "team2":       away.get("team", {}).get("displayName", ""),
        "score1":      int(home.get("score", 0) or 0),
        "score2":      int(away.get("score", 0) or 0),
        "status":      status_type.get("description", ""),
        "is_live":     status_type.get("state") == "in",
        "clock":       status.get("displayClock", ""),
        "venue":       venue.get("fullName", ""),
        "date":        comp.get("date", "")[:10] if comp.get("date") else "",
        "competition": LEAGUE_MAP.get(league_id, {}).get("name", league_id),
        "source":      "espn",
    }

    # Stats from boxscore
    stats = {"team1": {}, "team2": {}}
    stat_key_map = {
        "Fouls":              "fouls",
        "Yellow Cards":       "yellow_cards",
        "Red Cards":          "red_cards",
        "Offsides":           "offsides",
        "Corner Kicks":       "corners",
        "Saves":              "saves",
        "Possession":         "possession",
        "SHOTS":              "shots",
        "ON GOAL":            "shots_on_target",
        "Accurate Passes":    "accurate_passes",
        "Passes":             "passes",
        "Pass Completion %":  "pass_pct",
        "Accurate Crosses":   "accurate_crosses",
        "Crosses":            "crosses",
        "Effective Tackles":  "tackles",
        "Interceptions":      "interceptions",
        "Effective Clearances": "clearances",
        "Blocked Shots":      "blocked_shots",
    }
    boxscore = data.get("boxscore", {})
    for i, team_data in enumerate(boxscore.get("teams", [])):
        team_name = team_data.get("team", {}).get("displayName", "")
        key = "team1" if team_name == meta["team1"] else "team2"
        for stat in team_data.get("statistics", []):
            label = stat.get("label", "")
            raw   = stat.get("displayValue", "0")
            mapped = stat_key_map.get(label)
            if mapped:
                try:
                    val = float(raw)
                    if mapped in ("possession", "pass_pct"):
                        val = round(val * 100, 1) if val <= 1 else round(val, 1)
                    else:
                        val = int(val)
                    stats[key][mapped] = val
                except ValueError:
                    stats[key][mapped] = raw

    # Goal scorers from details
    scorers = []
    for detail in comp.get("details", []) if isinstance(comp.get("details"), list) else []:
        if detail.get("type", {}).get("id") in ("100", "98", "70"):
            athletes = detail.get("athletesInvolved", [])
            if athletes:
                team_id = detail.get("team", {}).get("id", "")
                home_id = home.get("team", {}).get("id", "")
                scorers.append({
                    "player": athletes[0].get("displayName", ""),
                    "minute": detail.get("clock", {}).get("displayValue", ""),
                    "team":   meta["team1"] if team_id == home_id else meta["team2"],
                    "type":   detail.get("type", {}).get("text", "Goal"),
                })

    return {
        "meta":    meta,
        "stats":   stats,
        "scorers": scorers,
        "source":  "espn",
    }
