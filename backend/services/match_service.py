import math
import numpy as np
import pandas as pd
from statsbombpy import sb


# ── discovery endpoints ───────────────────────────────────────────────────────

def get_competitions() -> list:
    comps = sb.competitions()
    result = []
    for _, row in comps.iterrows():
        result.append({
            "competition_id": int(row["competition_id"]),
            "season_id":      int(row["season_id"]),
            "competition_name": str(row["competition_name"]),
            "season_name":    str(row["season_name"]),
            "country_name":   str(row.get("country_name", "")),
            "gender":         str(row.get("competition_gender", "male")),
        })
    return sorted(result, key=lambda x: (x["competition_name"], x["season_name"]))


def get_matches_list(competition_id: int, season_id: int) -> list:
    matches = sb.matches(competition_id=competition_id, season_id=season_id)
    result = []
    for _, row in matches.iterrows():
        result.append({
            "match_id":   int(row["match_id"]),
            "home_team":  str(row["home_team"]),
            "away_team":  str(row["away_team"]),
            "home_score": int(row["home_score"]),
            "away_score": int(row["away_score"]),
            "match_date": str(row.get("match_date", "")),
            "stage":      str(row.get("competition_stage", "")),
            "stadium":    str(row.get("stadium", "")),
        })
    return sorted(result, key=lambda x: x["match_date"], reverse=True)


# ── helpers ───────────────────────────────────────────────────────────────────

_COMP_CACHE: dict[int, tuple[int, int]] = {3869685: (43, 106)}


def _find_comp(match_id: int) -> tuple[int, int]:
    if match_id in _COMP_CACHE:
        return _COMP_CACHE[match_id]
    for _, row in sb.competitions().iterrows():
        try:
            m = sb.matches(competition_id=int(row["competition_id"]), season_id=int(row["season_id"]))
            if match_id in m["match_id"].values:
                pair = (int(row["competition_id"]), int(row["season_id"]))
                _COMP_CACHE[match_id] = pair
                return pair
        except Exception:
            continue
    raise ValueError(f"Match {match_id} not found in any StatsBomb competition")


def _load(match_id: int):
    """Return (events, team1, team2, row) for any StatsBomb match."""
    events = sb.events(match_id=match_id)
    comp_id, season_id = _find_comp(match_id)
    matches = sb.matches(competition_id=comp_id, season_id=season_id)
    row = matches[matches["match_id"] == match_id].iloc[0]
    return events, str(row["home_team"]), str(row["away_team"]), row


def _loc_x(loc):
    return loc[0] if isinstance(loc, list) and len(loc) >= 2 else None


def _loc_y(loc):
    return loc[1] if isinstance(loc, list) and len(loc) >= 2 else None


# ── existing endpoints ────────────────────────────────────────────────────────

def get_match_data(match_id: int) -> dict:
    events, team1, team2, row = _load(match_id)
    score1 = int(row["home_score"])
    score2 = int(row["away_score"])
    return {
        "meta": _meta(row, team1, team2, score1, score2),
        "statBoxes": _stat_boxes(events, team1, team2),
        "topPlayers": _top_players(events, team1, team2),
        "shotMap": _shot_map(events),
        "matchStats": _match_stats(events, team1, team2),
        "xgFlow": _xg_flow(events, team1, team2),
        "goalkeepers": _goalkeepers(events, team1, team2),
    }


def _meta(row, team1, team2, score1, score2) -> dict:
    return {
        "team1": team1, "team2": team2,
        "score1": score1, "score2": score2,
        "venue": str(row.get("stadium", "Unknown Stadium")),
        "date": str(row.get("match_date", "")),
        "competition": str(row.get("competition", "")),
    }


