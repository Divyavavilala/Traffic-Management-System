import asyncio
import json
import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect

from app.config import get_settings
from app.dependencies import (
    get_demo_store,
    get_video_simulation_service,
    get_webcam_service,
)
from app.models.schemas import DemoUploadResponse, StreamStatus, TrafficAnalytics
from app.services.stream_registry import is_any_stream_running

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    settings = get_settings()
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/stream/status", response_model=StreamStatus)
async def stream_status() -> StreamStatus:
    webcam = get_webcam_service()
    video = get_video_simulation_service()
    if webcam.is_running:
        return webcam.status()
    if video.is_running:
        return video.status()
    return webcam.status()


@router.get("/analytics/demo", response_model=TrafficAnalytics)
async def analytics_demo() -> TrafficAnalytics:
    """Sample analytics shape for API consumers."""
    return TrafficAnalytics(
        vehicle_count=4,
        weighted_traffic_score=5.5,
        counts_by_class={"car": 2, "motorbike": 1, "bus": 1},
        fps=28.5,
    )


@router.post("/demo/upload", response_model=DemoUploadResponse)
async def upload_demo_video(
    file: UploadFile = File(...),
) -> DemoUploadResponse:
    """Upload a prerecorded traffic video for demo simulation mode."""
    store = get_demo_store()
    try:
        session = await store.save_upload(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return DemoUploadResponse(
        session_id=session.session_id,
        filename=session.filename,
        size_bytes=session.size_bytes,
        fps=session.fps,
        frame_count=session.frame_count,
        duration_sec=round(session.duration_sec, 2),
    )


@router.delete("/demo/session/{session_id}")
async def delete_demo_session(session_id: str) -> dict[str, str]:
    store = get_demo_store()
    if store.get_session(session_id) is None:
        raise HTTPException(status_code=404, detail="Demo session not found")
    store.remove_session(session_id)
    return {"status": "deleted", "session_id": session_id}


@router.websocket("/ws/traffic")
async def traffic_websocket(
    websocket: WebSocket,
    mode: str = "live",
    session_id: str | None = None,
) -> None:
    """
    Real-time annotated frames and traffic analytics over WebSocket.

    Query params:
      mode=live (default) — webcam capture
      mode=demo&session_id=<id> — replay uploaded demo video
    """
    await websocket.accept()
    webcam = get_webcam_service()
    video = get_video_simulation_service()
    store = get_demo_store()

    if is_any_stream_running(webcam, video):
        await websocket.send_json(
            {"type": "error", "message": "A traffic stream is already active"}
        )
        await websocket.close(code=1008)
        return

    stream_mode = mode.lower()
    if stream_mode == "demo":
        if not session_id:
            await websocket.send_json(
                {"type": "error", "message": "session_id is required for demo mode"}
            )
            await websocket.close(code=1008)
            return
        session = store.get_session(session_id)
        if session is None:
            await websocket.send_json(
                {"type": "error", "message": "Demo session not found. Upload a video first."}
            )
            await websocket.close(code=1008)
            return
        video.configure(session.path, session.session_id, session.filename)
        stream = video
    elif stream_mode == "live":
        stream = webcam
    else:
        await websocket.send_json(
            {"type": "error", "message": f"Unknown mode '{mode}'. Use live or demo."}
        )
        await websocket.close(code=1008)
        return

    stop_event = asyncio.Event()

    async def listen_for_disconnect() -> None:
        try:
            while True:
                msg = await websocket.receive_text()
                data = json.loads(msg)
                if data.get("action") == "stop":
                    stop_event.set()
                    break
        except WebSocketDisconnect:
            stop_event.set()
        except json.JSONDecodeError:
            pass

    listener = asyncio.create_task(listen_for_disconnect())

    try:
        status = stream.status()
        await websocket.send_json(
            {
                "type": "status",
                "message": "stream_started",
                **status.model_dump(),
            }
        )
        async for frame_msg in stream.stream_frames():
            if stop_event.is_set():
                break
            await websocket.send_json(frame_msg)
            if frame_msg.get("message") == "demo_complete":
                break
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as exc:
        logger.exception("Stream error: %s", exc)
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass
    finally:
        stream.stop()
        listener.cancel()
        try:
            await listener
        except asyncio.CancelledError:
            pass
