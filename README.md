<div align="center">

<h1>🚦 AI Smart Traffic Optimization Platform</h1>

<p>
  A full-stack, real-time AI traffic management system powered by <strong>YOLOv8</strong>, <strong>OpenCV</strong>, <strong>FastAPI</strong>, and <strong>Next.js</strong> —  
  dynamically detecting vehicles, estimating congestion, and adapting signal timing on the fly.
</p>

<p>
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/YOLOv8-Ultralytics-purple?style=flat-square" />
  <img src="https://img.shields.io/badge/WebSockets-Real--time-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [WebSocket Protocol](#-websocket-protocol)
- [Signal Optimization Logic](#-signal-optimization-logic)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Future Improvements](#-future-improvements)

---

## 🌐 Overview

The **AI Smart Traffic Optimization Platform** is a real-time smart city solution that combines computer vision and adaptive control algorithms to manage traffic intersections intelligently.

Two operating modes are supported:

| Mode | Description |
|------|-------------|
| 🎥 **Live Camera** | Connects to a webcam, streams frames through YOLOv8 inference, and updates signals in real time |
| 🎬 **Demo Simulation** | Upload any traffic video to replay and analyze congestion scenarios offline |

A **Next.js dashboard** visualizes the live stream, per-class vehicle counts, congestion timelines, and signal state — all updated over WebSockets with sub-second latency.

---

## ✨ Features

### 🤖 Real-Time AI Detection
- YOLOv8n vehicle detection (cars, buses, trucks, motorbikes)
- Bounding boxes with per-class confidence scores
- Frame skipping & resized inference (416 px) for maximum throughput
- Live FPS monitoring

### 🚦 Adaptive Signal Control
- Weighted traffic scoring per vehicle class
- Congestion-aware green duration (10 s → 60 s)
- Priority lane recommendation
- Emergency / ambulance override (90-second green extension)

### 📊 Live SaaS Dashboard
- Annotated video stream (base64 JPEG over WebSocket)
- Congestion level banner (Low / Medium / Heavy / Severe)
- Per-class counters and real-time chart (Recharts)
- Traffic score timeline
- Dark / light mode support

### 🛠️ Developer-Friendly
- OpenAPI docs at `/docs`
- Clean REST + WebSocket API
- Environment-variable–driven configuration
- Async webcam capture with shared stream registry

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│        Next.js Dashboard (3000)     │
│  LiveStreamPanel  │  SignalDisplay  │
│  VehicleCounters  │  MetricCards    │
└────────────┬────────────────────────┘
             │  WebSocket  /  REST API
┌────────────▼────────────────────────┐
│        FastAPI Backend (8000)       │
│  routes.py  │  signal_routes.py     │
│  stream_pipeline.py                 │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│    YOLOv8n + OpenCV Inference       │
│  detection.py  │  analytics.py      │
│  optimization.py                    │
└────────────┬────────────────────────┘
             │
   Webcam / Uploaded video file
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | FastAPI, Uvicorn, Python 3.10+, WebSockets |
| **AI / CV** | YOLOv8n (Ultralytics), OpenCV, NumPy |
| **Deployment** | Vercel (frontend), Hugging Face Spaces (AI demo), local (full real-time) |

---

## 🚀 Getting Started

### Prerequisites

- Python **3.10+**
- Node.js **18+** and npm
- A webcam (for live camera mode)

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/Divyavavilala/Traffic-Management-System.git
cd Traffic-Management-System/backend

# 2. Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
# YOLOv8 weights (yolov8n.pt) are downloaded automatically on first run.

# 4. Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# or
python run.py
```

| Endpoint | URL |
|----------|-----|
| Interactive API docs | http://localhost:8000/docs |
| Health check | http://localhost:8000/api/v1/health |
| WebSocket stream | `ws://localhost:8000/api/v1/ws/traffic` |

> **Preview mode** — opens an OpenCV window instead of the WebSocket stream:
> ```bash
> python run.py preview   # press q to quit
> ```

---

### Frontend Setup

```bash
cd ../frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local   # edit if backend runs on a different host

# 3. Start the dev server
npm run dev
```

Open **http://localhost:3000**, make sure the backend is running, then click **Start Stream**.

---

## ⚙️ Configuration

All backend settings are read from environment variables (or an optional `.env` file in `backend/`).

| Variable | Default | Description |
|----------|---------|-------------|
| `YOLO_MODEL` | `yolov8n.pt` | Model weights file |
| `CONFIDENCE_THRESHOLD` | `0.35` | Minimum detection confidence |
| `INFERENCE_SIZE` | `416` | YOLO input resolution (smaller = faster) |
| `WEBCAM_INDEX` | `0` | `cv2.VideoCapture` device index |
| `FRAME_SKIP` | `2` | Run inference every N-th frame |
| `TARGET_FPS` | `30` | Max webcam capture rate |

Frontend environment variables (`frontend/.env.local`):

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000/api/v1/ws/traffic` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |

---

## 📡 API Reference

### Signal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/signal/state` | Current intersection signal state |
| `POST` | `/api/v1/signal/recommend` | Compute recommendation from traffic metrics |
| `POST` | `/api/v1/signal/emergency` | Activate emergency / ambulance override |
| `DELETE` | `/api/v1/signal/emergency` | Clear emergency override |

---

## 🔌 WebSocket Protocol

Connect to `ws://localhost:8000/api/v1/ws/traffic`.

**Incoming frame message:**

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
  },
  "signal": { ... },
  "recommendation": { ... }
}
```

A dedicated `"type": "signal"` update is broadcast every 5 frames.

**Stop the stream:**

```json
{ "action": "stop" }
```

> ⚠️ Only one active WebSocket stream per server process (shared webcam). For production, fan out frames via a dedicated worker + Redis pub/sub.

---

## 🚦 Signal Optimization Logic

### Vehicle weights (traffic score)

| Vehicle Class | Weight |
|---------------|--------|
| Motorbike | 0.5 |
| Car | 1.0 |
| Bus | 3.0 |
| Truck | 3.0 |

### Congestion → green duration

| Congestion Level | Green Duration |
|-----------------|----------------|
| Low | 10 s |
| Medium | 25 s |
| Heavy | 45 s |
| Severe | 60 s |
| 🚨 Emergency override | 90 s |

---

## 📁 Project Structure

```
Traffic-Management-System/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py          # REST + WebSocket endpoints
│   │   │   └── signal_routes.py   # Signal control endpoints
│   │   ├── models/
│   │   │   ├── schemas.py         # Pydantic request/response models
│   │   │   └── signal.py          # Signal state models
│   │   ├── services/
│   │   │   ├── analytics.py       # Traffic score + FPS calculation
│   │   │   ├── detection.py       # YOLOv8n inference + bounding boxes
│   │   │   ├── optimization.py    # Adaptive signal timing logic
│   │   │   ├── stream_pipeline.py # Frame capture + inference loop
│   │   │   ├── stream_registry.py # Shared stream management
│   │   │   ├── video_simulation.py# Demo video replay
│   │   │   ├── webcam.py          # Webcam capture
│   │   │   └── demo_store.py      # Demo session state
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   └── main.py
│   ├── requirements.txt
│   └── run.py
│
└── frontend/
    └── src/
        ├── components/
        │   ├── dashboard/
        │   │   ├── LiveStreamPanel.tsx
        │   │   ├── VehicleCounters.tsx
        │   │   ├── MetricCards.tsx
        │   │   ├── CongestionStatusBanner.tsx
        │   │   ├── AiInsightPanel.tsx
        │   │   ├── DemoUploadPanel.tsx
        │   │   ├── ModeSelector.tsx
        │   │   └── ...
        │   └── signals/
        │       ├── TrafficLight.tsx
        │       ├── SignalDisplay.tsx
        │       ├── CountdownTimer.tsx
        │       ├── IntersectionSignals.tsx
        │       └── ...
        └── ...
