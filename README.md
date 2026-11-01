# MANTA

Animated donut, bar and person-group charts for vertical video, with MOV/ProRes 4444 export
for further editing in applications such as Premiere Pro.

## Development

Use Node 22.12+ or Node 24 and install FFmpeg (including ffprobe) on PATH.
Install dependencies with `npm ci`. Start the two processes in separate terminals:

```sh
npm run server
npm run dev
```

Vite forwards `/api` to the export server at `http://127.0.0.1:4318`. The browser
always uses relative API URLs. `EXPORT_SERVER_URL` can override Vite's backend
target. The backend listens on `HOST` (default `127.0.0.1`) and `PORT` (default
`4318`). Vite preview uses the same API proxy.

The repository currently contains platform-specific tracked `node_modules`.
The configured cloud environment therefore installs Linux dependencies in
`/workspace/manta-runtime`, links the checkout's source directories, and enables
Vite's `resolve.preserveSymlinks`. In that environment, run build/dev commands
from the runtime directory and tests from the checkout.

## Preview and export

The preview and export share `src/charts/chartRenderer.js`, including
geometry, fonts and animation timing. Export samples the timeline at 30 FPS and
includes the completed final frame. Spring duration follows stiffness and damping;
labels fade in after the ring finishes. Gaps remain transparent.

The browser creates an export job, then draws and uploads **one PNG at a time**.
There is no full-animation ZIP or JavaScript video Blob. The server streams PNG
uploads to a private temporary directory, runs FFmpeg with two encoder threads,
and reports actual encoded frame counts while the browser polls for progress.
The browser download manager receives the finished MOV directly.

The UI distinguishes preparing/transferring images, creating the video and
starting the download. “Download started” is not a claim that the operating
system has finished saving the file. Cancelling or leaving the export panel
aborts outstanding work; after the browser download starts, the browser manages
that download. The server deletes files when that transfer completes or breaks.

Default per-server/per-job limits, defined in `server/exports.js`:

- Two concurrent jobs, including uploads and files awaiting download.
- 2–900 PNG frames, exactly 1080 × 1920 pixels, at 30 FPS.
- 8 MiB per PNG, 256 MiB total uploaded data, 512 MiB output video.
- Two minutes maximum encoding time; idle jobs expire after two minutes.
- Every job expires after ten minutes, including abandoned downloads.

Cancellation stops FFmpeg (SIGTERM, then SIGKILL if needed), waits for active
writes/processes to finish, removes temporary files and releases the job slot.
Encoding failures remove input/output files too. There is no persistent queue:
when capacity is exhausted the API returns a readable HTTP 429 response.

## Deployment

Serve the built frontend and `/api` under the **same origin**. A reverse proxy
must forward `/api` to the Node server and preserve the original `Host`. For
HTTPS termination on a loopback proxy, pass `X-Forwarded-Proto: https`; Express
trusts forwarding headers only from loopback addresses. Cross-origin browser
writes are rejected. Vite is the development proxy, not the production host.

Jobs live in memory and temporary disk storage on one server process. This is
suited to one instance; multiple replicas would require shared storage/job
coordination. Authentication and per-user quotas are not implemented.

## Validation

```sh
npm test
npm run build
npm run lint -- src server vite.config.js tests
```

Tests require FFmpeg/ffprobe. They cover shared rendering and timing, alpha in a
real ProRes export, upload validation, capacity limits, progress, cancellation,
client disconnection, encoder failure and expiry cleanup.

## Chart types and editing

- **Donut:** distribution or progress, with the existing animation styles.
- **Balken:** up to 12 categories, independent values/colors, and bars scaled to
  the largest value. All five animation styles are available.
- **Gruppe:** choose 1–100 people in Editor → Gestaltung → Anzahl Personen.
  Each integer value in the data table colors that many people in its category
  color. Unassigned people stay gray. Up to eight categories can share a group;
  their values cannot exceed the selected total. Reduce assigned values before
  lowering the number of people.
- **Labels:** drag each category/value label block in the preview. Hover or focus
  reveals its handle. Arrow keys move it by 2 design pixels; Shift+Arrow by 10.
  Positions are retained across replay and chart switches and used for video
  export. Editor → Beschriftungen zurücksetzen resets the active chart's labels.
  Text color can be changed for dark backgrounds. Settings currently remain in
  browser memory only; a page reload resets the project.
- **Background:** under Export, keep transparency enabled or disable it and
  choose a fixed background color. Both preview and MOV use that background.

## Test locally in VS Code

The clean project ZIP supplied with this task excludes `.git` and `node_modules`.
Extract it into a **new folder** and open that folder in VS Code; this keeps your
existing local work separate. The alternative patch contains all changes since
commit `40ca0c2` and can be applied to a compatible checkout after
`git apply --check manta-changes.patch` succeeds.

1. Install Node.js 24 LTS and FFmpeg (ffprobe is included). On macOS with
   Homebrew: `brew install node@24 ffmpeg`; on Windows with winget:
   `winget install OpenJS.NodeJS.LTS` and `winget install Gyan.FFmpeg`;
   on Ubuntu/Debian: `sudo apt-get install ffmpeg` and install Node 24 LTS.
   Open a new VS Code terminal after installation and check `node --version`,
   `ffmpeg -version` and `ffprobe -version`.
2. In the extracted project directory, run `npm ci` once.
3. Terminal 1: `npm run server`. Leave it running.
4. Terminal 2: `npm run dev`. Open the local address Vite prints in your browser.
5. Choose a chart under Diagramm, change its data under Daten, and test animation,
   label dragging and replay under Editor. Under Export, try both transparent
   and colored backgrounds and download a MOV. Also test the Abbrechen button.
6. A third terminal can run `npm test`, `npm run build`, and
   `npm run lint -- src server vite.config.js tests`.

If port 4318 is occupied, choose another backend port using your shell's `PORT`
environment variable and set `EXPORT_SERVER_URL` to that address before starting
Vite. Keep both terminals running for video export. MOV transparency should be
checked in a video editor over another clip; ordinary video players may display
transparent areas as black.
