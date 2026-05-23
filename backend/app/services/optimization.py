from __future__ import annotations

import time
from dataclasses import dataclass, field

from app.models.schemas import TrafficAnalytics
from app.models.signal import (
    CongestionLevel,
    EmergencyMode,
    LaneId,
    LanePriority,
    SignalOperationalMode,
    SignalPhase,
    SignalRecommendation,
    SignalState,
)

GREEN_BY_LEVEL: dict[CongestionLevel, int] = {
    CongestionLevel.LOW: 10,
    CongestionLevel.MEDIUM: 25,
    CongestionLevel.HEAVY: 45,
    CongestionLevel.SEVERE: 60,
}

YELLOW_DURATION = 3
CLEARANCE_DURATION = 2
EMERGENCY_GREEN = 90
LANE_EMA_ALPHA = 0.55
MIN_LANE_SCORE = 0.25
DOMINANT_LANE_SHARE = 0.72
SWITCH_SCORE_MARGIN = 1.15

ALL_LANES: tuple[LaneId, ...] = (
    LaneId.NORTH,
    LaneId.SOUTH,
    LaneId.EAST,
    LaneId.WEST,
)

MSG_NO_STREAM = (
    "Start live traffic monitoring or upload a demo traffic video"
)
MSG_NO_TRAFFIC = "No traffic detected"
MSG_ACTIVE = "Adaptive traffic optimization active"


@dataclass
class _ControllerState:
    active_lane: LaneId | None = None
    phase: SignalPhase = SignalPhase.IDLE
    countdown_sec: float = 0.0
    recommended_green_sec: int = 0
    congestion_level: CongestionLevel = CongestionLevel.NONE
    priority_lane: LaneId | None = None
    emergency_mode: EmergencyMode = EmergencyMode.NONE
    alert_message: str | None = None
    all_red_clearance: bool = False
    green_elapsed_sec: float = 0.0
    last_tick: float = field(default_factory=time.monotonic)


