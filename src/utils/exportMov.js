
import JSZip from "jszip";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 640;

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const radians = (degrees) =>
  ((degrees - 90) * Math.PI) / 180;

function animationProgress(time, duration, animation) {
  const t = clamp(time / duration, 0, 1);

  switch (animation.style) {
    case "easeOut":
      return 1 - Math.pow(1 - t, 3);

    case "easeInOut":
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

    case "spring":
    case "bounce": {
      const stiffness = animation.stiffness ?? 90;
      const damping = animation.damping ?? 15;

      const frequency = Math.sqrt(stiffness);
      const decay =
        damping *
        (animation.style === "bounce" ? 0.25 : 0.5);

      return clamp(
        1 -
          Math.exp(-decay * time) *
            Math.cos(frequency * time),
        0,
        1
      );
    }

    default:
      return t;
  }
}

function drawRing(
  ctx,
  cx,
  cy,
  radius,
  thickness,
  start,
  end,
  color
) {
  if (end - start <= 0.001) return;

  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    radius,
    radians(start),
    radians(end)
  );

  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = "butt";
  ctx.stroke();
}

function drawSegmentGap(
  ctx,
  cx,
  cy,
  innerRadius,
  outerRadius,
  angle,
  gap
) {
  const direction = radians(angle);

  ctx.beginPath();
  ctx.moveTo(
    cx + Math.cos(direction) * (innerRadius - 2),
    cy + Math.sin(direction) * (innerRadius - 2)
  );
  ctx.lineTo(
    cx + Math.cos(direction) * (outerRadius + 2),
    cy + Math.sin(direction) * (outerRadius + 2)
  );

  ctx.lineWidth = gap;
  ctx.stroke();
}

