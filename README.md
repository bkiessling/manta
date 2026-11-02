# MANTA

Animated charts for vertical video: Donut, Welle, Explosion, Balken and Gruppe.
All five support MOV/ProRes 4444 export at 1080 × 1920 pixels and 30 FPS.

## Local development in VS Code

Install Node.js 24 and FFmpeg including ffprobe. On macOS with Homebrew:
`brew install ffmpeg`. Verify `node --version`, `ffmpeg -version` and
`ffprobe -version` in the VS Code terminal.

From the repository folder:

```sh
npm ci
```

Keep these running in separate terminals:

```sh
npm run server
```

```sh
npm run dev
```

Open the local URL printed by Vite. Select a chart, edit its data, use the Editor
for animation/appearance and label dragging, then choose Export. There is no ZIP
import step; obtain this branch using Git as usual. Commit or stash any existing
local changes before switching branches.

```sh
npm test
npm run build
npm run lint -- src server vite.config.js tests
```

The repository currently tracks platform-specific node_modules. The cloud
instance therefore uses Linux dependencies in `/workspace/manta-runtime`, with
source directories linked to the checkout and `resolve.preserveSymlinks` enabled.
Run cloud build/dev commands there, and `npm test` in the checkout. Do not commit
locally generated dependency/cache files with application changes.

## Chart structure and preserved features

Each chart has its own folder in `src/charts`: `donut`, `welle`, `explosion`,
`bar`, `group`. Each contains a React entry component and its Canvas renderer.
`components/preview/ChartPreview.jsx` owns playback and label interactions;
`charts/chartRenderer.js` dispatches to the same chart renderer for preview and
video frames. The integration is based on main commit `16a02de`, rather than the
older main used for the first implementation.

- Donut retains hidden categories' angular space, number/percentage formatting,
  sequential segment animation and its single-visible-category spring. Duration is entered in seconds (decimal comma supported); **Federung** controls the spring curve.
- Welle retains fill level, wave height and speed. Its wave keeps moving in the
  preview after the fill animation; export samples a finite portion of the same
  timeline. Labels show the animated fill value.
- Explosion retains a growing, thickening number followed by up to 32 particles.
  The complete 0.65-second particle phase is included in the export. After the
  burst, the number disappears; use Replay to watch it again.
- Balken supports up to 12 categories, independent values and colors. Choose
  **Balken** (horizontal) or **Säulen** (vertical) under Editor → Ausrichtung.
  Lengths/heights scale to the largest value, including hidden categories.
  Labels start to the left of horizontal bars or below vertical columns. Each
  orientation retains its own dragged label positions. The same animation
  selector is used as for the other charts.
- Gruppe starts with a 10 × 10 grid. Configure Spalten and Reihen under Gestaltung.
  Each integer data value adds that many people in the category color. Empty
  or hidden slots are not drawn: there are no gray placeholders. Under Animation,
  choose **Einzeln** to reveal people one after another, or **Je Kategorie** to
  reveal each entire category together. **Zum Abschluss pulsieren** adds one
  gentle 0.8-second pulse after the reveal, including its return to original size
  in the exported video. Up to eight categories share the selected maximum.
  Reduce assigned values before lowering that maximum.

Category visibility and the existing HEX color editor remain available. The
number/percentage switch uses the same segmented button style as the navigation,
with native radio keyboard support, and changes display formatting; donut percentages reflect
shares of the full dataset including hidden categories.

## Labels and backgrounds

Set **Schriftgröße** as a numerical pixel value in the right sidebar for every
chart, including Explosion's main number. The value is used directly for all
chart types. Label positions are controlled by drag and drop; there is no label
distance slider. Enable category/value labels in the Editor, then drag each
label block in the preview. Hover/focus reveals its handle. Arrow keys move it by 2 design pixels;
Shift+Arrow by 10. Explosion's main number is draggable too. Each label uses a
stable row ID so deleting another row does not transfer its position. Positions
are retained across replay and chart switches and applied to video export.
“Beschriftungen zurücksetzen” resets positions for the active chart. Text color
is adjustable for dark backgrounds. Reloading the page currently resets the
project; project persistence is not implemented.