def _stat_boxes(events, team1, team2) -> dict:
    reg = events[events["period"] != 5]
    shots = reg[reg["type"] == "Shot"]
    xg = shots.groupby("team")["shot_statsbomb_xg"].sum().round(2)
    poss = reg.groupby("possession_team")["id"].count()
    poss_pct = (poss / poss.sum() * 100).round(1)
    sot = shots[shots["shot_outcome"].isin(["Goal", "Saved"])].groupby("team")["id"].count()
    return {
        "xg": {team1: float(xg.get(team1, 0)), team2: float(xg.get(team2, 0))},
        "possession": {team1: float(poss_pct.get(team1, 0)), team2: float(poss_pct.get(team2, 0))},
        "shotsOnTarget": {team1: int(sot.get(team1, 0)), team2: int(sot.get(team2, 0))},
    }


def _top_players(events, team1, team2) -> dict:
    reg_shots = events[(events["type"] == "Shot") & (events["period"] != 5)]
    player_xg = (reg_shots.groupby(["team", "player"])["shot_statsbomb_xg"]
                 .sum().round(2).reset_index().rename(columns={"shot_statsbomb_xg": "xg"}))
    goals = (events[events["shot_outcome"] == "Goal"].groupby(["team", "player"])["id"]
             .count().reset_index().rename(columns={"id": "goals"}))
    assists = (events[events["pass_goal_assist"] == True].groupby(["team", "player"])["id"]
               .count().reset_index().rename(columns={"id": "assists"}))
    merged = (player_xg.merge(goals, on=["team", "player"], how="left")
              .merge(assists, on=["team", "player"], how="left").fillna(0))
    result = {}
    for team in [team1, team2]:
        top3 = (merged[merged["team"] == team]
                .sort_values(["goals", "xg"], ascending=False).head(3).reset_index(drop=True))
        result[team] = [{"player": r["player"], "xg": round(float(r["xg"]), 2),
                          "goals": int(r["goals"]), "assists": int(r["assists"])}
                         for _, r in top3.iterrows()]
    return result


def _shot_map(events) -> list:
    df = events[events["type"] == "Shot"][
        ["team", "shot_outcome", "shot_statsbomb_xg", "location", "shot_type"]].copy()
    df = df[df["shot_type"] != "Penalty"].copy()
    df["x"] = df["location"].apply(_loc_x)
    df["y"] = df["location"].apply(_loc_y)
    df = df.dropna(subset=["x", "y"])
    df["xg"] = df["shot_statsbomb_xg"].fillna(0).clip(lower=0)
    return [{"team": r["team"], "x": float(r["x"]), "y": float(r["y"]),
              "xg": float(r["xg"]), "outcome": r["shot_outcome"]} for _, r in df.iterrows()]


def _match_stats(events, team1, team2) -> dict:
    reg = events[events["period"] != 5]
    passes = reg[reg["type"] == "Pass"].groupby("team")["id"].count()
    fouls = reg[reg["type"] == "Foul Committed"].groupby("team")["id"].count()
    corners = reg[(reg["type"] == "Pass") & (reg["pass_type"] == "Corner")].groupby("team")["id"].count()
    recoveries = reg[reg["type"] == "Ball Recovery"].groupby("team")["id"].count()
    dribbles = reg[(reg["type"] == "Dribble") & (reg["dribble_outcome"] == "Complete")].groupby("team")["id"].count()
    result = {}
    for team in [team1, team2]:
        result[team] = {"passes": int(passes.get(team, 0)), "fouls": int(fouls.get(team, 0)),
                         "corners": int(corners.get(team, 0)), "recoveries": int(recoveries.get(team, 0)),
                         "dribbles": int(dribbles.get(team, 0))}
    return result


def _xg_flow(events, team1, team2) -> dict:
    shots = events[(events["type"] == "Shot") & (events["period"] != 5)].copy()
    result = {}
    for team in [team1, team2]:
        t = shots[shots["team"] == team].sort_values("minute").copy()
        t["cumxg"] = t["shot_statsbomb_xg"].cumsum().round(3)
        result[team] = [{"minute": int(r["minute"]), "cumxg": float(r["cumxg"]),
                          "isGoal": r["shot_outcome"] == "Goal", "player": str(r.get("player", "")),
                          "xg": float(r["shot_statsbomb_xg"])}
                         for _, r in t.iterrows()]
    return result


