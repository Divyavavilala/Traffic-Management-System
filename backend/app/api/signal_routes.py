import logging

from fastapi import APIRouter, HTTPException

from app.dependencies import get_optimization_service
from app.models.signal import (
    EmergencyMode,
    EmergencyRequest,
    SignalRecommendation,
    SignalRecommendationRequest,
    SignalState,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/signal", tags=["signal"])


@router.get("/state", response_model=SignalState)
async def get_signal_state() -> SignalState:
    return get_optimization_service().get_state()


@router.post("/recommend", response_model=SignalRecommendation)
async def recommend_signal(
    body: SignalRecommendationRequest,
) -> SignalRecommendation:
    service = get_optimization_service()
    analytics = body.model_dump()
    rec = service.recommend(analytics, emergency_mode=body.emergency_mode)
    if rec.optimization_active:
        service.apply_recommendation(rec, analytics)
    return rec


@router.post("/emergency", response_model=SignalState)
async def activate_emergency(body: EmergencyRequest) -> SignalState:
    if body.mode == EmergencyMode.NONE:
        raise HTTPException(status_code=400, detail="Use DELETE to clear emergency mode")
    service = get_optimization_service()
    if not service.is_stream_active:
        raise HTTPException(
            status_code=409,
            detail="Start the traffic live stream before activating emergency mode",
        )
    state = service.set_emergency(body.mode, body.lane)
    if not state.optimization_active:
        raise HTTPException(
            status_code=409,
            detail="Emergency override requires detected vehicles in the stream",
        )
    return state


@router.delete("/emergency", response_model=SignalState)
async def clear_emergency() -> SignalState:
    return get_optimization_service().set_emergency(EmergencyMode.NONE)
