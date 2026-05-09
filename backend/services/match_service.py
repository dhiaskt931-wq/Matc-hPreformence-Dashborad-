import numpy as np
import pandas as pd
from statsbombpy import sb


def get_match_data(match_id: int) -> dict:
    events = sb.events(match_id=match_id)
    matches = sb.matches(competition_id=43, season_id=106)
    match_row = matches[matches["match_id"] == match_id].iloc[0]

    team1 = match_row["home_team"]
    team2 = match_row["away_team"]
    score1 = int(match_row["home_score"])
    score2 = int(match_row["away_score"])

    return {
        "meta": _meta(match_row, team1, team2, score1, score2),
        "statBoxes": _stat_boxes(events, team1, team2),
        "topPlayers": _top_players(events, team1, team2),
        "shotMap": _shot_map(events),
        "matchStats": _match_stats(events, team1, team2),
        "xgFlow": _xg_flow(events, team1, team2),
        "goalkeepers": _goalkeepers(events, team1, team2),
    }


def _meta(row, team1, team2, score1, score2) -> dict:
    return {
        "team1": team1,
        "team2": team2,
        "score1": score1,
        "score2": score2,
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
    sot = (
        shots[shots["shot_outcome"].isin(["Goal", "Saved"])]
        .groupby("team")["id"]
        .count()
    )

    return {
        "xg": {team1: float(xg.get(team1, 0)), team2: float(xg.get(team2, 0))},
        "possession": {
            team1: float(poss_pct.get(team1, 0)),
            team2: float(poss_pct.get(team2, 0)),
        },
        "shotsOnTarget": {
            team1: int(sot.get(team1, 0)),
            team2: int(sot.get(team2, 0)),
        },
    }


def _top_players(events, team1, team2) -> dict:
    reg_shots = events[(events["type"] == "Shot") & (events["period"] != 5)]
    player_xg = (
        reg_shots.groupby(["team", "player"])["shot_statsbomb_xg"]
        .sum()
        .round(2)
        .reset_index()
        .rename(columns={"shot_statsbomb_xg": "xg"})
    )
    goals = (
        events[events["shot_outcome"] == "Goal"]
        .groupby(["team", "player"])["id"]
        .count()
        .reset_index()
        .rename(columns={"id": "goals"})
    )
    assists = (
        events[events["pass_goal_assist"] == True]
        .groupby(["team", "player"])["id"]
        .count()
        .reset_index()
        .rename(columns={"id": "assists"})
    )
    merged = (
        player_xg.merge(goals, on=["team", "player"], how="left")
        .merge(assists, on=["team", "player"], how="left")
        .fillna(0)
    )

    result = {}
    for team in [team1, team2]:
        top3 = (
            merged[merged["team"] == team]
            .sort_values(["goals", "xg"], ascending=False)
            .head(3)
            .reset_index(drop=True)
        )
        result[team] = [
            {
                "player": row["player"],
                "xg": round(float(row["xg"]), 2),
                "goals": int(row["goals"]),
                "assists": int(row["assists"]),
            }
            for _, row in top3.iterrows()
        ]
    return result


def _shot_map(events) -> list:
    df = events[events["type"] == "Shot"][
        ["team", "shot_outcome", "shot_statsbomb_xg", "location", "shot_type"]
    ].copy()
    df = df[df["shot_type"] != "Penalty"].copy()
    df["x"] = df["location"].apply(lambda l: l[0] if isinstance(l, list) else None)
    df["y"] = df["location"].apply(lambda l: l[1] if isinstance(l, list) else None)
    df = df.dropna(subset=["x", "y"])
    df["xg"] = df["shot_statsbomb_xg"].fillna(0).clip(lower=0)

    return [
        {
            "team": row["team"],
            "x": float(row["x"]),
            "y": float(row["y"]),
            "xg": float(row["xg"]),
            "outcome": row["shot_outcome"],
        }
        for _, row in df.iterrows()
    ]


def _match_stats(events, team1, team2) -> dict:
    reg = events[events["period"] != 5]
    passes = reg[reg["type"] == "Pass"].groupby("team")["id"].count()
    fouls = reg[reg["type"] == "Foul Committed"].groupby("team")["id"].count()
    corners = (
        reg[(reg["type"] == "Pass") & (reg["pass_type"] == "Corner")]
        .groupby("team")["id"]
        .count()
    )
    recoveries = reg[reg["type"] == "Ball Recovery"].groupby("team")["id"].count()
    dribbles = (
        reg[
            (reg["type"] == "Dribble") & (reg["dribble_outcome"] == "Complete")
        ]
        .groupby("team")["id"]
        .count()
    )

    result = {}
    for team in [team1, team2]:
        result[team] = {
            "passes": int(passes.get(team, 0)),
            "fouls": int(fouls.get(team, 0)),
            "corners": int(corners.get(team, 0)),
            "recoveries": int(recoveries.get(team, 0)),
            "dribbles": int(dribbles.get(team, 0)),
        }
    return result


def _xg_flow(events, team1, team2) -> dict:
    shots = events[events["type"] == "Shot"].copy()
    shots = shots[shots["period"] != 5]

    result = {}
    for team in [team1, team2]:
        t = shots[shots["team"] == team].sort_values("minute").copy()
        t["cumxg"] = t["shot_statsbomb_xg"].cumsum().round(3)
        result[team] = [
            {
                "minute": int(row["minute"]),
                "cumxg": float(row["cumxg"]),
                "isGoal": row["shot_outcome"] == "Goal",
            }
            for _, row in t.iterrows()
        ]
    return result


def _goalkeepers(events, team1, team2) -> list:
    reg = events[events["period"] != 5]
    gk_events = reg[reg["type"] == "Goal Keeper"]

    saves = (
        gk_events[gk_events["goalkeeper_type"] == "Shot Saved"]
        .groupby(["team", "player"])["id"]
        .count()
        .reset_index()
        .rename(columns={"id": "saves"})
    )
    conceded = (
        gk_events[gk_events["goalkeeper_type"] == "Goal Conceded"]
        .groupby("team")["id"]
        .count()
        .reset_index()
        .rename(columns={"id": "conceded"})
    )
    psxg = (
        reg[
            (reg["type"] == "Shot")
            & (reg["shot_outcome"].isin(["Goal", "Saved"]))
        ]
        .groupby("team")["shot_statsbomb_xg"]
        .sum()
        .round(2)
        .reset_index()
        .rename(columns={"shot_statsbomb_xg": "psxg_faced"})
    )
    pen_saved = (
        events[
            (events["period"] == 5)
            & (events["type"] == "Goal Keeper")
            & (events["goalkeeper_type"] == "Shot Saved")
        ]
        .groupby("team")["id"]
        .count()
        .reset_index()
        .rename(columns={"id": "penaltiesSaved"})
    )

    gk = (
        saves.merge(conceded, on="team", how="left")
        .merge(psxg, on="team", how="left")
        .merge(pen_saved, on="team", how="left")
        .fillna(0)
    )
    gk["psxgPrevented"] = (gk["psxg_faced"] - gk["conceded"]).round(2)
    gk = gk[gk["team"].isin([team1, team2])]

    return [
        {
            "team": row["team"],
            "player": row["player"],
            "saves": int(row["saves"]),
            "conceded": int(row["conceded"]),
            "psxgPrevented": float(row["psxgPrevented"]),
            "penaltiesSaved": int(row["penaltiesSaved"]),
        }
        for _, row in gk.iterrows()
    ]