def _goalkeepers(events, team1, team2) -> list:
    reg = events[events["period"] != 5]
    gk_events = reg[reg["type"] == "Goal Keeper"]
    saves = (gk_events[gk_events["goalkeeper_type"] == "Shot Saved"]
             .groupby(["team", "player"])["id"].count().reset_index().rename(columns={"id": "saves"}))
    conceded = (gk_events[gk_events["goalkeeper_type"] == "Goal Conceded"]
                .groupby("team")["id"].count().reset_index().rename(columns={"id": "conceded"}))
    psxg = (reg[(reg["type"] == "Shot") & (reg["shot_outcome"].isin(["Goal", "Saved"]))]
            .groupby("team")["shot_statsbomb_xg"].sum().round(2)
            .reset_index().rename(columns={"shot_statsbomb_xg": "psxg_faced"}))
    pen_saved = (events[(events["period"] == 5) & (events["type"] == "Goal Keeper") &
                        (events["goalkeeper_type"] == "Shot Saved")]
                 .groupby("team")["id"].count().reset_index().rename(columns={"id": "penaltiesSaved"}))
    gk = (saves.merge(conceded, on="team", how="left").merge(psxg, on="team", how="left")
          .merge(pen_saved, on="team", how="left").fillna(0))
    gk["psxgPrevented"] = (gk["psxg_faced"] - gk["conceded"]).round(2)
    gk = gk[gk["team"].isin([team1, team2])]
    return [{"team": r["team"], "player": r["player"], "saves": int(r["saves"]),
              "conceded": int(r["conceded"]), "psxgPrevented": float(r["psxgPrevented"]),
              "penaltiesSaved": int(r["penaltiesSaved"])} for _, r in gk.iterrows()]


# ── new analysis endpoints ────────────────────────────────────────────────────

def get_shot_analysis(match_id: int) -> dict:
    events, team1, team2, _ = _load(match_id)
    shots = events[(events["type"] == "Shot") & (events["period"] != 5)].copy()
    shots["x"] = shots["location"].apply(_loc_x)
    shots["y"] = shots["location"].apply(_loc_y)
    shots = shots.dropna(subset=["x", "y"])
    # distance from centre of goal (120, 40)
    shots["distance"] = shots.apply(
        lambda r: round(math.sqrt((r["x"] - 120) ** 2 + (r["y"] - 40) ** 2), 1), axis=1)

    result = {}
    for team in [team1, team2]:
        t = shots[shots["team"] == team].copy()
        if t.empty:
            result[team] = {}
            continue

        # body part
        bp_col = "shot_body_part" if "shot_body_part" in t.columns else None
        body_parts = {}
        if bp_col:
            bp = t[bp_col].dropna().value_counts()
            body_parts = {str(k): int(v) for k, v in bp.items()}

        # distance bins (yards from goal)
        bins = [0, 6, 12, 18, 25, 200]
        labels = ["0–6", "6–12", "12–18", "18–25", "25+"]
        t = t.copy()
        t["dist_bin"] = pd.cut(t["distance"], bins=bins, labels=labels, right=False)
        dist_rows = []
        for lbl in labels:
            sub = t[t["dist_bin"] == lbl]
            dist_rows.append({
                "range": lbl,
                "shots": len(sub),
                "goals": int((sub["shot_outcome"] == "Goal").sum()),
                "xg": round(float(sub["shot_statsbomb_xg"].sum()), 2),
            })

        # zones: inside box x>102 & 18<y<62, penalty area x>114 & 30<y<50
        ib = t[(t["x"] > 102) & t["y"].between(18, 62)]
        ob = t[~((t["x"] > 102) & t["y"].between(18, 62))]

        # by half
        fh = t[t["minute"] <= 45]
        sh = t[t["minute"] > 45]

        # shot type
        st_col = "shot_type" if "shot_type" in t.columns else None
        shot_types = {}
        if st_col:
            st = t[st_col].dropna().value_counts()
            shot_types = {str(k): int(v) for k, v in st.items()}

        result[team] = {
            "total": len(t),
            "goals": int((t["shot_outcome"] == "Goal").sum()),
            "xg": round(float(t["shot_statsbomb_xg"].sum()), 2),
            "avgDistance": round(float(t["distance"].mean()), 1),
            "bodyParts": body_parts,
            "distanceBins": dist_rows,
            "zones": {
                "insideBox": {"shots": len(ib), "goals": int((ib["shot_outcome"] == "Goal").sum()),
                               "xg": round(float(ib["shot_statsbomb_xg"].sum()), 2)},
                "outsideBox": {"shots": len(ob), "goals": int((ob["shot_outcome"] == "Goal").sum()),
                                "xg": round(float(ob["shot_statsbomb_xg"].sum()), 2)},
            },
            "byHalf": {
                "first": {"shots": len(fh), "goals": int((fh["shot_outcome"] == "Goal").sum())},
                "second": {"shots": len(sh), "goals": int((sh["shot_outcome"] == "Goal").sum())},
            },
            "shotTypes": shot_types,
        }

    return {"team1": team1, "team2": team2, "analysis": result}


