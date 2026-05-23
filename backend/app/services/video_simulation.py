from __future__ import annotations

import asyncio
import logging
import time
from pathlib import Path
from typing import Any, AsyncIterator

import cv2

from app.config import Settings
from app.models.schemas import StreamStatus
from app.services.analytics import AnalyticsService
from app.services.detection import YoloDetectionService
from app.services.optimization import TrafficOptimizationService
from app.services.stream_pipeline import TrafficFramePipeline

logger = logging.getLogger(__name__)


class VideoSimulationStreamService:
    """
    Replays an uploaded traffic video frame-by-frame through the same
    YOLO + analytics + signal pipeline as live webcam capture.
    """

    def __init__(
        self,
        settings: Settings,
        detection: YoloDetectionService,
        analytics: AnalyticsService,
        optimization: TrafficOptimizationService,
    ) -> None:
        self._settings = settings
        self._pipeline = TrafficFramePipeline(
            settings, detection, analytics, optimization
        )
        self._running = False
        self._capture: cv2.VideoCapture | None = None
        self._video_path: Path | None = None
        self._session_id: str | None = None
        self._filename: str | None = None
        self._source_fps: float = 30.0

    @property
    def is_running(self) -> bool:
        return self._running

    def configure(self, video_path: Path, session_id: str, filename: str) -> None:
        self._video_path = video_path
        self._session_id = session_id
        self._filename = filename

    def status(self) -> StreamStatus:
        return StreamStatus(
            running=self._running,
            mode="demo" if self._running else "idle",
            session_id=self._session_id,
            demo_filename=self._filename,
            frame_skip=self._settings.frame_skip,
            inference_size=self._settings.inference_size,
            model_name=self._settings.yolo_model,
        )

    def _open_capture(self) -> cv2.VideoCapture:
        if self._video_path is None:
            raise RuntimeError("No demo video configured")
        cap = cv2.VideoCapture(str(self._video_path))
        if not cap.isOpened():
            raise RuntimeError("Cannot open demo video file")
        self._source_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        if self._source_fps <= 0:
            self._source_fps = 30.0
        return cap

    async def stream_frames(self) -> AsyncIterator[dict[str, Any]]:
        if self._running:
            raise RuntimeError("Demo simulation is already running")

        self._running = True
        loop = asyncio.get_running_loop()
        self._pipeline.on_stream_start()
        self._capture = self._open_capture()
        skip = max(1, self._settings.frame_skip)
        target_fps = min(self._source_fps, self._settings.target_fps)
        frame_interval = 1.0 / max(1.0, target_fps)

        try:
            while self._running:
                t0 = time.perf_counter()
                ok, frame = await loop.run_in_executor(None, self._capture.read)
                if not ok or frame is None:
                    logger.info("Demo video finished playback")
                    yield {
                        "type": "status",
                        "message": "demo_complete",
                        "running": False,
                        "mode": "demo",
                    }
                    break

                run_inference = (self._pipeline.frame_id + 1) % skip == 0
                frame_msg, signal_msg = await self._pipeline.process_frame(
                    frame,
                    loop,
                    run_inference=run_inference,
                    frame_dt=frame_interval,
                )
                yield frame_msg
                if signal_msg:
                    yield signal_msg

                elapsed = time.perf_counter() - t0
                sleep_for = frame_interval - elapsed
                if sleep_for > 0:
                    await asyncio.sleep(sleep_for)

        finally:
            self._pipeline.on_stream_stop()
            self._stop_capture()

    def stop(self) -> None:
        self._running = False
        self._pipeline.on_stream_stop()
        self._stop_capture()

    def _stop_capture(self) -> None:
        if self._capture is not None:
            self._capture.release()
            self._capture = None
        self._running = False
