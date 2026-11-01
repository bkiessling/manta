import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm, stat, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";

export const LIMITS = {
  jobs: 2,
  frames: 900,
  frameBytes: 8 * 1024 * 1024,
  uploadBytes: 256 * 1024 * 1024,
  outputBytes: 512 * 1024 * 1024,
  idleMs: 2 * 60_000,
  lifetimeMs: 10 * 60_000,
  encodeMs: 2 * 60_000,
};

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

export function encodeVideo(job, limits) {
  return new Promise((resolve, reject) => {
    const output = path.join(job.directory, "manta-animation.mov");
    const child = spawn("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
      "-framerate", "30", "-i", path.join(job.directory, "frame_%05d.png"),
      "-c:v", "prores_ks", "-profile:v", "4", "-pix_fmt", "yuva444p10le",
      "-alpha_bits", "16", "-threads", "2", "-progress", "pipe:1",
      "-fs", String(limits.outputBytes), output,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let errors = "";
    let progress = "";
    let encoded = 0;
    let killTimer;
    let timedOut = false;
    const stop = () => {
      child.kill("SIGTERM");
      killTimer ??= setTimeout(() => child.kill("SIGKILL"), 2000);
      killTimer.unref();
    };
    const timeout = setTimeout(() => { timedOut = true; stop(); }, limits.encodeMs);
    timeout.unref();
    job.controller.signal.addEventListener("abort", stop, { once: true });
    if (job.controller.signal.aborted) stop();
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      progress += chunk;
      const lines = progress.split(/\r?\n/);
      progress = lines.pop();
      for (const line of lines) {
        const match = /^frame=(\d+)$/.exec(line.trim());
        if (match) {
          encoded = Number(match[1]);
          job.encodedFrames = Math.min(encoded, job.frameCount);
        }
      }
    });
    child.stderr.on("data", (chunk) => { errors = (errors + chunk.toString()).slice(-4096); });
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearTimeout(killTimer);
      job.controller.signal.removeEventListener("abort", stop);
      if (error) reject(error); else resolve(output);
    };
    child.on("error", () => finish(new Error("FFmpeg konnte nicht gestartet werden.")));
    child.on("close", (code) => {
      if (job.controller.signal.aborted) return finish(new DOMException("Abgebrochen", "AbortError"));
      if (timedOut) return finish(new Error("Die Videocodierung hat zu lange gedauert."));
      if (code !== 0 || encoded !== job.frameCount) {
        // Keep diagnostic details on the server; return a readable error to the browser.
        console.error("FFmpeg export failed:", errors);
        return finish(new Error("Das Video konnte nicht vollständig erstellt werden."));
      }
      finish();
    });
  });
}

export class ExportManager {
  constructor({ limits = {}, root = tmpdir(), encoder = encodeVideo } = {}) {
    this.limits = { ...LIMITS, ...limits };
    this.root = root;
    this.encoder = encoder;
    this.jobs = new Map();
    this.timer = setInterval(() => this.expire().catch(console.error), 10_000);
    this.timer.unref();
  }

  async expire(now = Date.now()) {
    const expired = [...this.jobs.values()].filter((job) =>
      now - job.created > this.limits.lifetimeMs ||
      (!job.downloading && job.state !== "encoding" && now - job.touched > this.limits.idleMs));
    await Promise.all(expired.map((job) => this.cancel(job)));
  }