def get_pass_network(match_id: int) -> dict:
    events, team1, team2, _ = _load(match_id)
    reg = events[events["period"] != 5]

    # open-play passes only
    open_play = reg[
        (reg["type"] == "Pass") &
        (~reg["pass_type"].isin(["Corner", "Free Kick", "Throw-in", "Kick Off"]))
    ].copy() if "pass_type" in reg.columns else reg[reg["type"] == "Pass"].copy()

    result = {}
    for team in [team1, team2]:
        team_events = reg[reg["team"] == team].copy()
        team_events["x"] = team_events["location"].apply(_loc_x)
        team_events["y"] = team_events["location"].apply(_loc_y)
        team_events = team_events.dropna(subset=["x", "y"])

        # average position per player (top 11 by touch count)
        pos = (team_events.groupby("player")
               .agg(avg_x=("x", "mean"), avg_y=("y", "mean"), touches=("id", "count"))
               .reset_index())
        top11 = pos.nlargest(11, "touches")["player"].tolist()
        pos = pos[pos["player"].isin(top11)]

        # pass edges between top-11 players
        t_passes = open_play[(open_play["team"] == team) & open_play["player"].isin(top11)].copy()
        edges = []
        if "pass_recipient" in t_passes.columns:
            t_passes = t_passes.dropna(subset=["pass_recipient"])
            t_passes = t_passes[t_passes["pass_recipient"].isin(top11)]
            pairs = (t_passes.groupby(["player", "pass_recipient"])["id"]
                     .count().reset_index().rename(columns={"id": "count"}))
            pairs = pairs[pairs["count"] >= 3]
            edges = [{"from": r["player"], "to": r["pass_recipient"], "count": int(r["count"])}
                     for _, r in pairs.iterrows()]

        result[team] = {
            "nodes": [{"player": r["player"], "x": round(float(r["avg_x"]), 1),
                        "y": round(float(r["avg_y"]), 1), "touches": int(r["touches"])}
                       for _, r in pos.iterrows()],
            "edges": edges,
        }

    return {"team1": team1, "team2": team2, "networks": result}