function drawLabels(
  ctx,
  segments,
  cx,
  cy,
  outerRadius,
  labels
) {
  if (!labels.showCategory && !labels.showValue) {
    return;
  }

  const fontSize = labels.fontSize ?? 12;

  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${fontSize}px Arial, sans-serif`;

  for (const segment of segments) {
    if (segment.percentage <= 0) continue;

    const middle =
      (segment.start + segment.end) / 2;

    const distance =
      outerRadius + (labels.distance ?? 24);

    const x =
      cx + Math.cos(radians(middle)) * distance;

    const y =
      cy + Math.sin(radians(middle)) * distance;

    if (labels.showCategory && labels.showValue) {
      ctx.fillText(
        String(segment.category ?? ""),
        x,
        y - fontSize * 0.6
      );

      ctx.fillText(
        `${Math.round(segment.percentage * 100)}%`,
        x,
        y + fontSize * 0.6
      );
    } else if (labels.showCategory) {
      ctx.fillText(
        String(segment.category ?? ""),
        x,
        y
      );
    } else {
      ctx.fillText(
        `${Math.round(segment.percentage * 100)}%`,
        x,
        y
      );
    }
  }
}

function renderFrame(ctx, data, settings, time, duration) {
  const { appearance, animation, labels } = settings;

  const mode =
    settings.diagram?.mode ?? "distribution";

  const cx =
    DESIGN_WIDTH * (appearance.positionX / 100);

  const cy =
    DESIGN_HEIGHT * (appearance.positionY / 100);

  const outerRadius =
    (appearance.size / 100) * 240;

  const thickness =
    outerRadius * (appearance.thickness / 100);

  const innerRadius = outerRadius - thickness;
  const middleRadius =
    outerRadius - thickness / 2;

  const rotation = appearance.rotation ?? 0;

  const progress = animationProgress(
    time,
    duration,
    animation
  );

  ctx.clearRect(
    0,
    0,
    DESIGN_WIDTH,
    DESIGN_HEIGHT
  );

  if (mode === "progress") {
    const item = data[0];

    if (!item) return;

    const percentage = clamp(
      Number(item.value) || 0,
      0,
      100
    );

    const sweep =
      (percentage / 100) * 360 * progress;

    drawRing(
      ctx,
      cx,
      cy,
      middleRadius,
      thickness,
      rotation,
      rotation + Math.min(sweep, 359.999),
      item.color ?? "#a855f7"
    );

    return;
  }

  const total = data.reduce(
    (sum, item) =>
      sum + Math.max(0, Number(item.value) || 0),
    0
  );

  if (total <= 0) return;

  let currentAngle = rotation;

  const segments = data.map((item) => {
    const value = Math.max(
      0,
      Number(item.value) || 0
    );

    const percentage = value / total;

    const start = currentAngle;
    const end = start + percentage * 360;

    currentAngle = end;

    return {
      ...item,
      percentage,
      start,
      end,
    };
  });

  const visibleEnd =
    rotation + progress * 360;

  for (const segment of segments) {
    if (segment.percentage <= 0) continue;

    drawRing(
      ctx,
      cx,
      cy,
      middleRadius,
      thickness,
      segment.start,
      Math.min(segment.end, visibleEnd),
      segment.color ?? "#a855f7"
    );
  }

  // Trennlinien aus dem Alpha-Kanal entfernen.
  const gap = appearance.gap ?? 0;

  if (gap > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    for (const segment of segments) {
      if (segment.percentage <= 0) continue;

      drawSegmentGap(
        ctx,
        cx,
        cy,
        innerRadius,
        outerRadius,
        segment.start,
        gap
      );
    }

    ctx.restore();
  }

  const isSpring =
    animation.style === "spring" ||
    animation.style === "bounce";

  const labelStart = isSpring ? 0.7 : duration;

  const labelOpacity = clamp(
    (time - labelStart) / 0.35,
    0,
    1
  );

  ctx.save();
  ctx.globalAlpha = labelOpacity;

  drawLabels(
    ctx,
    segments,
    cx,
    cy,
    outerRadius,
    labels
  );

  ctx.restore();
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(
          new Error("PNG-Frame konnte nicht erzeugt werden.")
        );
      },
      "image/png"
    );
  });
}

export async function exportMov({
  data,
  settings,
  onProgress,
}) {
  const canvas = document.createElement("canvas");

  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx = canvas.getContext("2d", {
    alpha: true,
  });

  if (!ctx) {
    throw new Error("Canvas ist nicht verfügbar.");
  }

  ctx.scale(
    WIDTH / DESIGN_WIDTH,
    HEIGHT / DESIGN_HEIGHT
  );

  const style = settings.animation.style;

  // Spring/Bounce bekommen vorerst eine feste
  // Laufzeit. Die exakte Motion-Kurve folgt später.
  const duration =
    style === "spring" || style === "bounce"
      ? 2
      : Math.max(
          0.1,
          Number(settings.animation.duration) || 2
        );

  // 0,35 Sekunden für das Einblenden der Labels.
  const totalDuration = duration + 0.35;

  const frameCount = Math.ceil(
    totalDuration * FPS
  );

  const zip = new JSZip();

  for (let i = 0; i < frameCount; i++) {
    const time = i / FPS;

    renderFrame(
      ctx,
      data,
      settings,
      time,
      duration
    );

    const blob = await canvasToBlob(canvas);

    const name = `frame_${String(
      i + 1
    ).padStart(5, "0")}.png`;

    zip.file(name, blob);

    onProgress?.(
      Math.round(((i + 1) / frameCount) * 65)
    );

    if (i % 5 === 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, 0)
      );
    }
  }

  onProgress?.(70);

  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "STORE",
  });

  onProgress?.(75);

  const formData = new FormData();

  formData.append(
    "frames",
    zipBlob,
    "manta-frames.zip"
  );

  formData.append("fps", String(FPS));

  let response;

  try {
    response = await fetch(
      "http://127.0.0.1:4318/api/export/mov",
      {
        method: "POST",
        body: formData,
      }
    );
  } catch {
    throw new Error(
      "Export-Server nicht erreichbar. Starte npm run server."
    );
  }

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      body.error ?? "MOV-Export fehlgeschlagen."
    );
  }

  onProgress?.(95);

  const movieBlob = await response.blob();

  const url = URL.createObjectURL(movieBlob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "manta-animation.mov";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);

  onProgress?.(100);
}