Under Export, keep the transparent background or select a fixed color. The
preview and exported frames use the same background, including chart gaps. MOV
transparency is best checked over another clip in a video editor; ordinary video
players may display transparent areas as black.

## Export service

The browser creates a job and draws/uploads one PNG at a time, without retaining
an entire animation ZIP. The server streams PNGs to temporary disk storage,
encodes with FFmpeg, and reports actual encoded frame counts. The browser's
download manager receives the finished MOV directly.

Vite proxies relative `/api` requests to `http://127.0.0.1:4318`.
`EXPORT_SERVER_URL` overrides the Vite target; `PORT`/`HOST` configure the backend
(default `4318`/`127.0.0.1`). Vite preview uses the same API proxy. For production,
serve frontend and `/api` on one origin. Preserve the original Host at the
reverse proxy; a loopback HTTPS termination proxy must send
`X-Forwarded-Proto: https`. Only loopback forwarding headers are trusted.

Default limits are two active jobs, 18,000 frames, 8 MiB per PNG, 256 MiB total
uploaded data, 512 MiB output and ten minutes of encoding. Idle jobs expire after
two minutes; every job expires after thirty minutes. Cancellation or leaving the
export panel aborts uploads/FFmpeg and removes temporary files. Completed or
broken downloads are cleaned up. After download starts, the browser manages
that transfer. Capacity exhaustion returns a readable HTTP 429 response.

Jobs live on one server instance. Authentication, per-user quotas, persistent
jobs and multi-instance coordination are not implemented.


## Editor controls and module layout

All charts can be dragged in the preview; chart placement sliders have been
removed. Labels remain a section of Editor, beside chart appearance, rather
than a separate navigation step. Label arrangements include two lines or
“category · value”, left/center/right alignment, and separate rows or endpoints
for bars/columns. Manual offsets remain available in each placement.

Font size and person count use common number fields; duration accepts decimal
seconds such as `12,5`, with no five-second input cap. Export still enforces
finite frame, storage and processing budgets (18,000 frames at 30 FPS).
Pulse and transparent background use accessible Ja/Nein switches.

Each chart directory contains a small React entry (`Donut.jsx`, `Bar.jsx`,
`Group.jsx`, `Welle.jsx`, `Explosion.jsx`) and its `*Renderer.js` drawing code.
The entry delegates to `components/preview/ChartPreview.jsx` for the animation
clock, canvas and label dragging. `charts/chartRenderer.js` builds scenes,
positions labels and dispatches to each renderer; `utils/exportMov.js` samples
that same drawing path for video. Shared sidebar components edit settings, not
chart-specific copies of state. The obsolete root `src/BarChart.jsx` was removed.

## Selection transforms and sidebar layout

In Editor, Animation and Appearance are on the left; Labels have their own right
sidebar. Category and Value each use Ja/Nein segmented buttons. Label settings
appear only when at least one is enabled, with color before font size and layout.
Pulsing and export transparency use the same button design.

Click a chart to select it. Drag its body to move it, a corner grip to resize
proportionally, or the round rotation grip to rotate it. Escape or clicking
outside deselects. Transformation zurücksetzen restores scale and rotation.
Size/rotation sliders have been removed. Scale and rotation affect the chart
and its labels together; label dragging converts pointer positions back into
chart coordinates. The export applies the same transformation, while the output
background stays fixed. Wave uses inset selection grips so rounded preview
corners do not hide its handles.


Group uses an explicit grid (default 10 columns × 10 rows), not a person-count
setting. Data values determine the number of people, up to 100; unused cells
stay invisible. Reducing one grid dimension automatically expands the other
when needed to keep assigned data visible. Both dimensions are limited to 20;
very narrow/tall layouts are proportionally fitted to the design space.