def get_heatmap(match_id: int) -> dict:
    events, team1, team2, _ = _load(match_id)
    touch_types = ["Pass", "Carry", "Ball Receipt*", "Pressure", "Shot", "Dribble"]
    touches = events[events["type"].isin(touch_types)].copy()
    touches["x"] = touches["location"].apply(_loc_x)
    touches["y"] = touches["location"].apply(_loc_y)
    touches = touches.dropna(subset=["x", "y"])

    result = {}
    for team in [team1, team2]:
        t = touches[touches["team"] == team]
        top_players = (t.groupby("player")["id"].count().nlargest(15).index.tolist())
        player_data = {}
        for player in top_players:
            p = t[t["player"] == player]
            player_data[player] = {
                "count": len(p),
                "touches": [{"x": round(float(r["x"]), 1), "y": round(float(r["y"]), 1)}
                             for _, r in p.iterrows()],
            }
        result[team] = player_data

    return {"team1": team1, "team2": team2, "players": result}


def get_player_stats(match_id: int) -> dict:
    events, team1, team2, _ = _load(match_id)
    reg = events[events["period"] != 5]

    base = reg.groupby(["team", "player"])["id"].count().reset_index()[["team", "player"]]

    shots = reg[reg["type"] == "Shot"]
    xg = (shots.groupby(["team", "player"])["shot_statsbomb_xg"].sum().round(2)
          .reset_index().rename(columns={"shot_statsbomb_xg": "xg"}))
    shot_cnt = (shots.groupby(["team", "player"])["id"].count()
                .reset_index().rename(columns={"id": "shots"}))
    goals = (events[events["shot_outcome"] == "Goal"].groupby(["team", "player"])["id"]
             .count().reset_index().rename(columns={"id": "goals"}))
    assists = (events[events["pass_goal_assist"] == True].groupby(["team", "player"])["id"]
               .count().reset_index().rename(columns={"id": "assists"}))
    passes = (reg[reg["type"] == "Pass"].groupby(["team", "player"])["id"]
              .count().reset_index().rename(columns={"id": "passes"}))
    key_passes = pd.DataFrame(columns=["team", "player", "keyPasses"])
    if "pass_key_pass" in reg.columns:
        key_passes = (reg[reg["pass_key_pass"] == True].groupby(["team", "player"])["id"]
                      .count().reset_index().rename(columns={"id": "keyPasses"}))
    pressures = (reg[reg["type"] == "Pressure"].groupby(["team", "player"])["id"]
                 .count().reset_index().rename(columns={"id": "pressures"}))
    dribbles = (reg[(reg["type"] == "Dribble") & (reg["dribble_outcome"] == "Complete")]
                .groupby(["team", "player"])["id"].count().reset_index().rename(columns={"id": "dribbles"}))

    merged = (base
              .merge(xg, on=["team", "player"], how="left")
              .merge(shot_cnt, on=["team", "player"], how="left")
              .merge(goals, on=["team", "player"], how="left")
              .merge(assists, on=["team", "player"], how="left")
              .merge(passes, on=["team", "player"], how="left")
              .merge(key_passes, on=["team", "player"], how="left")
              .merge(pressures, on=["team", "player"], how="left")
              .merge(dribbles, on=["team", "player"], how="left")
              .fillna(0))

    rows = [{"team": r["team"], "player": r["player"],
              "xg": round(float(r["xg"]), 2), "shots": int(r["shots"]),
              "goals": int(r["goals"]), "assists": int(r["assists"]),
              "passes": int(r["passes"]), "keyPasses": int(r.get("keyPasses", 0)),
              "pressures": int(r["pressures"]), "dribbles": int(r["dribbles"])}
             for _, r in merged.iterrows()]

    return {"team1": team1, "team2": team2, "players": rows}


