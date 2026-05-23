import { API_URL } from "@/lib/config";

export interface DemoUploadResult {
  session_id: string;
  filename: string;
  size_bytes: number;
  fps: number;
  frame_count: number;
  duration_sec: number;
}

export type UploadProgressCallback = (percent: number) => void;

export async function uploadDemoVideo(
  file: File,
  onProgress?: UploadProgressCallback,
): Promise<DemoUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as DemoUploadResult);
        } catch {
          reject(new Error("Invalid server response"));
        }
        return;
      }
      try {
        const err = JSON.parse(xhr.responseText) as { detail?: string };
        reject(new Error(err.detail ?? "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.open("POST", `${API_URL}/api/v1/demo/upload`);
    xhr.send(form);
  });
}

export async function deleteDemoSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/demo/session/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to remove demo session");
  }
}
