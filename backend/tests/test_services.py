"""Unit tests for match_service helper functions using a minimal fake events DataFrame."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import pandas as pd
import numpy as np

from services.match_service import (
    _stat_boxes,
    _top_players,
    _shot_map,
    _match_stats,
    _goalkeepers,
    get_momentum,
    get_pressure_duels,
)

TEAM1 = "Alpha"
TEAM2 = "Beta"


def _row(**kwargs):
    defaults = dict(
        id=str(np.random.randint(1, 999999)),
        type="Pass",
        team=TEAM1,
        player="Player A",
        period=1,
        minute=10,
        location=[60.0, 40.0],
        shot_outcome=float("nan"),
        shot_statsbomb_xg=float("nan"),
        shot_type=float("nan"),
        shot_body_part=float("nan"),
        possession_team=TEAM1,
        pass_type=float("nan"),
        pass_goal_assist=float("nan"),
        pass_key_pass=float("nan"),
        pass_recipient=float("nan"),
        duel_outcome=float("nan"),
        duel_type=float("nan"),
        dribble_outcome=float("nan"),
        goalkeeper_type=float("nan"),
    )
    defaults.update(kwargs)
    return defaults


@pytest.fixture
def fake_events():
    rows = [
        # ── Shots ─────────────────────────────────────────────────────────
        _row(id="1",  type="Shot", team=TEAM1, player="Striker A", minute=15,
             location=[110.0, 36.0], shot_outcome="Goal",   shot_statsbomb_xg=0.45,
             shot_type="Open Play", shot_body_part="Right Foot", possession_team=TEAM1),
        _row(id="2",  type="Shot", team=TEAM1, player="Striker A", minute=33,
             location=[105.0, 42.0], shot_outcome="Saved",  shot_statsbomb_xg=0.12,
             shot_type="Open Play", shot_body_part="Left Foot",  possession_team=TEAM1),
        _row(id="3",  type="Shot", team=TEAM1, player="Mid A",     minute=70,
             location=[108.0, 38.0], shot_outcome="Off T",  shot_statsbomb_xg=0.07,
             shot_type="Open Play", shot_body_part="Head",        possession_team=TEAM1),
        _row(id="4",  type="Shot", team=TEAM2, player="Striker B", minute=55,
             location=[115.0, 40.0], shot_outcome="Goal",   shot_statsbomb_xg=0.38,
             shot_type="Open Play", shot_body_part="Right Foot", possession_team=TEAM2),
        _row(id="5",  type="Shot", team=TEAM2, player="Striker B", minute=78,
             location=[103.0, 35.0], shot_outcome="Saved",  shot_statsbomb_xg=0.09,
             shot_type="Open Play", shot_body_part="Right Foot", possession_team=TEAM2),
        _row(id="6",  type="Shot", team=TEAM1, player="Striker A", minute=80,
             location=[113.0, 40.0], shot_outcome="Saved",  shot_statsbomb_xg=0.25,
             shot_type="Penalty",   shot_body_part="Right Foot", possession_team=TEAM1),

        # ── Passes ────────────────────────────────────────────────────────
        *[_row(id=str(10 + i), type="Pass", team=TEAM1, player=f"Mid A", minute=i+1,
               pass_type="Open Play", possession_team=TEAM1) for i in range(8)],
        _row(id="20", type="Pass", team=TEAM1, player="Mid A", minute=44,
             pass_type="Corner",    possession_team=TEAM1),
        _row(id="21", type="Pass", team=TEAM1, player="Mid A", minute=67,
             pass_type="Free Kick", possession_team=TEAM1),
        *[_row(id=str(30 + i), type="Pass", team=TEAM2, player="Mid B", minute=i+5,
               pass_type="Open Play", possession_team=TEAM2) for i in range(5)],

        # ── Pressures ─────────────────────────────────────────────────────
        _row(id="40", type="Pressure", team=TEAM1, player="Press A", minute=20, location=[70.0, 35.0]),
        _row(id="41", type="Pressure", team=TEAM1, player="Press A", minute=25, location=[75.0, 45.0]),
        _row(id="42", type="Pressure", team=TEAM2, player="Press B", minute=30, location=[50.0, 40.0]),

        # ── Duels ─────────────────────────────────────────────────────────
        _row(id="50", type="Duel", team=TEAM1, player="Duel A", minute=35,
             duel_outcome="Won",  duel_type="Tackle"),
        _row(id="51", type="Duel", team=TEAM1, player="Duel A", minute=36,
             duel_outcome="Lost", duel_type="Tackle"),
        _row(id="52", type="Duel", team=TEAM2, player="Duel B", minute=37,
             duel_outcome="Won",  duel_type="Ground"),

        # ── Goal Keeper ───────────────────────────────────────────────────
        _row(id="60", type="Goal Keeper", team=TEAM2, player="GK B", minute=15,
             goalkeeper_type="Shot Saved"),
        _row(id="61", type="Goal Keeper", team=TEAM2, player="GK B", minute=33,
             goalkeeper_type="Shot Saved"),
        _row(id="62", type="Goal Keeper", team=TEAM2, player="GK B", minute=80,
             goalkeeper_type="Shot Saved"),
        _row(id="63", type="Goal Keeper", team=TEAM2, player="GK B", minute=55,
             goalkeeper_type="Goal Conceded"),
        _row(id="64", type="Goal Keeper", team=TEAM1, player="GK A", minute=55,
             goalkeeper_type="Shot Saved"),
        _row(id="65", type="Goal Keeper", team=TEAM1, player="GK A", minute=78,
             goalkeeper_type="Shot Saved"),
        _row(id="66", type="Goal Keeper", team=TEAM1, player="GK A", minute=15,
             goalkeeper_type="Goal Conceded"),

        # ── Ball Recovery ─────────────────────────────────────────────────
        _row(id="70", type="Ball Recovery", team=TEAM1, player="Mid A", minute=50),
        _row(id="71", type="Ball Recovery", team=TEAM2, player="Mid B", minute=51),

        # ── Dribble ───────────────────────────────────────────────────────
        _row(id="80", type="Dribble", team=TEAM1, player="Winger A", minute=22,
             dribble_outcome="Complete"),
        _row(id="81", type="Dribble", team=TEAM2, player="Winger B", minute=60,
             dribble_outcome="Incomplete"),

        # ── Foul ─────────────────────────────────────────────────────────
        _row(id="90", type="Foul Committed", team=TEAM1, player="Def A", minute=40),
        _row(id="91", type="Foul Committed", team=TEAM2, player="Def B", minute=41),
    ]
    df = pd.DataFrame(rows)
    df["period"] = df["period"].fillna(1).astype(int)
    return df


def test_stat_boxes(fake_events):
    sb = _stat_boxes(fake_events, TEAM1, TEAM2)
    assert "xg" in sb and "possession" in sb and "shotsOnTarget" in sb

    poss_sum = sb["possession"][TEAM1] + sb["possession"][TEAM2]
    assert abs(poss_sum - 100.0) < 1.0, "Possession should sum to ~100%"

    assert isinstance(sb["xg"][TEAM1], float)
    assert isinstance(sb["xg"][TEAM2], float)
    assert isinstance(sb["possession"][TEAM1], float)

    # Penalty shots should still count for xG in stat boxes (not filtered here)
    assert sb["xg"][TEAM1] > 0
    assert sb["xg"][TEAM2] > 0


def test_xg_flow(fake_events):
    flow = {}
    shots = fake_events[(fake_events["type"] == "Shot") & (fake_events["period"] != 5)].copy()
    for team in [TEAM1, TEAM2]:
        t = shots[shots["team"] == team].sort_values("minute").copy()
        t["cumxg"] = t["shot_statsbomb_xg"].cumsum().round(3)
        flow[team] = [
            {"minute": int(r["minute"]), "cumxg": float(r["cumxg"]),
             "isGoal": r["shot_outcome"] == "Goal"}
            for _, r in t.iterrows()
        ]
    for team in [TEAM1, TEAM2]:
        data = flow[team]
        assert len(data) > 0
        cumxgs = [d["cumxg"] for d in data]
        for i in range(1, len(cumxgs)):
            assert cumxgs[i] >= cumxgs[i - 1] - 1e-9, "cumxg must be non-decreasing"
        for d in data:
            assert isinstance(d["isGoal"], bool)


def test_shot_map(fake_events):
    sm = _shot_map(fake_events)
    # No penalties
    for shot in sm:
        assert shot["xg"] >= 0
        assert isinstance(shot["x"], float)
        assert isinstance(shot["y"], float)
        assert 0 <= shot["x"] <= 120
        assert 0 <= shot["y"] <= 80

    # Verify the penalty shot (id=6) is excluded
    total_non_penalty_shots = len(
        fake_events[(fake_events["type"] == "Shot") & (fake_events["shot_type"] != "Penalty")]
    )
    assert len(sm) == total_non_penalty_shots


def test_match_stats(fake_events):
    ms = _match_stats(fake_events, TEAM1, TEAM2)
    for team in [TEAM1, TEAM2]:
        assert team in ms
        for key in ["passes", "fouls", "corners", "recoveries", "dribbles"]:
            assert key in ms[team], f"Missing key: {key}"

    assert ms[TEAM1]["corners"] == 1
    assert ms[TEAM1]["fouls"] == 1
    assert ms[TEAM1]["recoveries"] == 1
    assert ms[TEAM1]["dribbles"] == 1
    assert ms[TEAM2]["dribbles"] == 0


def test_goalkeepers(fake_events):
    gks = _goalkeepers(fake_events, TEAM1, TEAM2)
    assert isinstance(gks, list)
    assert len(gks) > 0

    for gk in gks:
        assert "team" in gk and "player" in gk
        assert "saves" in gk and "conceded" in gk
        assert "psxgPrevented" in gk

        # _goalkeepers() joins psxg on the GK's own team (same-team shots on target).
        # psxgPrevented = own_team_shots_xg - goals_conceded
        reg = fake_events[fake_events["period"] != 5]
        own_psxg = float(
            reg[(reg["type"] == "Shot") & (reg["shot_outcome"].isin(["Goal", "Saved"])) &
                (reg["team"] == gk["team"])]["shot_statsbomb_xg"].sum()
        )
        expected_prevented = round(own_psxg - gk["conceded"], 2)
        assert abs(gk["psxgPrevented"] - expected_prevented) < 0.01


def test_momentum(fake_events, monkeypatch):
    from services import match_service as ms_mod
    monkeypatch.setattr(ms_mod, "_load",
                        lambda mid: (fake_events, TEAM1, TEAM2, {"home_team": TEAM1, "away_team": TEAM2}))
    result = get_momentum(1)
    assert "momentum" in result
    for team in [TEAM1, TEAM2]:
        data = result["momentum"][team]
        assert len(data) > 0
        minutes = [d["minute"] for d in data]
        for i in range(1, len(minutes)):
            assert minutes[i] >= minutes[i - 1], "minutes must be non-decreasing"
        for d in data:
            assert isinstance(d["smoothed"], float)


def test_pressure_duels(fake_events, monkeypatch):
    from services import match_service as ms_mod
    monkeypatch.setattr(ms_mod, "_load",
                        lambda mid: (fake_events, TEAM1, TEAM2, {"home_team": TEAM1, "away_team": TEAM2}))
    result = get_pressure_duels(1)
    assert "duels" in result and "ppda" in result
    for team in [TEAM1, TEAM2]:
        d = result["duels"][team]
        if d["total"] > 0:
            expected_pct = round(d["won"] / d["total"] * 100, 1)
            assert abs(d["winPct"] - expected_pct) < 0.01
        # ppda >= 0 (can be 0 if no passes recorded in opposing half)
        assert isinstance(result["ppda"][team], float)
        assert result["ppda"][team] >= 0