def get_pressure_duels(match_id: int) -> dict:
    events, team1, team2, _ = _load(match_id)
    reg = events[events["period"] != 5]

    # pressure locations
    press = reg[reg["type"] == "Pressure"].copy()
    press["x"] = press["location"].apply(_loc_x)
    press["y"] = press["location"].apply(_loc_y)
    press = press.dropna(subset=["x", "y"])

    # duels
    duel_stats = {}
    for team in [team1, team2]:
        t = reg[(reg["type"] == "Duel") & (reg["team"] == team)]
        won_vals = {"Won", "Success", "Success In Play", "Success Out"}
        lost_vals = {"Lost", "Fail"}
        won = int(t["duel_outcome"].isin(won_vals).sum()) if "duel_outcome" in t.columns else 0
        lost = int(t["duel_outcome"].isin(lost_vals).sum()) if "duel_outcome" in t.columns else 0
        total = len(t)
        duel_stats[team] = {"total": total, "won": won, "lost": lost,
                             "winPct": round(won / max(total, 1) * 100, 1)}

    # PPDA: attacking team passes in opp half / defending team's defensive actions
    def ppda(atk, dfd):
        atk_passes = reg[(reg["team"] == atk) & (reg["type"] == "Pass")]
        atk_opp = atk_passes[atk_passes["location"].apply(
            lambda l: l[0] > 60 if isinstance(l, list) else False)]
        def_actions = reg[(reg["team"] == dfd) &
                          (reg["type"].isin(["Pressure", "Duel", "Interception", "Foul Committed"]))]
        return round(len(atk_opp) / max(len(def_actions), 1), 2)

    return {
        "team1": team1, "team2": team2,
        "pressures": [{"team": r["team"], "x": float(r["x"]), "y": float(r["y"])}
                       for _, r in press.iterrows()],
        "duels": duel_stats,
        "ppda": {team1: ppda(team1, team2), team2: ppda(team2, team1)},
    }


def get_defensive_actions(match_id: int) -> dict:
    events, team1, team2, _ = _load(match_id)
    reg = events[events["period"] != 5]

    results = []
    for event_type in ["Pressure", "Block", "Interception", "Clearance"]:
        t = reg[reg["type"] == event_type].copy()
        t["x"] = t["location"].apply(_loc_x)
        t["y"] = t["location"].apply(_loc_y)
        t = t.dropna(subset=["x", "y"])
        for _, r in t.iterrows():
            results.append({"team": r["team"], "type": event_type.lower(),
                             "x": float(r["x"]), "y": float(r["y"])})

    # tackles from duel events
    tackles = reg[(reg["type"] == "Duel") &
                  (reg.get("duel_type", pd.Series(dtype=str)) == "Tackle")].copy() \
        if "duel_type" in reg.columns else pd.DataFrame()
    if not tackles.empty:
        tackles["x"] = tackles["location"].apply(_loc_x)
        tackles["y"] = tackles["location"].apply(_loc_y)
        tackles = tackles.dropna(subset=["x", "y"])
        for _, r in tackles.iterrows():
            results.append({"team": r["team"], "type": "tackle",
                             "x": float(r["x"]), "y": float(r["y"])})

    counts = {}
    for team in [team1, team2]:
        ta = [r for r in results if r["team"] == team]
        counts[team] = {t: len([r for r in ta if r["type"] == t])
                        for t in ["pressure", "block", "interception", "clearance", "tackle"]}

    return {"team1": team1, "team2": team2, "actions": results, "counts": counts}


