import {
  VIDEO_WIDTH, VIDEO_HEIGHT, FPS, getChartContext,
  createChartScene, renderChartFrame,
} from "../charts/chartRenderer.js";

const abortError = () => new DOMException("Export abgebrochen.", "AbortError");
const checkAbort = (signal) => { if (signal?.aborted) throw abortError(); };

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG-Frame konnte nicht erzeugt werden."));
    }, "image/png");
  });
}

async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    if (options.signal?.reason?.name === "TimeoutError") {
      throw new Error("Der Export-Server antwortet nicht rechtzeitig. Bitte versuche es erneut.");
    }
    if (error.name === "AbortError" || options.signal?.aborted) throw abortError();
    throw new Error("Export-Server nicht erreichbar. Bitte prüfe die Verbindung und starte den Server.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Export fehlgeschlagen (${response.status}).`);
  }
  return response;
}

function pause(signal) {
  return new Promise((resolve, reject) => {
    checkAbort(signal);
    const abort = () => { clearTimeout(timer); reject(abortError()); };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, 500);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export async function exportMov({ data, settings, chartType = "donut", onProgress, signal }) {
  const canvas = document.createElement("canvas");
  canvas.width = VIDEO_WIDTH;
  canvas.height = VIDEO_HEIGHT;
  const ctx = getChartContext(canvas);
  if (!ctx) throw new Error("Canvas ist nicht verfügbar.");
  const scene = createChartScene(data, settings, chartType);
  let id;
  const report = (phase, percent, detail = "") => onProgress?.({ phase, percent, detail });
  try {
    checkAbort(signal);
    report("preparing", 0);
    // Always receive the job ID so cancellation can remove a newly created job.
    const created = await request("/api/exports", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frameCount: scene.frameCount, fps: FPS }),
      signal: AbortSignal.timeout(10_000),
    });
    ({ id } = await created.json());
    checkAbort(signal);
    for (let i = 0; i < scene.frameCount; i++) {
      checkAbort(signal);
      const percent = Math.round((i / scene.frameCount) * 65);
      const detail = `Bild ${i + 1} von ${scene.frameCount}`;
      report("rendering", percent, detail);
      renderChartFrame(ctx, scene, i / FPS);
      const blob = await canvasToBlob(canvas);
      checkAbort(signal);
      report("uploading", percent, detail);
      await request(`/api/exports/${id}/frames/${i + 1}`, {
        method: "PUT", headers: { "Content-Type": "image/png" }, body: blob,
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000),
      });
      // Only one PNG is retained at a time; no full animation ZIP is allocated.
    }
    report("encoding", 65);
    await request(`/api/exports/${id}/encode`, {
      method: "POST",
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
    });
    const deadline = Date.now() + 12 * 60_000;
    while (true) {
      checkAbort(signal);
      if (Date.now() > deadline) throw new Error("Die Videocodierung hat zu lange gedauert.");
      const status = await (await request(`/api/exports/${id}`, {
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
      })).json();
      if (status.state === "failed") throw new Error(status.error || "Die Videocodierung ist fehlgeschlagen.");
      if (status.state === "ready") break;
      report("encoding", 65 + Math.round((status.encodedFrames / scene.frameCount) * 30),
        `${status.encodedFrames} von ${scene.frameCount} Bildern`);
      await pause(signal);
    }
    checkAbort(signal);
    // Let the browser stream the finished file to its download manager instead
    // of allocating another potentially large video Blob in JavaScript memory.
    report("downloading", 95);
    const link = document.createElement("a");
    link.href = `/api/exports/${id}/file`;
    link.download = "manta-animation.mov";
    document.body.appendChild(link);
    link.click();
    link.remove();
    id = null; // Download completion/disconnection or the server TTL cleans up.
    report("finished", 100);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    if (id) {
      await fetch(`/api/exports/${id}`, {
        method: "DELETE", keepalive: true, signal: AbortSignal.timeout(5000),
      }).catch(() => {});
    }
  }
}
