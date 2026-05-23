# Traffic AI Dashboard

Modern real-time frontend for the FastAPI traffic optimization backend.

## Stack

- **Next.js 15** (App Router)
- **Tailwind CSS** — dark SaaS UI
- **Recharts** — congestion & FPS charts
- **WebSocket** — `ws://localhost:8000/api/v1/ws/traffic`

## Features

- Live annotated video stream (base64 JPEG frames)
- Weighted traffic score with congestion level
- Per-class vehicle counters (car, motorbike, bus, truck)
- Real-time FPS metric & chart
- Congestion timeline (traffic score + vehicle count)
- Responsive layout

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Ensure the backend is running:

```bash
cd ../backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Click **Start stream** to connect the webcam pipeline via WebSocket.

## Environment

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000/api/v1/ws/traffic` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |
