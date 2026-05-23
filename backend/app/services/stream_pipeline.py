from __future__ import annotations

import asyncio
import base64
import logging
import time
from typing import Any

import cv2
import numpy as np

from app.config import Settings
from app.services.analytics import AnalyticsService
from app.services.detection import YoloDetectionService
from app.services.optimization import TrafficOptimizationService

logger = logging.getLogger(__name__)


class TrafficFramePipeline:
    """
    Shared per-stream frame processing: YOLO inference, analytics,
    signal optimization, and WebSocket message assembly.
    """

    def __init__(
        self,
        settings: Settings,
        detection: YoloDetectionService,
        analytics: AnalyticsService,
        optimization: TrafficOptimizationService,
    ) -> None:
        self._settings = settings
        self._detection = detection
        self._analytics = analytics
        self._optimization = optimization
        self.reset()

    def reset(self) -> None:
        self.frame_id = 0
        self._last_detections: list = []
        self._last_traffic: dict[str, Any] = {
            "vehicle_count": 0,
            "weighted_traffic_score": 0.0,
            "counts_by_class": {},
            "counts_by_lane": {},
            "scores_by_lane": {},
            "priority_lane": None,
            "fps": 0.0,
        }

    def on_stream_start(self) -> None:
        self.reset()
        self._analytics.reset_fps()
        self._detection.load_model()
        self._optimization.on_stream_start()

    def on_stream_stop(self) -> None:
        self._optimization.on_stream_stop()

    def _encode_frame(self, frame: np.ndarray) -> str:
        ok, buf = cv2.imencode(
            ".jpg",
            frame,
            [int(cv2.IMWRITE_JPEG_QUALITY), self._settings.jpeg_quality],
        )
        if not ok:
            raise RuntimeError("Failed to encode frame as JPEG")
        return base64.b64encode(buf).decode("ascii")

    async def process_frame(
        self,
        frame: np.ndarray,
        loop: asyncio.AbstractEventLoop,
        *,
        run_inference: bool,
        frame_dt: float | None = None,
    ) -> tuple[dict[str, Any], dict[str, Any] | None]:
        """
        Process one frame and return (frame_message, optional_signal_message).
        """
        self.frame_id += 1

        if run_inference:
            detections = await loop.run_in_executor(
                None, self._detection.detect, frame
            )
            self._last_detections = detections
            h, w = frame.shape[:2]
            traffic = self._analytics.compute_traffic(
                detections, frame_width=w, frame_height=h
            )
            self._last_traffic = traffic.model_dump()

        fps = self._analytics.tick_fps()
        self._last_traffic["fps"] = round(fps, 2)

        hud = {**self._last_traffic}
        annotated = await loop.run_in_executor(
            None,
            self._detection.draw_annotations,
            frame,
            self._last_detections,
            hud,
        )

        analytics_dict = {**self._last_traffic, "fps": round(fps, 2)}

        dt = frame_dt if frame_dt is not None and frame_dt > 0 else (
            1.0 / self._settings.target_fps
        )
        signal_state, recommendation = self._optimization.process_frame(
            analytics_dict, frame_dt=dt
        )

        frame_msg = {
            "type": "frame",
            "frame_id": self.frame_id,
            "timestamp_ms": time.time() * 1000,
            "image_base64": self._encode_frame(annotated),
            "detections": [d.model_dump() for d in self._last_detections],
            "analytics": analytics_dict,
            "signal": signal_state.model_dump(mode="json"),
            "recommendation": recommendation.model_dump(mode="json"),
        }

        signal_msg: dict[str, Any] | None = None
        if self.frame_id % 5 == 0:
            signal_msg = {
                "type": "signal",
                "timestamp_ms": time.time() * 1000,
                "signal": signal_state.model_dump(mode="json"),
                "recommendation": recommendation.model_dump(mode="json"),
            }

        return frame_msg, signal_msg