```

---

## ☁️ Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend dashboard | **Vercel** | Auto-deploy from `main` branch |
| AI inference demo | **Hugging Face Spaces** | Upload video → congestion analysis |
| Full real-time backend | **Local / self-hosted** | Requires webcam + GPU recommended |

> Free cloud platforms (Render, Railway, etc.) have limitations with real-time OpenCV processing and WebSocket streaming. The full real-time experience is best run locally or on a GPU-enabled server.

---

## 🔮 Future Improvements

- [ ] Multi-intersection coordination
- [ ] Emergency vehicle detection & prioritization
- [ ] GPS-based real-world traffic data integration
- [ ] Cloud GPU deployment (CUDA-enabled container)
- [ ] Object tracking across frames (DeepSORT / ByteTrack)
- [ ] Historical traffic prediction with time-series models
- [ ] Smart city analytics dashboard
- [ ] Support for IP cameras / RTSP streams

---

## 🙌 Acknowledgements

- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics) — vehicle detection backbone  
- [FastAPI](https://fastapi.tiangolo.com/) — async Python web framework  
- [Next.js](https://nextjs.org/) — React framework for the dashboard  
- [Recharts](https://recharts.org/) — composable charting library

---

<div align="center">
  <sub>Developed as a Real-Time AI Traffic Management System</sub>
</div>
