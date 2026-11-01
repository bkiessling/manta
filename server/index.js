import express from "express";
import multer from "multer";
import JSZip from "jszip";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const app = express();
const PORT = 4318;

// Lokale Vite-Entwicklungsserver erlauben.
// Funktioniert mit 5173, 5174, 5175 usw.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    let isAllowed = false;

    try {
      const url = new URL(origin);

      isAllowed =
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(
          url.hostname
        );
    } catch {
      isAllowed = false;
    }

    if (isAllowed) {
      res.setHeader(
        "Access-Control-Allow-Origin",
        origin
      );

      res.setHeader("Vary", "Origin");

      res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
      );

      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
      );
    }
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 250 * 1024 * 1024,
  },
});

function encodeMov(directory) {
  return new Promise((resolve, reject) => {
    const output = path.join(
      directory,
      "manta-animation.mov"
    );

    const ffmpeg = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-framerate",
      "30",
      "-i",
      path.join(directory, "frame_%05d.png"),
      "-c:v",
      "prores_ks",
      "-profile:v",
      "4",
      "-pix_fmt",
      "yuva444p10le",
      "-alpha_bits",
      "16",
      output,
    ]);

    let errors = "";
    let settled = false;

    ffmpeg.stderr.on("data", (data) => {
      errors += data.toString();
    });

    ffmpeg.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(
        new Error(
          `FFmpeg konnte nicht gestartet werden: ${error.message}`
        )
      );
    });

    ffmpeg.on("close", (code) => {
      if (settled) return;
      settled = true;

      if (code === 0) {
        resolve(output);
      } else {
        reject(
          new Error(
            errors || `FFmpeg-Fehler: ${code}`
          )
        );
      }
    });
  });
}

app.post(
  "/api/export/mov",
  upload.single("frames"),
  async (req, res) => {
    let directory;

    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Keine Frames empfangen.",
        });
      }

      if (Number(req.body.fps) !== 30) {
        return res.status(400).json({
          error: "Nur 30 FPS werden unterstützt.",
        });
      }

      directory = await mkdtemp(
        path.join(tmpdir(), "manta-")
      );

      const zip = await JSZip.loadAsync(
        req.file.buffer
      );

      const names = Object.keys(zip.files)
        .filter((name) =>
          /^frame_\d{5}\.png$/.test(name)
        )
        .sort();

      if (
        names.length < 2 ||
        names.length > 1800
      ) {
        throw new Error(
          "Ungültige Frame-Anzahl."
        );
      }

      for (let i = 0; i < names.length; i++) {
        const expected = `frame_${String(
          i + 1
        ).padStart(5, "0")}.png`;

        if (names[i] !== expected) {
          throw new Error(
            "Fehlerhafte Frame-Reihenfolge."
          );
        }

        const buffer =
          await zip.files[names[i]].async(
            "nodebuffer"
          );

        await writeFile(
          path.join(directory, expected),
          buffer
        );
      }

      const output = await encodeMov(directory);

      const cleanupDirectory = directory;
      directory = null;

      res.download(
        output,
        "manta-animation.mov",
        async (error) => {
          if (error) {
            console.error(error);
          }

          await rm(cleanupDirectory, {
            recursive: true,
            force: true,
          }).catch(console.error);
        }
      );
    } catch (error) {
      console.error(error);

      if (!res.headersSent) {
        res.status(500).json({
          error: error.message,
        });
      }
    } finally {
      if (directory) {
        await rm(directory, {
          recursive: true,
          force: true,
        }).catch(console.error);
      }
    }
  }
);

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `MANTA Export-Server läuft auf http://127.0.0.1:${PORT}`
  );
});