def get_set_pieces(match_id: int) -> dict:
    events, team1, team2, _ = _load(match_id)
    reg = events[events["period"] != 5]

    corners = reg[(reg["type"] == "Pass") & (reg["pass_type"] == "Corner")].copy() \
        if "pass_type" in reg.columns else pd.DataFrame()
    fk_passes = reg[(reg["type"] == "Pass") & (reg["pass_type"] == "Free Kick")].copy() \
        if "pass_type" in reg.columns else pd.DataFrame()
    fk_shots = reg[(reg["type"] == "Shot") & (reg["shot_type"] == "Free Kick")].copy() \
        if "shot_type" in reg.columns else pd.DataFrame()
    sp_shots = reg[(reg["type"] == "Shot") &
                   (reg["shot_type"].isin(["Free Kick", "Corner"]))].copy() \
        if "shot_type" in reg.columns else pd.DataFrame()

    def to_locations(df, extra=None):
        if df.empty:
            return []
        df = df.copy()
        df["x"] = df["location"].apply(_loc_x)
        df["y"] = df["location"].apply(_loc_y)
        df = df.dropna(subset=["x", "y"])
        rows = []
        for _, r in df.iterrows():
            d = {"team": r["team"], "x": float(r["x"]), "y": float(r["y"])}
            if extra:
                for col, key in extra.items():
                    val = r.get(col)
                    if isinstance(val, list):
                        d[key] = val
                    elif pd.notna(val) if not isinstance(val, list) else True:
                        d[key] = val
            rows.append(d)
        return rows

    sp_xg = sp_shots.groupby("team")["shot_statsbomb_xg"].sum().round(2) if not sp_shots.empty else pd.Series()
    sp_goals = sp_shots[sp_shots["shot_outcome"] == "Goal"].groupby("team")["id"].count() if not sp_shots.empty else pd.Series()

    counts = {}
    for team in [team1, team2]:
        counts[team] = {
            "corners": int((corners["team"] == team).sum()) if not corners.empty else 0,
            "fkPasses": int((fk_passes["team"] == team).sum()) if not fk_passes.empty else 0,
            "fkShots": int((fk_shots["team"] == team).sum()) if not fk_shots.empty else 0,
            "spXg": float(sp_xg.get(team, 0)),
            "spGoals": int(sp_goals.get(team, 0)),
        }

    fk_shot_list = []
    if not fk_shots.empty:
        fk_shots = fk_shots.copy()
        fk_shots["x"] = fk_shots["location"].apply(_loc_x)
        fk_shots["y"] = fk_shots["location"].apply(_loc_y)
        fk_shots = fk_shots.dropna(subset=["x", "y"])
        fk_shot_list = [{"team": r["team"], "x": float(r["x"]), "y": float(r["y"]),
                          "xg": float(r.get("shot_statsbomb_xg", 0) or 0),
                          "goal": r["shot_outcome"] == "Goal"} for _, r in fk_shots.iterrows()]

    return {
        "team1": team1, "team2": team2,
        "corners": to_locations(corners),
        "fkShots": fk_shot_list,
        "counts": counts,
    }


def get_momentum(match_id: int) -> dict:
    events, team1, team2, _ = _load(match_id)
    reg = events[events["period"] != 5]

    # 3-minute bins across full match duration
    max_min = int(reg["minute"].max()) + 1
    bin_size = 3
    all_bins = list(range(0, max_min + bin_size, bin_size))

    reg = reg.copy()
    reg["bin"] = (reg["minute"] // bin_size) * bin_size

    team_bins = reg.groupby(["team", "bin"])["id"].count().reset_index()

    raw = {}
    for team in [team1, team2]:
        t = team_bins[team_bins["team"] == team].set_index("bin")["id"]
        raw[team] = [{"minute": b, "actions": int(t.get(b, 0))} for b in all_bins]

    # 5-bin Gaussian-ish smoothing (time-series-analysis skill: rolling window)
    def smooth(values, window=5):
        out = []
        for i, v in enumerate(values):
            s = max(0, i - window // 2)
            e = min(len(values), i + window // 2 + 1)
            out.append(round(sum(values[s:e]) / (e - s), 2))
        return out

    result = {}
    for team in [team1, team2]:
        vals = [d["actions"] for d in raw[team]]
        sm = smooth(vals)
        result[team] = [{"minute": raw[team][i]["minute"],
                          "actions": raw[team][i]["actions"], "smoothed": sm[i]}
                         for i in range(len(raw[team]))]

    return {"team1": team1, "team2": team2, "momentum": result}
