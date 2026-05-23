from __future__ import annotations

import logging
import shutil
import uuid
from pathlib import Path

import cv2
from fastapi import UploadFile

from app.config import Settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}


class DemoSession:
    def __init__(
        self,
        session_id: str,
        filename: str,
        path: Path,
        size_bytes: int,
        fps: float,
        frame_count: int,
        duration_sec: float,
    ) -> None:
        self.session_id = session_id
        self.filename = filename
        self.path = path
        self.size_bytes = size_bytes
        self.fps = fps
        self.frame_count = frame_count
        self.duration_sec = duration_sec


class DemoVideoStore:
    """Temporary storage for uploaded demo traffic videos."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._upload_dir = Path(settings.demo_upload_dir)
        self._upload_dir.mkdir(parents=True, exist_ok=True)
        self._sessions: dict[str, DemoSession] = {}

    def get_session(self, session_id: str) -> DemoSession | None:
        return self._sessions.get(session_id)

    def get_path(self, session_id: str) -> Path | None:
        session = self._sessions.get(session_id)
        return session.path if session else None

    async def save_upload(self, file: UploadFile) -> DemoSession:
        original = file.filename or "traffic.mp4"
        ext = Path(original).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(
                f"Unsupported format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        session_id = uuid.uuid4().hex
        dest = self._upload_dir / f"{session_id}{ext}"

        size = 0
        max_bytes = self._settings.demo_max_upload_mb * 1024 * 1024
        with dest.open("wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    dest.unlink(missing_ok=True)
                    raise ValueError(
                        f"File exceeds maximum size of {self._settings.demo_max_upload_mb} MB"
                    )
                out.write(chunk)

        fps, frame_count, duration_sec = self._probe_video(dest)
        session = DemoSession(
            session_id=session_id,
            filename=original,
            path=dest,
            size_bytes=size,
            fps=fps,
            frame_count=frame_count,
            duration_sec=duration_sec,
        )
        self._sessions[session_id] = session
        logger.info(
            "Demo upload saved: %s (%d bytes, %.1fs)",
            session_id,
            size,
            duration_sec,
        )
        return session

    def remove_session(self, session_id: str) -> None:
        session = self._sessions.pop(session_id, None)
        if session and session.path.exists():
            session.path.unlink(missing_ok=True)

    def cleanup_all(self) -> None:
        for sid in list(self._sessions.keys()):
            self.remove_session(sid)

    @staticmethod
    def _probe_video(path: Path) -> tuple[float, int, float]:
        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            cap.release()
            raise ValueError("Could not read uploaded video file")
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        cap.release()
        duration = frame_count / fps if fps > 0 and frame_count > 0 else 0.0
        return float(fps), frame_count, duration
