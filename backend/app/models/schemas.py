from typing import Literal

from pydantic import BaseModel, Field

StreamMode = Literal["idle", "live", "demo"]


class Detection(BaseModel):
    class_id: int
    class_name: str
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: list[int] = Field(description="[x1, y1, x2, y2] in pixels")


class TrafficAnalytics(BaseModel):
    vehicle_count: int = 0
    weighted_traffic_score: float = 0.0
    counts_by_class: dict[str, int] = Field(default_factory=dict)
    counts_by_lane: dict[str, int] = Field(
        default_factory=dict,
        description="Vehicle count per approach lane (north/south/east/west)",
    )
    scores_by_lane: dict[str, float] = Field(
        default_factory=dict,
        description="Weighted traffic score per lane from spatial detections",
    )
    priority_lane: str | None = Field(
        default=None,
        description="Lane with highest current weighted score",
    )
    fps: float = 0.0


class FrameAnalytics(BaseModel):
    frame_id: int
    timestamp_ms: float
    detections: list[Detection]
    analytics: TrafficAnalytics


class StreamStatus(BaseModel):
    running: bool
    mode: StreamMode = "idle"
    camera_index: int | None = None
    session_id: str | None = None
    demo_filename: str | None = None
    frame_skip: int
    inference_size: int
    model_name: str


class DemoUploadResponse(BaseModel):
    session_id: str
    filename: str
    size_bytes: int
    fps: float
    frame_count: int
    duration_sec: float
