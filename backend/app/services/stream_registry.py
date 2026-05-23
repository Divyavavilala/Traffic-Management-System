from __future__ import annotations

from typing import Protocol

from app.services.video_simulation import VideoSimulationStreamService
from app.services.webcam import WebcamStreamService


class TrafficStreamService(Protocol):
    is_running: bool

    def status(self): ...

    def stop(self) -> None: ...

    def stream_frames(self): ...


def is_any_stream_running(
    webcam: WebcamStreamService,
    video: VideoSimulationStreamService,
) -> bool:
    return webcam.is_running or video.is_running


def get_running_stream(
    webcam: WebcamStreamService,
    video: VideoSimulationStreamService,
) -> TrafficStreamService | None:
    if webcam.is_running:
        return webcam
    if video.is_running:
        return video
    return None
