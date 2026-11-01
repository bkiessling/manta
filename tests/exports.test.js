import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createExportApp } from "../server/index.js";

const png = execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i",
  "color=c=red@0.5:s=1080x1920:r=30,format=rgba", "-frames:v", "1",
  "-threads", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1",
]);

async function fixture(t, options = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "manta-test-"));
  const { app, exports } = createExportApp({ root, ...options });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}/api/exports`;
  t.after(async () => {
    await exports.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });
  const create = () => fetch(base, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ frameCount: 2, fps: 30 }),
  });
  const upload = (id, index, body = png) => fetch(`${base}/${id}/frames/${index}`, {
    method: "PUT", headers: { "Content-Type": "image/png" }, body,
  });
  return { base, root, exports, create, upload };
}

async function waitFor(predicate) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error("Timed out waiting for export state");
}

test("real MOV export reports progress, retains alpha and cleans up after download", async (t) => {
  const f = await fixture(t);
  const created = await f.create();
  assert.equal(created.status, 201);
  const { id } = await created.json();
  for (let i = 1; i <= 2; i++) assert.equal((await f.upload(id, i)).status, 200);
  const started = await fetch(`${f.base}/${id}/encode`, { method: "POST" });
  assert.equal(started.status, 202);
  await waitFor(async () => (await (await fetch(`${f.base}/${id}`)).json()).state === "ready");
  const status = await (await fetch(`${f.base}/${id}`)).json();
  assert.equal(status.encodedFrames, 2);
  const downloaded = await fetch(`${f.base}/${id}/file`);
  assert.equal(downloaded.status, 200);
  assert.match(downloaded.headers.get("content-disposition"), /manta-animation.mov/);
  const movie = Buffer.from(await downloaded.arrayBuffer());
  const filename = path.join(f.root, "test.mov");
  await writeFile(filename, movie);
  const probe = JSON.parse(execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "stream=codec_name,profile,pix_fmt,nb_frames,r_frame_rate,width,height",
    "-of", "json", filename,
  ]));
  assert.equal(probe.streams[0].codec_name, "prores");
  assert.equal(probe.streams[0].profile, "4444");
  assert.equal(probe.streams[0].nb_frames, "2");
  assert.equal(probe.streams[0].r_frame_rate, "30/1");
  assert.equal(probe.streams[0].width, 1080);
  assert.match(probe.streams[0].pix_fmt, /^yuva/);
  const alpha = execFileSync("ffmpeg", [
    "-v", "error", "-i", filename, "-vf", "alphaextract", "-frames:v", "1",
    "-pix_fmt", "gray", "-f", "rawvideo", "pipe:1",
  ], { maxBuffer: 4 * 1024 * 1024 });
  assert.ok(alpha[0] > 100 && alpha[0] < 150, "half-transparent source alpha survives ProRes encoding");
  await waitFor(() => !f.exports.jobs.has(id));
  assert.deepEqual((await readdir(f.root)).filter((name) => name.startsWith("manta-export-")), []);
});

test("capacity is reserved during upload and cancellation frees the slot and files", async (t) => {
  const f = await fixture(t, { limits: { jobs: 1 } });
  const { id } = await (await f.create()).json();
  assert.equal((await f.create()).status, 429);
  await f.upload(id, 1);
  assert.equal((await fetch(`${f.base}/${id}`, { method: "DELETE" })).status, 204);
  assert.deepEqual(await readdir(f.root), []);
  assert.equal((await f.create()).status, 201);
});

test("incomplete, duplicate and oversized uploads are rejected before encoding", async (t) => {
  const f = await fixture(t, { limits: { frameBytes: png.length + 1 } });
  const { id } = await (await f.create()).json();
  assert.equal((await f.upload(id, 2)).status, 409);
  assert.equal((await fetch(`${f.base}/${id}/encode`, { method: "POST" })).status, 409);
  assert.equal((await f.upload(id, 1)).status, 200);
  assert.equal((await f.upload(id, 1)).status, 409);
  assert.equal((await f.upload(id, 2, Buffer.alloc(png.length + 2))).status, 413);
  assert.equal(f.exports.get(id).state, "uploading");
});

test("cancelling encoding aborts the encoder and waits for cleanup", async (t) => {
  let aborted = false;
  const f = await fixture(t, { encoder: (job) => new Promise((resolve, reject) => {
    job.controller.signal.addEventListener("abort", () => {
      aborted = true;
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  }) });
  const { id } = await (await f.create()).json();
  await f.upload(id, 1); await f.upload(id, 2);
  await fetch(`${f.base}/${id}/encode`, { method: "POST" });
  assert.equal((await fetch(`${f.base}/${id}`, { method: "DELETE" })).status, 204);
  assert.equal(aborted, true);
  assert.deepEqual(await readdir(f.root), []);
});

test("encoder failures are readable and delete the uploaded frames", async (t) => {
  const f = await fixture(t, { encoder: async () => { throw new Error("FFmpeg fehlt."); } });
  const { id } = await (await f.create()).json();
  await f.upload(id, 1); await f.upload(id, 2);
  await fetch(`${f.base}/${id}/encode`, { method: "POST" });
  await waitFor(() => f.exports.get(id).state === "failed");
  assert.equal((await (await fetch(`${f.base}/${id}`)).json()).error, "FFmpeg fehlt.");
  await waitFor(async () => (await readdir(f.root)).length === 0);
});

test("abandoned jobs expire even if the browser never sends cancellation", async (t) => {
  const f = await fixture(t);
  const { id } = await (await f.create()).json();
  await f.upload(id, 1);
  const job = f.exports.get(id);
  await f.exports.expire(job.created + f.exports.limits.lifetimeMs + 1);
  assert.equal(f.exports.jobs.size, 0);
  assert.deepEqual(await readdir(f.root), []);
});

test("metadata and cross-site browser writes are rejected", async (t) => {
  const f = await fixture(t);
  const invalid = await fetch(f.base, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ frameCount: 100000, fps: 60 }),
  });
  assert.equal(invalid.status, 400);
  const crossSite = await fetch(f.base, { method: "POST", headers: { Origin: "https://other.example" } });
  assert.equal(crossSite.status, 403);
  assert.equal(f.exports.jobs.size, 0);
});


test("cancellation stops a real FFmpeg process and removes all temporary files", async (t) => {
  const f = await fixture(t);
  const response = await fetch(f.base, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ frameCount: 60, fps: 30 }),
  });
  const { id } = await response.json();
  for (let i = 1; i <= 60; i++) assert.equal((await f.upload(id, i)).status, 200);
  await fetch(`${f.base}/${id}/encode`, { method: "POST" });
  const job = f.exports.get(id);
  assert.equal(job.state, "encoding");
  assert.equal((await fetch(`${f.base}/${id}`, { method: "DELETE" })).status, 204);
  assert.equal(job.controller.signal.aborted, true);
  assert.equal(f.exports.jobs.size, 0);
  assert.deepEqual(await readdir(f.root), []);
});

test("a disconnected PNG upload is cleaned up even without a DELETE request", async (t) => {
  const f = await fixture(t);
  const { id } = await (await f.create()).json();
  const req = http.request(`${f.base}/${id}/frames/1`, {
    method: "PUT", headers: { "Content-Type": "image/png", "Content-Length": png.length },
  });
  req.on("error", () => {});
  req.write(png.subarray(0, 100));
  await waitFor(() => f.exports.get(id).uploading);
  req.destroy();
  await waitFor(() => f.exports.get(id).state === "failed");
  await waitFor(async () => (await readdir(f.root)).length === 0);
});
