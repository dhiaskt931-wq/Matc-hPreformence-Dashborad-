from .understat import UNDERSTAT_OFFSET
from .football_data_org import FDO_OFFSET
from config import FEATURE_MATRIX


def get_source(match_id: int) -> str:
    if match_id >= FDO_OFFSET:
        return "football-data.org"
    if match_id >= UNDERSTAT_OFFSET:
        return "understat"
    return "statsbomb"


def get_available_features(match_id: int) -> dict:
    source = get_source(match_id)
    features = FEATURE_MATRIX.get(source, {})
    return {"source": source, "features": features}


def understat_id(match_id: int) -> int:
    return match_id - UNDERSTAT_OFFSET


def fdo_id(match_id: int) -> int:
    return match_id - FDO_OFFSET
