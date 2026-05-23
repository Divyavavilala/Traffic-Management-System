from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Real-Time AI Traffic Optimization Platform"
    app_version: str = "0.1.0"

    # YOLO
    yolo_model: str = "yolov8n.pt"
    confidence_threshold: float = 0.35
    inference_size: int = 416

    # COCO class IDs: 2=car, 3=motorbike, 5=bus, 7=truck
    target_class_ids: tuple[int, ...] = (2, 3, 5, 7)

    # Realtime tuning
    webcam_index: int = 0
    frame_skip: int = 2
    target_fps: float = 30.0
    jpeg_quality: int = 80

    # Demo simulation uploads
    demo_upload_dir: str = "data/demo_uploads"
    demo_max_upload_mb: int = 200

    # Vehicle weights for traffic score
    weight_motorbike: float = 0.5
    weight_car: float = 1.0
    weight_bus: float = 3.0
    weight_truck: float = 3.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
