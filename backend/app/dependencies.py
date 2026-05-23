from functools import lru_cache

from app.config import Settings, get_settings
from app.services.analytics import AnalyticsService
from app.services.demo_store import DemoVideoStore
from app.services.detection import YoloDetectionService
from app.services.optimization import TrafficOptimizationService
from app.services.video_simulation import VideoSimulationStreamService
from app.services.webcam import WebcamStreamService


@lru_cache
def get_detection_service() -> YoloDetectionService:
    return YoloDetectionService(get_settings())


@lru_cache
def get_analytics_service() -> AnalyticsService:
    return AnalyticsService(get_settings())


@lru_cache
def get_optimization_service() -> TrafficOptimizationService:
    return TrafficOptimizationService()


@lru_cache
def get_webcam_service() -> WebcamStreamService:
    settings = get_settings()
    return WebcamStreamService(
        settings=settings,
        detection=get_detection_service(),
        analytics=get_analytics_service(),
        optimization=get_optimization_service(),
    )


@lru_cache
def get_video_simulation_service() -> VideoSimulationStreamService:
    settings = get_settings()
    return VideoSimulationStreamService(
        settings=settings,
        detection=get_detection_service(),
        analytics=get_analytics_service(),
        optimization=get_optimization_service(),
    )


@lru_cache
def get_demo_store() -> DemoVideoStore:
    return DemoVideoStore(get_settings())
