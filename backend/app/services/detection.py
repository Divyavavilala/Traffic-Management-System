from __future__ import annotations

import logging
from typing import Any

import cv2
import numpy as np
from ultralytics import YOLO

from app.config import Settings
from app.models.schemas import Detection
from app.services.analytics import AnalyticsService

logger = logging.getLogger(__name__)


class YoloDetectionService:
    """YOLOv8n inference with resized frames and class filtering."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._model: YOLO | None = None
        self._target_ids = set(settings.target_class_ids)

    def load_model(self) -> None:
        if self._model is None:
            logger.info("Loading YOLO model: %s", self._settings.yolo_model)
            self._model = YOLO(self._settings.yolo_model)

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def _resize_for_inference(
        self, frame: np.ndarray
    ) -> tuple[np.ndarray, float, float]:
        """Downscale large frames; return scale factors to map boxes back."""
        h, w = frame.shape[:2]
        size = self._settings.inference_size
        longest = max(h, w)
        if longest <= size:
            return frame, 1.0, 1.0
        scale = size / longest
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        return resized, w / new_w, h / new_h

    def detect(self, frame: np.ndarray) -> list[Detection]:
        if self._model is None:
            self.load_model()

        h, w = frame.shape[:2]
        infer_frame, scale_x, scale_y = self._resize_for_inference(frame)
        size = self._settings.inference_size

        results = self._model.predict(
            source=infer_frame,
            imgsz=size,
            conf=self._settings.confidence_threshold,
            classes=list(self._target_ids),
            verbose=False,
            stream=False,
        )

        detections: list[Detection] = []
        if not results:
            return detections

        boxes = results[0].boxes
        if boxes is None or len(boxes) == 0:
            return detections

        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        cls_ids = boxes.cls.cpu().numpy().astype(int)

        for bbox, conf, class_id in zip(xyxy, confs, cls_ids):
            if class_id not in self._target_ids:
                continue
            x1, y1, x2, y2 = (int(v) for v in bbox)
            x1, x2 = int(x1 * scale_x), int(x2 * scale_x)
            y1, y2 = int(y1 * scale_y), int(y2 * scale_y)
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w - 1, x2), min(h - 1, y2)
            detections.append(
                Detection(
                    class_id=int(class_id),
                    class_name=AnalyticsService.class_name(int(class_id)),
                    confidence=round(float(conf), 3),
                    bbox=[x1, y1, x2, y2],
                )
            )

        return detections

    def draw_annotations(
        self,
        frame: np.ndarray,
        detections: list[Detection],
        analytics: dict[str, Any] | None = None,
    ) -> np.ndarray:
        out = frame.copy()
        colors = {
            "car": (0, 200, 255),
            "motorbike": (255, 180, 0),
            "bus": (0, 255, 120),
            "truck": (180, 80, 255),
        }

        for det in detections:
            x1, y1, x2, y2 = det.bbox
            color = colors.get(det.class_name, (200, 200, 200))
            cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)
            label = f"{det.class_name} {det.confidence:.2f}"
            (tw, th), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2
            )
            cv2.rectangle(out, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
            cv2.putText(
                out,
                label,
                (x1 + 2, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (0, 0, 0),
                2,
                cv2.LINE_AA,
            )

        if analytics:
            self._draw_hud(out, analytics)

        return out

    @staticmethod
    def _draw_hud(frame: np.ndarray, analytics: dict[str, Any]) -> None:
        lines = [
            f"Vehicles: {analytics.get('vehicle_count', 0)}",
            f"Traffic score: {analytics.get('weighted_traffic_score', 0):.2f}",
            f"FPS: {analytics.get('fps', 0):.2f}",
        ]
        counts = analytics.get("counts_by_class") or {}
        if counts:
            breakdown = ", ".join(f"{k}:{v}" for k, v in sorted(counts.items()))
            lines.append(breakdown)

        y = 28
        for line in lines:
            cv2.putText(
                frame,
                line,
                (12, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                (40, 40, 40),
                4,
                cv2.LINE_AA,
            )
            cv2.putText(
                frame,
                line,
                (12, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                (240, 240, 240),
                2,
                cv2.LINE_AA,
            )
            y += 26
