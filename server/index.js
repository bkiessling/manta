import express from "express";
import { pathToFileURL } from "node:url";
import { ExportManager, httpError } from "./exports.js";

export function createExportApp(options = {}) {
  const app = express();
  const exports = new ExportManager(options);
  app.disable("x-powered-by");
  app.set("trust proxy", "loopback");
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    // Use a same-origin Vite/reverse proxy; reject cross-site browser writes.
    if (req.headers.origin && req.headers.origin !== `${req.protocol}://${req.get("host")}`) {
      return res.status(403).json({ error: "Der Export muss über dieselbe Website aufgerufen werden." });
    }
    next();
  });
  app.use(express.json({ limit: "2kb" }));
  app.post("/api/exports", async (req, res) => {
    const job = await exports.create(req.body);
    res.status(201).json(exports.status(job));
  });
  app.get("/api/exports/:id", (req, res) => res.json(exports.status(exports.get(req.params.id))));
  app.put("/api/exports/:id/frames/:index", async (req, res) => {
    const job = exports.get(req.params.id);
    if (!/^\d+$/.test(req.params.index)) throw httpError(400, "Ungültige Bildnummer.");
    await exports.upload(job, Number(req.params.index), req);
    res.json(exports.status(job));
  });
  app.post("/api/exports/:id/encode", (req, res) => {
    const job = exports.get(req.params.id);
    exports.start(job);
    res.status(202).json(exports.status(job));
  });
  app.delete("/api/exports/:id", async (req, res) => {
    const job = exports.get(req.params.id);
    await exports.cancel(job);
    res.sendStatus(204);
  });
  app.get("/api/exports/:id/file", (req, res) => {
    const job = exports.get(req.params.id);
    if (job.state !== "ready" || job.downloading) throw httpError(409, "Das Video ist noch nicht verfügbar.");
    job.downloading = true;
    job.downloadResponse = res;
    res.download(job.output, "manta-animation.mov", (error) => {
      exports.cancel(job).catch(console.error);
      if (error && !res.headersSent && !res.destroyed) res.status(500).end();
    });
  });
  app.use((error, req, res, next) => {
    if (res.destroyed) return;
    if (res.headersSent) return next(error);
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({ error: status >= 500 ? "Der Export-Server konnte die Anfrage nicht verarbeiten." : error.message });
  });
  return { app, exports };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { app, exports } = createExportApp();
  const port = Number(process.env.PORT || 4318);
  const host = process.env.HOST || "127.0.0.1";
  const server = app.listen(port, host, () => console.log(`MANTA Export-Server: ${host}:${port}`));
  server.requestTimeout = 30_000;
  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.once(signal, () => {
      server.close();
      exports.close().finally(() => process.exit(0));
    });
  }
}