  async create(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw httpError(400, "Bitte gültige Exportdaten senden.");
    }
    const { frameCount, fps } = payload;
    if (!Number.isInteger(frameCount) || frameCount < 2 || frameCount > this.limits.frames || fps !== 30) {
      throw httpError(400, `Erlaubt sind 2 bis ${this.limits.frames} Bilder bei 30 FPS.`);
    }
    if (this.jobs.size >= this.limits.jobs) {
      throw httpError(429, "Der Export-Server ist ausgelastet. Bitte versuche es gleich erneut.");
    }
    const job = {
      id: randomUUID(), frameCount, uploadedFrames: 0, encodedFrames: 0,
      bytes: 0, state: "uploading", created: Date.now(), touched: Date.now(),
      controller: new AbortController(), uploading: false, downloading: false,
    };
    // Reserve capacity before awaiting filesystem work.
    this.jobs.set(job.id, job);
    try {
      job.directory = await mkdtemp(path.join(this.root, "manta-export-"));
      return job;
    } catch (error) {
      this.jobs.delete(job.id);
      throw error;
    }
  }

  get(id) {
    const job = this.jobs.get(id);
    if (!job) throw httpError(404, "Der Export ist nicht mehr verfügbar. Bitte starte ihn erneut.");
    job.touched = Date.now();
    return job;
  }

  status(job) {
    return {
      id: job.id, state: job.state, frameCount: job.frameCount,
      uploadedFrames: job.uploadedFrames, encodedFrames: job.encodedFrames,
      ...(job.error ? { error: job.error } : {}),
    };
  }

  async upload(job, index, request) {
    if (job.state !== "uploading" || job.uploading || index !== job.uploadedFrames + 1 || index > job.frameCount) {
      throw httpError(409, "Die Bilder müssen vollständig und in Reihenfolge übertragen werden.");
    }
    if (request.headers["content-type"]?.split(";")[0] !== "image/png") {
      throw httpError(415, "Bitte PNG-Bilder übertragen.");
    }
    const length = Number(request.headers["content-length"]);
    if (length > this.limits.frameBytes || job.bytes + length > this.limits.uploadBytes) {
      throw httpError(413, "Die Bilddaten sind zu groß. Bitte verkürze die Animation.");
    }
    job.uploading = true;
    const filename = path.join(job.directory, `frame_${String(index).padStart(5, "0")}.png`);
    let bytes = 0;
    let header = Buffer.alloc(0);
    let validated = false;
    const limits = this.limits;
    const validator = new Transform({
      transform(chunk, encoding, callback) {
        bytes += chunk.length;
        if (bytes > limits.frameBytes || job.bytes + bytes > limits.uploadBytes) {
          return callback(httpError(413, "Die Bilddaten sind zu groß."));
        }
        if (!validated) {
          header = Buffer.concat([header, chunk.subarray(0, 24 - header.length)]);
          if (header.length >= 24) {
            if (!header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
                header.toString("ascii", 12, 16) !== "IHDR" ||
                header.readUInt32BE(16) !== 1080 || header.readUInt32BE(20) !== 1920) {
              return callback(httpError(400, "Ein PNG-Bild muss 1080 × 1920 Pixel groß sein."));
            }
            validated = true;
          }
        }
        callback(null, chunk);
      },
    });
    const task = (async () => {
      try {
        await pipeline(request, validator, createWriteStream(filename, { flags: "wx" }), {
          signal: job.controller.signal,
        });
        if (!validated) throw httpError(400, "Das PNG-Bild ist unvollständig.");
        job.uploadedFrames++;
        job.bytes += bytes;
        job.touched = Date.now();
      } catch (error) {
        await unlink(filename).catch(() => {});
        if (!job.controller.signal.aborted) {
          job.state = "failed";
          job.error = "Die Bildübertragung ist fehlgeschlagen. Bitte starte den Export erneut.";
          await rm(job.directory, { recursive: true, force: true });
        }
        throw error;
      } finally {
        job.uploading = false;
      }
    })();
    job.uploadTask = task;
    await task;
  }

  start(job) {
    if (job.state !== "uploading" || job.uploading || job.uploadedFrames !== job.frameCount) {
      throw httpError(409, "Es fehlen noch Bilder für den Export.");
    }
    job.state = "encoding";
    job.encodeTask = (async () => {
      try {
        job.output = await this.encoder(job, this.limits);
        const file = await stat(job.output);
        if (file.size >= this.limits.outputBytes) throw new Error("Die Videodatei ist zu groß.");
        if (!job.controller.signal.aborted) job.state = "ready";
      } catch (error) {
        if (!job.controller.signal.aborted) {
          job.state = "failed";
          job.error = error.message || "Der Export ist fehlgeschlagen.";
          await rm(job.directory, { recursive: true, force: true });
        }
      }
      job.touched = Date.now();
    })();
  }

  cancel(job) {
    if (job.cleanupTask) return job.cleanupTask;
    job.controller.abort();
    job.downloadResponse?.destroy();
    job.cleanupTask = (async () => {
      await Promise.allSettled([job.uploadTask, job.encodeTask]);
      if (job.directory) await rm(job.directory, { recursive: true, force: true });
      this.jobs.delete(job.id);
    })();
    return job.cleanupTask;
  }

  async close() {
    clearInterval(this.timer);
    await Promise.all([...this.jobs.values()].map((job) => this.cancel(job)));
  }
}
