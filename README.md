AI Smart Traffic Optimization Platform

A modern AI-powered smart traffic management system that uses Computer Vision, YOLOv8, OpenCV, FastAPI, WebSockets, and adaptive signal optimization to analyze traffic congestion and dynamically control traffic signals in realtime.

🚀 Features

✅ Realtime AI Traffic Analysis

YOLOv8 vehicle detection
Live congestion estimation
Dynamic lane analytics
Vehicle counting and monitoring

✅ Adaptive Traffic Signal Optimization
Intelligent green signal timing
Priority lane recommendation
Congestion-aware signal switching
Adaptive intersection control

✅ Modern SaaS Dashboard
Professional responsive UI
Dark/Light mode support
Realtime analytics visualization
Traffic insights dashboard
Beginner-friendly workflow

✅ Live Camera Monitoring
Webcam-based traffic monitoring
Realtime AI inference
Continuous frame processing
Dynamic signal updates

✅ Demo Simulation Mode
Upload traffic videos
Replay traffic scenarios
AI-powered congestion analysis
Signal optimization simulation

✅ Cloud AI Demo Deployment
Public AI inference deployment using Hugging Face Spaces
Online traffic video analysis
Adaptive signal recommendations
Lightweight cloud AI processing

🧠 Tech Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
Framer Motion
Recharts
Backend
FastAPI
Python
WebSockets
Uvicorn
AI / Computer Vision
YOLOv8
OpenCV
Ultralytics
NumPy
Deployment
Vercel (Frontend)
Hugging Face Spaces (AI Demo)
Local FastAPI Backend (Realtime System)

🏗️ Architecture
Frontend (Next.js Dashboard)
        ↓
WebSocket / API Communication
        ↓
FastAPI Backend
        ↓
YOLOv8 + OpenCV Inference Engine
        ↓
Traffic Analytics + Signal Optimization

📸 System Workflow
User selects:
Live Camera Mode
Demo Simulation Mode
AI detects:
Cars
Buses
Trucks
Motorcycles
System calculates:
Congestion level
Vehicle density
Priority lane
Adaptive signal controller:
Adjusts green timing
Recommends lane priority
Optimizes traffic flow

🌐 Live Deployments
Frontend Dashboard -> Deployed on Vercel.
AI Demo (Public)
Upload traffic videos and test AI congestion analysis:
Hugging Face AI Demo

⚠️ Deployment Notes

The original platform was designed as a full realtime AI traffic optimization system using:

FastAPI
WebSockets
YOLOv8
OpenCV
Realtime frame streaming

However, free cloud hosting platforms introduced computational limitations for:

realtime video inference
continuous OpenCV processing
WebSocket streaming
YOLO-based detection pipelines

To ensure stable public deployment:

Current Deployment Strategy
Frontend deployed separately on Vercel
AI inference demo deployed on Hugging Face Spaces
Full realtime backend maintained locally
🎥 Full Local Demo

A complete local demonstration video (.mp4) showcasing:

realtime AI monitoring
adaptive signal switching
live camera mode
dynamic congestion analysis
WebSocket communication
intelligent traffic optimization

will be uploaded to this repository.

🛠️ Local Setup
1. Clone Repository
git clone <your-repo-url>
cd Traffic-Management-System
Backend Setup
cd backend
python -m venv .venv
Windows
.venv\Scripts\activate
Install Dependencies
pip install -r requirements.txt
Run Backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Frontend Setup
cd frontend
npm install
npm run dev

Frontend runs on:

http://localhost:3000

Backend runs on:

http://localhost:8000
📊 AI Capabilities
Vehicle Detection
Congestion Analysis
Lane Prioritization
Adaptive Signal Timing
Traffic Density Monitoring
AI-driven Recommendations
📌 Future Improvements
Multi-intersection coordination
Emergency vehicle prioritization
GPS-based traffic integration
Cloud GPU deployment
Vehicle tracking
Smart city analytics
Historical traffic prediction
Camera support

Developed as an AI-powered Smart City Traffic Optimization System using modern AI, Computer Vision, and Realtime Web technologies.
