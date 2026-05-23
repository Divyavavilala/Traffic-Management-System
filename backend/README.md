# Real-Time AI Traffic Optimization Platform — Backend

Python backend for real-time vehicle detection from webcam input using **YOLOv8n**, **OpenCV**, and **FastAPI WebSockets**.

## Features

- Detects **car**, **motorbike**, **bus**, **truck** (COCO classes 2, 3, 5, 7)
- Bounding boxes with confidence scores
- **Vehicle count**, **weighted traffic score**, and **FPS**
- Optimizations: frame skipping, resized inference (`416px`), async capture

### Vehicle weights (traffic score)

| Class     | Weight |
|-----------|--------|
| motorbike | 0.5    |
| car       | 1.0    |
| bus       | 3.0    |
| truck     | 3.0    |

## Project structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes.py          # REST + WebSocket endpoints
│   ├── models/
│   │   └── schemas.py         # Pydantic models
│   ├── services/
│   │   ├── analytics.py       # Traffic score + FPS
│   │   ├── detection.py       # YOLOv8n inference + drawing
│   │   └── webcam.py          # Webcam capture + stream loop
│   ├── config.py
│   ├── dependencies.py
│   └── main.py
├── requirements.txt
├── run.py
└── README.md
```

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

On first run, Ultralytics downloads `yolov8n.pt` automatically.

## Run

### API server (WebSocket stream)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# or
python run.py
```

- Docs: http://localhost:8000/docs
- Health: `GET /api/v1/health`
- WebSocket: `ws://localhost:8000/api/v1/ws/traffic`

### Local preview (OpenCV window)

```bash
python run.py preview
```

Press **q** to quit.

## WebSocket protocol

Connect to `/api/v1/ws/traffic`. Each message:

```json
{
  "type": "frame",
  "frame_id": 42,
  "timestamp_ms": 1710000000000,
  "image_base64": "<JPEG base64>",
  "detections": [
    {
      "class_id": 2,
      "class_name": "car",
      "confidence": 0.87,
      "bbox": [120, 80, 340, 260]
    }
  ],
  "analytics": {
    "vehicle_count": 3,
    "weighted_traffic_score": 4.5,
    "counts_by_class": { "car": 2, "motorbike": 1 },
    "fps": 26.4
  }
}
```

Send `{"action": "stop"}` to end the stream.

Frame messages also include `signal` and `recommendation` objects. Dedicated `type: "signal"` updates are sent every 5 frames.

## Adaptive signal optimization

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/signal/state` | GET | Current intersection signal state |
| `/api/v1/signal/recommend` | POST | Compute recommendation from traffic metrics |
| `/api/v1/signal/emergency` | POST | Activate ambulance/emergency override |
| `/api/v1/signal/emergency` | DELETE | Clear override |

### Green duration rules

| Congestion | Green (seconds) |
|------------|-----------------|
| Low | 10 |
| Medium | 25 |
| Heavy | 45 |
| Severe | 60 |

Emergency/ambulance override extends green to **90 seconds** on the priority lane.

## Configuration

Environment variables (optional `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `YOLO_MODEL` | `yolov8n.pt` | Model weights |
| `CONFIDENCE_THRESHOLD` | `0.35` | Min detection confidence |
| `INFERENCE_SIZE` | `416` | YOLO input size (smaller = faster) |
| `WEBCAM_INDEX` | `0` | `cv2.VideoCapture` index |
| `FRAME_SKIP` | `2` | Run inference every Nth frame |
| `TARGET_FPS` | `30` | Max capture rate |

## Notes

- Only one active WebSocket stream per server process (shared webcam).
- For production, run inference in a dedicated worker and fan out frames via Redis/pub-sub.
