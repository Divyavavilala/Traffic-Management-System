import time
from collections import defaultdict

from app.config import Settings
from app.models.schemas import Detection, TrafficAnalytics
from app.models.signal import LaneId

# COCO names aligned with target classes
CLASS_NAMES: dict[int, str] = {
    2: "car",
    3: "motorbike",
    5: "bus",
    7: "truck",
}

ALL_LANES: tuple[LaneId, ...] = (
    LaneId.NORTH,
    LaneId.SOUTH,
    LaneId.EAST,
    LaneId.WEST,
)


def assign_lane_from_centroid(
    cx: float,
    cy: float,
    frame_width: int,
    frame_height: int,
) -> LaneId:
    """
    Map a detection centroid to an approach lane using proximity to frame edges.
    Works for typical intersection camera views (vehicles enter from N/S/E/W).
    """
    if frame_width <= 0 or frame_height <= 0:
        return LaneId.NORTH

    nx = cx / frame_width
    ny = cy / frame_height

    edge_distance = {
        LaneId.NORTH: ny,
        LaneId.SOUTH: 1.0 - ny,
        LaneId.WEST: nx,
        LaneId.EAST: 1.0 - nx,
    }
    return min(edge_distance, key=edge_distance.get)  # type: ignore[arg-type]


class AnalyticsService:
    """Aggregates detections into traffic metrics, per-lane analytics, and FPS."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._weights: dict[str, float] = {
            "motorbike": settings.weight_motorbike,
            "car": settings.weight_car,
            "bus": settings.weight_bus,
            "truck": settings.weight_truck,
        }
        self._fps_window: list[float] = []
        self._fps_window_size = 30
        self._last_tick: float | None = None

    @staticmethod
    def class_name(class_id: int) -> str:
        return CLASS_NAMES.get(class_id, f"class_{class_id}")

    def compute_traffic(
        self,
        detections: list[Detection],
        *,
        frame_width: int | None = None,
        frame_height: int | None = None,
    ) -> TrafficAnalytics:
        counts_by_class: dict[str, int] = defaultdict(int)
        counts_by_lane: dict[str, int] = {lane.value: 0 for lane in ALL_LANES}
        scores_by_lane: dict[str, float] = {lane.value: 0.0 for lane in ALL_LANES}
        score = 0.0

        w = frame_width or 0
        h = frame_height or 0

        for det in detections:
            counts_by_class[det.class_name] += 1
            weight = self._weights.get(det.class_name, 1.0)
            score += weight

            if w > 0 and h > 0 and len(det.bbox) >= 4:
                x1, y1, x2, y2 = det.bbox
                cx = (x1 + x2) / 2.0
                cy = (y1 + y2) / 2.0
                lane = assign_lane_from_centroid(cx, cy, w, h)
                counts_by_lane[lane.value] += 1
                scores_by_lane[lane.value] += weight

        priority_lane: str | None = None
        if score > 0:
            priority_lane = max(scores_by_lane, key=scores_by_lane.get)  # type: ignore[arg-type]

        return TrafficAnalytics(
            vehicle_count=len(detections),
            weighted_traffic_score=round(score, 2),
            counts_by_class=dict(counts_by_class),
            counts_by_lane=counts_by_lane,
            scores_by_lane={k: round(v, 2) for k, v in scores_by_lane.items()},
            priority_lane=priority_lane,
            fps=round(self._current_fps(), 2),
        )

    def tick_fps(self) -> float:
        now = time.perf_counter()
        if self._last_tick is not None:
            dt = now - self._last_tick
            if dt > 0:
                self._fps_window.append(1.0 / dt)
                if len(self._fps_window) > self._fps_window_size:
                    self._fps_window.pop(0)
        self._last_tick = now
        return self._current_fps()

    def _current_fps(self) -> float:
        if not self._fps_window:
            return 0.0
        return sum(self._fps_window) / len(self._fps_window)

    def reset_fps(self) -> None:
        self._fps_window.clear()
        self._last_tick = None
