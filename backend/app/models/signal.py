from enum import Enum

from pydantic import BaseModel, Field


class CongestionLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HEAVY = "heavy"
    SEVERE = "severe"


class SignalPhase(str, Enum):
    IDLE = "idle"
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"


class SignalOperationalMode(str, Enum):
    NO_STREAM = "no_stream"
    NO_TRAFFIC = "no_traffic"
    ACTIVE = "active"


class LaneId(str, Enum):
    NORTH = "north"
    SOUTH = "south"
    EAST = "east"
    WEST = "west"


class EmergencyMode(str, Enum):
    NONE = "none"
    EMERGENCY = "emergency"
    AMBULANCE = "ambulance"


class LanePriority(BaseModel):
    lane: LaneId
    score: float = Field(ge=0)
    vehicle_share: float = Field(ge=0, le=1, description="Share of detected traffic")


class SignalRecommendation(BaseModel):
    operational_mode: SignalOperationalMode
    optimization_active: bool = False
    status_message: str = ""
    congestion_level: CongestionLevel
    green_duration_sec: int = 0
    yellow_duration_sec: int = 0
    red_duration_sec: int = 0
    priority_lane: LaneId | None = None
    lane_priorities: list[LanePriority] = Field(default_factory=list)
    weighted_traffic_score: float = 0.0
    vehicle_count: int = 0
    emergency_mode: EmergencyMode = EmergencyMode.NONE
    alert_message: str | None = None


class SignalState(BaseModel):
    """Live intersection signal state for clients."""

    operational_mode: SignalOperationalMode
    optimization_active: bool = False
    status_message: str = ""
    active_lane: LaneId | None = None
    phase: SignalPhase = SignalPhase.IDLE
    countdown_sec: int = Field(ge=0, default=0)
    recommended_green_sec: int = 0
    congestion_level: CongestionLevel = CongestionLevel.NONE
    priority_lane: LaneId | None = None
    emergency_mode: EmergencyMode = EmergencyMode.NONE
    lanes: dict[LaneId, SignalPhase] = Field(default_factory=dict)
    alert_message: str | None = None


class EmergencyRequest(BaseModel):
    mode: EmergencyMode = EmergencyMode.AMBULANCE
    lane: LaneId | None = None


class SignalRecommendationRequest(BaseModel):
    weighted_traffic_score: float = 0.0
    vehicle_count: int = 0
    counts_by_class: dict[str, int] = Field(default_factory=dict)
    counts_by_lane: dict[str, int] = Field(default_factory=dict)
    scores_by_lane: dict[str, float] = Field(default_factory=dict)
    priority_lane: str | None = None
    emergency_mode: EmergencyMode = EmergencyMode.NONE