class TrafficOptimizationService:
    """
    Adaptive signals driven by per-lane traffic from each video frame.

    Timing advances with stream frame_dt (video playback pace), not arbitrary
    wall-clock rotation. Green length reflects the active lane's congestion;
    the signal holds green while that lane still carries the traffic and only
    switches when another approach becomes meaningfully busier.
    """

    def __init__(self) -> None:
        self._stream_active = False
        self._emergency_mode = EmergencyMode.NONE
        self._emergency_lane: LaneId | None = None
        self._controller = _ControllerState()
        self._lane_ema: dict[LaneId, float] = {lane: 0.0 for lane in ALL_LANES}
        self._last_vehicle_count = 0
        self._last_analytics: dict = {}
        self._default_frame_dt = 1.0 / 30.0

    @property
    def is_stream_active(self) -> bool:
        return self._stream_active

    @property
    def emergency_mode(self) -> EmergencyMode:
        return self._emergency_mode

    def on_stream_start(self) -> None:
        self._stream_active = True
        self._reset_controller()
        self._emergency_mode = EmergencyMode.NONE
        self._emergency_lane = None

    def on_stream_stop(self) -> None:
        self._stream_active = False
        self._emergency_mode = EmergencyMode.NONE
        self._emergency_lane = None
        self._reset_controller()

    def process_frame(
        self,
        analytics: TrafficAnalytics | dict,
        *,
        frame_dt: float | None = None,
    ) -> tuple[SignalState, SignalRecommendation]:
        if not self._stream_active:
            rec = self._recommendation_no_stream()
            return self.get_state(), rec

        dt = frame_dt if frame_dt is not None and frame_dt > 0 else self._default_frame_dt

        data = self._normalize_analytics(analytics)
        self._last_analytics = data
        count = data["vehicle_count"]
        self._last_vehicle_count = count

        if count <= 0 and self._emergency_mode == EmergencyMode.NONE:
            self._reset_controller()
            rec = self._recommendation_no_traffic(data["weighted_traffic_score"])
            return self.get_state(), rec

        recommendation = self.recommend(data, emergency_mode=self._emergency_mode)
        self.apply_recommendation(recommendation, data)
        state = self.tick(frame_dt=dt)
        return state, recommendation

    def get_state(self) -> SignalState:
        if not self._stream_active:
            return self._state_no_stream()

        if self._last_vehicle_count <= 0 and self._emergency_mode == EmergencyMode.NONE:
            return self._state_no_traffic()

        return self._state_active()

    def recommend(
        self,
        analytics: TrafficAnalytics | dict,
        emergency_mode: EmergencyMode | None = None,
    ) -> SignalRecommendation:
        if not self._stream_active:
            return self._recommendation_no_stream()

        data = self._normalize_analytics(analytics)
        score = data["weighted_traffic_score"]
        count = data["vehicle_count"]

        if count <= 0 and (emergency_mode or self._emergency_mode) == EmergencyMode.NONE:
            return self._recommendation_no_traffic(score)

        mode = emergency_mode if emergency_mode is not None else self._emergency_mode
        priorities = self._compute_lane_priorities(data)
        priority_lane = self._select_priority_lane(priorities, data)

        active = self._controller.active_lane or priority_lane
        lane_score, lane_count = self._lane_metrics(active, data)
        level = self._congestion_for_lane(active, data)
        green = self._green_duration_for_lane(active, data)

        if mode == EmergencyMode.AMBULANCE:
            green = EMERGENCY_GREEN
            level = CongestionLevel.SEVERE
            alert = "Ambulance override — extended green for priority corridor"
        elif mode == EmergencyMode.EMERGENCY:
            green = EMERGENCY_GREEN
            alert = "Emergency vehicle prioritization active"
        else:
            alert = self._congestion_alert(level, lane_score, lane_count, priority_lane)

        if mode != EmergencyMode.NONE and self._emergency_lane:
            priority_lane = self._emergency_lane
            green = EMERGENCY_GREEN

        return SignalRecommendation(
            operational_mode=SignalOperationalMode.ACTIVE,
            optimization_active=True,
            status_message=MSG_ACTIVE,
            congestion_level=level,
            green_duration_sec=green,
            yellow_duration_sec=YELLOW_DURATION,
            red_duration_sec=CLEARANCE_DURATION,
            priority_lane=priority_lane,
            lane_priorities=priorities,
            weighted_traffic_score=score,
            vehicle_count=count,
            emergency_mode=mode,
            alert_message=alert,
        )

    def apply_recommendation(
        self,
        recommendation: SignalRecommendation,
        data: dict,
    ) -> None:
        if not recommendation.optimization_active:
            return

        c = self._controller
        c.priority_lane = recommendation.priority_lane
        c.emergency_mode = recommendation.emergency_mode
        c.alert_message = recommendation.alert_message

        if recommendation.emergency_mode != EmergencyMode.NONE:
            c.active_lane = recommendation.priority_lane
            c.phase = SignalPhase.GREEN
            c.recommended_green_sec = recommendation.green_duration_sec
            c.congestion_level = recommendation.congestion_level
            c.countdown_sec = float(recommendation.green_duration_sec)
            c.green_elapsed_sec = 0.0
            c.all_red_clearance = False
            return

        if c.phase == SignalPhase.IDLE or (
            c.countdown_sec <= 0 and not c.all_red_clearance
        ):
            self._start_green_for_lane(recommendation.priority_lane, data)
            return

        if c.phase == SignalPhase.GREEN and c.active_lane:
            lane = c.active_lane
            target_green = self._green_duration_for_lane(lane, data)
            c.recommended_green_sec = target_green
            c.congestion_level = self._congestion_for_lane(lane, data)

    def tick(self, *, frame_dt: float | None = None) -> SignalState:
        if not self._stream_active or (
            self._last_vehicle_count <= 0 and self._emergency_mode == EmergencyMode.NONE
        ):
            return self.get_state()

        now = time.monotonic()
        c = self._controller
        # Wall-clock delta so the countdown matches real seconds on screen,
        # even when video frames are processed slower than playback FPS.
        wall_dt = now - c.last_tick
        c.last_tick = now
        if wall_dt <= 0 or wall_dt > 2.0:
            wall_dt = self._default_frame_dt

        video_dt = (
            frame_dt
            if frame_dt is not None and frame_dt > 0
            else self._default_frame_dt
        )

        if c.phase == SignalPhase.GREEN:
            c.green_elapsed_sec += video_dt

        if c.countdown_sec > 0:
            c.countdown_sec = max(0.0, c.countdown_sec - wall_dt)

        if c.countdown_sec <= 0 and c.emergency_mode == EmergencyMode.NONE:
            self._advance_phase(self._last_analytics)

        return self.get_state()

    def set_emergency(
        self,
        mode: EmergencyMode,
        lane: LaneId | None = None,
    ) -> SignalState:
        if mode != EmergencyMode.NONE:
            if not self._stream_active:
                return self._state_no_stream()
            if self._last_vehicle_count <= 0:
                return self._state_no_traffic()

        self._emergency_mode = mode
        self._emergency_lane = lane

        if mode != EmergencyMode.NONE:
            target = lane or self._controller.priority_lane
            if target is None and self._last_analytics:
                rec = self.recommend(self._last_analytics, emergency_mode=mode)
                target = rec.priority_lane
            target = target or LaneId.NORTH
            self._controller.active_lane = target
            self._controller.priority_lane = target
            self._controller.phase = SignalPhase.GREEN
            self._controller.countdown_sec = float(EMERGENCY_GREEN)
            self._controller.recommended_green_sec = EMERGENCY_GREEN
            self._controller.green_elapsed_sec = 0.0
            self._controller.emergency_mode = mode
            self._controller.all_red_clearance = False
            label = "Ambulance" if mode == EmergencyMode.AMBULANCE else "Emergency"
            self._controller.alert_message = (
                f"{label} override active — priority lane {target.value}"
            )
        else:
            self._controller.emergency_mode = EmergencyMode.NONE
            self._controller.alert_message = None
            self._emergency_lane = None
            if self._last_vehicle_count <= 0:
                self._reset_controller()

        return self.get_state()

    def classify_congestion(
        self,
        weighted_score: float,
        vehicle_count: int,
    ) -> CongestionLevel:
        if vehicle_count <= 0 and weighted_score <= 0:
            return CongestionLevel.NONE
        count = max(vehicle_count, 1) if weighted_score > 0 else vehicle_count
        if weighted_score < 2.5 and count < 3:
            return CongestionLevel.LOW
        if weighted_score < 7 and count < 8:
            return CongestionLevel.MEDIUM
        if weighted_score < 14 and count < 15:
            return CongestionLevel.HEAVY
        return CongestionLevel.SEVERE

    def _green_duration_for_lane(self, lane: LaneId | None, data: dict) -> int:
        if lane is None:
            return GREEN_BY_LEVEL[CongestionLevel.LOW]
        level = self._congestion_for_lane(lane, data)
        if level == CongestionLevel.NONE:
            return GREEN_BY_LEVEL[CongestionLevel.LOW]
        return GREEN_BY_LEVEL[level]

    def _congestion_for_lane(self, lane: LaneId | None, data: dict) -> CongestionLevel:
        if lane is None:
            return CongestionLevel.NONE
        ema = self._lane_ema.get(lane, 0.0)
        inst_score, inst_count = self._lane_metrics_instant(lane, data)
        score = max(ema, inst_score)
        count = inst_count
        if count == 0 and score < MIN_LANE_SCORE:
            return CongestionLevel.NONE
        return self.classify_congestion(score, max(count, 1))

    def _compute_lane_priorities(self, data: dict) -> list[LanePriority]:
        smoothed = self._update_lane_ema(data.get("scores_by_lane") or {})
        total = sum(smoothed.values())

        priorities: list[LanePriority] = []
        for lane in ALL_LANES:
            score = smoothed[lane]
            priorities.append(
                LanePriority(
                    lane=lane,
                    score=round(score, 2),
                    vehicle_share=round(score / max(total, 1e-6), 3),
                )
            )
        return sorted(priorities, key=lambda p: p.score, reverse=True)

    def _select_priority_lane(
        self,
        priorities: list[LanePriority],
        data: dict,
    ) -> LaneId:
        if self._emergency_lane:
            return self._emergency_lane

        busy = [p for p in priorities if p.score >= MIN_LANE_SCORE]
        if busy:
            return busy[0].lane

        raw_hint = data.get("priority_lane")
        if raw_hint:
            try:
                return LaneId(raw_hint)
            except ValueError:
                pass

        counts = data.get("counts_by_lane") or {}
        for lane in ALL_LANES:
            if counts.get(lane.value, 0) > 0:
                return lane

        return priorities[0].lane if priorities else LaneId.NORTH

    def _update_lane_ema(self, scores_by_lane: dict[str, float]) -> dict[LaneId, float]:
        for lane in ALL_LANES:
            raw = float(scores_by_lane.get(lane.value, 0.0))
            prev = self._lane_ema[lane]
            self._lane_ema[lane] = LANE_EMA_ALPHA * raw + (1.0 - LANE_EMA_ALPHA) * prev
        return dict(self._lane_ema)

    def _lane_metrics(self, lane: LaneId | None, data: dict) -> tuple[float, int]:
        if lane is None:
            return 0.0, 0
        ema_score = self._lane_ema.get(lane, 0.0)
        scores = data.get("scores_by_lane") or {}
        counts = data.get("counts_by_lane") or {}
        inst_score = float(scores.get(lane.value, 0.0))
        inst_count = int(counts.get(lane.value, 0))
        return max(inst_score, ema_score), inst_count

    def _lane_metrics_instant(self, lane: LaneId, data: dict) -> tuple[float, int]:
        scores = data.get("scores_by_lane") or {}
        counts = data.get("counts_by_lane") or {}
        return float(scores.get(lane.value, 0.0)), int(counts.get(lane.value, 0))

    def _lanes_with_traffic(self, data: dict) -> list[LaneId]:
        result: list[LaneId] = []
        for lane in ALL_LANES:
            score, count = self._lane_metrics_instant(lane, data)
            ema = self._lane_ema.get(lane, 0.0)
            if count > 0 or max(score, ema) >= MIN_LANE_SCORE:
                result.append(lane)
        return result

    def _should_hold_green(self, data: dict) -> bool:
        c = self._controller
        if c.active_lane is None:
            return False

        lane = c.active_lane
        inst_score, inst_count = self._lane_metrics_instant(lane, data)
        ema = self._lane_ema.get(lane, 0.0)

        if inst_count > 0 or inst_score >= MIN_LANE_SCORE or ema >= MIN_LANE_SCORE:
            priorities = self._compute_lane_priorities(data)
            if not priorities or priorities[0].score <= 0:
                return True

            if priorities[0].lane == lane:
                return True

            if priorities[0].vehicle_share >= DOMINANT_LANE_SHARE and priorities[0].lane == lane:
                return True

            current_rank = next(
                (p for p in priorities if p.lane == lane),
                None,
            )
            if current_rank and priorities[0].lane != lane:
                if priorities[0].score < current_rank.score * SWITCH_SCORE_MARGIN:
                    return True

        return False

    def _next_lane_to_serve(
        self,
        current: LaneId | None,
        data: dict,
    ) -> LaneId | None:
        priorities = self._compute_lane_priorities(data)
        busy = [p for p in priorities if p.score >= MIN_LANE_SCORE]

        if not busy:
            return current

        best = busy[0]

        if current is None:
            return best.lane

        if best.lane == current:
            return None

        current_entry = next((p for p in busy if p.lane == current), None)
        if current_entry is None:
            return best.lane

        if best.score >= current_entry.score * SWITCH_SCORE_MARGIN:
            return best.lane

        return None

    @staticmethod
    def _normalize_analytics(analytics: TrafficAnalytics | dict) -> dict:
        if isinstance(analytics, TrafficAnalytics):
            return analytics.model_dump()
        return {
            "vehicle_count": int(analytics.get("vehicle_count", 0)),
            "weighted_traffic_score": float(
                analytics.get("weighted_traffic_score", 0)
            ),
            "counts_by_class": analytics.get("counts_by_class") or {},
            "counts_by_lane": analytics.get("counts_by_lane") or {},
            "scores_by_lane": analytics.get("scores_by_lane") or {},
            "priority_lane": analytics.get("priority_lane"),
        }

    def _state_no_stream(self) -> SignalState:
        return SignalState(
            operational_mode=SignalOperationalMode.NO_STREAM,
            optimization_active=False,
            status_message=MSG_NO_STREAM,
            active_lane=None,
            phase=SignalPhase.IDLE,
            countdown_sec=0,
            recommended_green_sec=0,
            congestion_level=CongestionLevel.NONE,
            priority_lane=None,
            emergency_mode=EmergencyMode.NONE,
            lanes=self._all_lanes_idle(),
            alert_message=None,
        )

    def _state_no_traffic(self) -> SignalState:
        return SignalState(
            operational_mode=SignalOperationalMode.NO_TRAFFIC,
            optimization_active=False,
            status_message=MSG_NO_TRAFFIC,
            active_lane=None,
            phase=SignalPhase.IDLE,
            countdown_sec=0,
            recommended_green_sec=0,
            congestion_level=CongestionLevel.NONE,
            priority_lane=None,
            emergency_mode=EmergencyMode.NONE,
            lanes=self._all_lanes_red_idle(),
            alert_message=None,
        )

    def _state_active(self) -> SignalState:
        c = self._controller
        return SignalState(
            operational_mode=SignalOperationalMode.ACTIVE,
            optimization_active=True,
            status_message=MSG_ACTIVE,
            active_lane=c.active_lane,
            phase=c.phase,
            countdown_sec=max(0, int(round(c.countdown_sec))),
            recommended_green_sec=c.recommended_green_sec,
            congestion_level=c.congestion_level,
            priority_lane=c.priority_lane,
            emergency_mode=c.emergency_mode,
            lanes=self._build_lane_map(),
            alert_message=c.alert_message,
        )

    def _recommendation_no_stream(self) -> SignalRecommendation:
        return SignalRecommendation(
            operational_mode=SignalOperationalMode.NO_STREAM,
            optimization_active=False,
            status_message=MSG_NO_STREAM,
            congestion_level=CongestionLevel.NONE,
            green_duration_sec=0,
            yellow_duration_sec=0,
            red_duration_sec=0,
            priority_lane=None,
            lane_priorities=[],
            weighted_traffic_score=0.0,
            vehicle_count=0,
        )

    def _recommendation_no_traffic(self, score: float = 0.0) -> SignalRecommendation:
        return SignalRecommendation(
            operational_mode=SignalOperationalMode.NO_TRAFFIC,
            optimization_active=False,
            status_message=MSG_NO_TRAFFIC,
            congestion_level=CongestionLevel.NONE,
            green_duration_sec=0,
            yellow_duration_sec=0,
            red_duration_sec=0,
            priority_lane=None,
            lane_priorities=[],
            weighted_traffic_score=score,
            vehicle_count=0,
        )

    def _reset_controller(self) -> None:
        self._controller = _ControllerState()
        self._lane_ema = {lane: 0.0 for lane in ALL_LANES}
        self._last_vehicle_count = 0
        self._last_analytics = {}

    @staticmethod
    def _all_lanes_idle() -> dict[LaneId, SignalPhase]:
        return {lane: SignalPhase.IDLE for lane in ALL_LANES}

    @staticmethod
    def _all_lanes_red_idle() -> dict[LaneId, SignalPhase]:
        return {lane: SignalPhase.RED for lane in ALL_LANES}

    def _build_lane_map(self) -> dict[LaneId, SignalPhase]:
        c = self._controller

        if c.all_red_clearance:
            return {lane: SignalPhase.RED for lane in ALL_LANES}

        result: dict[LaneId, SignalPhase] = {}
        for lane in ALL_LANES:
            if c.active_lane and lane == c.active_lane:
                result[lane] = c.phase
            else:
                result[lane] = SignalPhase.RED
        return result

    def _start_green_for_lane(self, lane: LaneId | None, data: dict) -> None:
        if lane is None:
            lane = self._select_priority_lane(self._compute_lane_priorities(data), data)

        c = self._controller
        duration = self._green_duration_for_lane(lane, data)
        c.active_lane = lane
        c.phase = SignalPhase.GREEN
        c.recommended_green_sec = duration
        c.congestion_level = self._congestion_for_lane(lane, data)
        c.countdown_sec = float(duration)
        c.green_elapsed_sec = 0.0
        c.all_red_clearance = False

    def _advance_phase(self, data: dict) -> None:
        c = self._controller

        if c.phase == SignalPhase.GREEN:
            if self._should_hold_green(data):
                duration = self._green_duration_for_lane(c.active_lane, data)
                c.recommended_green_sec = duration
                c.congestion_level = self._congestion_for_lane(c.active_lane, data)
                c.countdown_sec = float(duration)
                c.green_elapsed_sec = 0.0
                return

            next_lane = self._next_lane_to_serve(c.active_lane, data)
            if next_lane is None:
                duration = self._green_duration_for_lane(c.active_lane, data)
                c.countdown_sec = float(duration)
                c.green_elapsed_sec = 0.0
                c.recommended_green_sec = duration
                return

            c.phase = SignalPhase.YELLOW
            c.countdown_sec = float(YELLOW_DURATION)
            return

        if c.phase == SignalPhase.YELLOW:
            next_lane = self._next_lane_to_serve(c.active_lane, data)
            if next_lane is None and c.active_lane:
                self._start_green_for_lane(c.active_lane, data)
                return

            if next_lane is None:
                next_lane = self._select_priority_lane(
                    self._compute_lane_priorities(data), data
                )

            c.priority_lane = next_lane
            c.phase = SignalPhase.RED
            c.active_lane = None
            c.all_red_clearance = True
            c.countdown_sec = float(CLEARANCE_DURATION)
            return

        if c.phase == SignalPhase.RED and c.all_red_clearance:
            c.all_red_clearance = False
            target = c.priority_lane
            if target is None:
                target = self._select_priority_lane(
                    self._compute_lane_priorities(data), data
                )
            self._start_green_for_lane(target, data)
            return

        if data:
            target = self._select_priority_lane(
                self._compute_lane_priorities(data), data
            )
            self._start_green_for_lane(target, data)

    @staticmethod
    def _congestion_alert(
        level: CongestionLevel,
        score: float,
        count: int,
        lane: LaneId | None,
    ) -> str | None:
        lane_label = lane.value.capitalize() if lane else "Priority"
        if level in (CongestionLevel.NONE, CongestionLevel.LOW):
            return None
        if level == CongestionLevel.MEDIUM:
            return (
                f"{lane_label} approach — moderate traffic "
                f"({count} vehicles detected in frame)"
            )
        if level == CongestionLevel.HEAVY:
            return (
                f"{lane_label} approach congested — "
                f"{GREEN_BY_LEVEL[level]}s green based on traffic density"
            )
        return (
            f"{lane_label} severe congestion — {count} vehicles; "
            f"{GREEN_BY_LEVEL[level]}s green from live analysis"
        )
