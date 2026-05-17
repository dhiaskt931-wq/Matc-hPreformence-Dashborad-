from dataclasses import dataclass

from .understat import UNDERSTAT_OFFSET
from .football_data_org import FDO_OFFSET
from config import FEATURE_MATRIX


@dataclass
class SourceInfo:
    source: str
    native_id: int
    original_id: int


def get_source_info(match_id: int) -> SourceInfo:
    if match_id <= 0:
        raise ValueError("match_id must be positive")
    if match_id >= FDO_OFFSET:
        return SourceInfo(source="football-data.org", native_id=match_id - FDO_OFFSET, original_id=match_id)
    if match_id >= UNDERSTAT_OFFSET:
        return SourceInfo(source="understat", native_id=match_id - UNDERSTAT_OFFSET, original_id=match_id)
    return SourceInfo(source="statsbomb", native_id=match_id, original_id=match_id)


def get_source(match_id: int) -> str:
    return get_source_info(match_id).source


def get_available_features(match_id: int) -> dict:
    info = get_source_info(match_id)
    features = FEATURE_MATRIX.get(info.source, {})
    return {"source": info.source, "features": features}


def understat_id(match_id: int) -> int:
    return match_id - UNDERSTAT_OFFSET


def fdo_id(match_id: int) -> int:
    return match_id - FDO_OFFSET
