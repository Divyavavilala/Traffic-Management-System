"""
Entry points:
  uvicorn run:app --reload --host 0.0.0.0 --port 8000
  python run.py preview   # local OpenCV window (webcam + YOLO)
"""

import asyncio
import sys

import uvicorn

from app.dependencies import get_webcam_service


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        asyncio.run(get_webcam_service().run_local_preview())
        return

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()
