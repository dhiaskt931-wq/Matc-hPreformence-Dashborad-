from .understat import UNDERSTAT_OFFSET
from .football_data_org import FDO_OFFSET

_STATSBOMB_FEATURES = {
    "match-overview": "full", "shot-analysis": "full", "pass-network": "full",
    "heatmap": "full", "player-stats": "full", "pressure": "full",
    "defensive": "full", "set-pieces": "full", "momentum": "full",
}
_UNDERSTAT_FEATURES = {
    "match-overview": "partial", "shot-analysis": "full", "pass-network": "unavailable",
    "heatmap": "unavailable", "player-stats": "partial", "pressure": "unavailable",
    "defensive": "unavailable", "set-pieces": "partial", "momentum": "unavailable",
}
_FDO_FEATURES = {k: "unavailable" for k in _STATSBOMB_FEATURES}
_FDO_FEATURES["match-overview"] = "partial"


def get_source(match_id: int) -> str:
    if match_id >= FDO_OFFSET:
        return "football-data.org"
    if match_id >= UNDERSTAT_OFFSET:
        return "understat"
    return "statsbomb"


def get_available_features(match_id: int) -> dict:
    source = get_source(match_id)
    features = {
        "statsbomb": _STATSBOMB_FEATURES,
        "understat": _UNDERSTAT_FEATURES,
        "football-data.org": _FDO_FEATURES,
    }[source]
    return {"source": source, "features": features}


def understat_id(match_id: int) -> int:
    return match_id - UNDERSTAT_OFFSET


def fdo_id(match_id: int) -> int:
    return match_id - FDO_OFFSET
