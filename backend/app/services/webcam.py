from __future__ import annotations



import asyncio

import logging

import time

from typing import Any, AsyncIterator



import cv2

import numpy as np



from app.config import Settings

from app.models.schemas import StreamStatus

from app.services.analytics import AnalyticsService

from app.services.detection import YoloDetectionService

from app.services.optimization import TrafficOptimizationService

from app.services.stream_pipeline import TrafficFramePipeline



logger = logging.getLogger(__name__)





class WebcamStreamService:

    """

    Captures webcam frames, runs YOLO on a skipped subset at reduced resolution,

    and yields annotated frames plus analytics for WebSocket clients.

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



    @property

    def is_running(self) -> bool:

        return self._running



    def status(self) -> StreamStatus:

        return StreamStatus(

            running=self._running,

            mode="live" if self._running else "idle",

            camera_index=self._settings.webcam_index,

            frame_skip=self._settings.frame_skip,

            inference_size=self._settings.inference_size,

            model_name=self._settings.yolo_model,

        )



    def _open_capture(self) -> cv2.VideoCapture:

        cap = cv2.VideoCapture(self._settings.webcam_index)

        if not cap.isOpened():

            raise RuntimeError(

                f"Cannot open webcam at index {self._settings.webcam_index}"

            )

        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        return cap



    async def stream_frames(self) -> AsyncIterator[dict[str, Any]]:

        if self._running:

            raise RuntimeError("Webcam stream is already running")



        self._running = True

        loop = asyncio.get_running_loop()

        self._pipeline.on_stream_start()

        self._capture = self._open_capture()

        skip = max(1, self._settings.frame_skip)

        frame_interval = 1.0 / self._settings.target_fps



        try:

            while self._running:

                t0 = time.perf_counter()

                ok, frame = await loop.run_in_executor(None, self._capture.read)

                if not ok or frame is None:

                    logger.warning("Webcam read failed; retrying")

                    await asyncio.sleep(0.05)

                    continue



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



    async def run_local_preview(self) -> None:

        """Blocking OpenCV window for local dev (no WebSocket)."""

        self._pipeline._detection.load_model()

        cap = self._open_capture()

        skip = max(1, self._settings.frame_skip)

        detection = self._pipeline._detection

        analytics = self._pipeline._analytics

        frame_id = 0

        last_detections: list = []

        last_traffic: dict[str, Any] = {

            "vehicle_count": 0,

            "weighted_traffic_score": 0.0,

            "counts_by_class": {},

            "fps": 0.0,

        }



        logger.info("Local preview — press 'q' to quit")

        try:

            while True:

                ok, frame = cap.read()

                if not ok:

                    break

                frame_id += 1

                if frame_id % skip == 0:
                    last_detections = detection.detect(frame)
                    fh, fw = frame.shape[:2]
                    last_traffic = analytics.compute_traffic(
                        last_detections, frame_width=fw, frame_height=fh
                    ).model_dump()



                fps = analytics.tick_fps()

                last_traffic["fps"] = round(fps, 2)

                annotated = detection.draw_annotations(

                    frame, last_detections, last_traffic

                )

                cv2.imshow("Traffic Detection", annotated)

                if cv2.waitKey(1) & 0xFF == ord("q"):

                    break

        finally:

            cap.release()

            cv2.destroyAllWindows()


