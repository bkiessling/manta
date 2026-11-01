import { easeInOut, easeOut, spring } from "motion";

export const DESIGN_WIDTH = 360;
export const DESIGN_HEIGHT = 640;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const FPS = 30;
const LABEL_DURATION = 0.35;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const number = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
const radians = (degrees) => ((degrees - 90) * Math.PI) / 180;

export function getDonutContext(canvas) {
  // A detached export canvas has no inherited CSS. Set the text styles on
  // both elements too: browsers can apply inherited spacing during shaping.
  canvas.style.letterSpacing = "0px";
  canvas.style.wordSpacing = "0px";
  canvas.style.fontSynthesis = "none";
  canvas.style.textRendering = "geometricPrecision";
  // PNG export reads every frame. Use the same rasterization path in the
  // preview so browser GPU/readback heuristics cannot change text rendering.
  return canvas.getContext("2d", { alpha: true, willReadFrequently: true });
}

// Sample the same Motion curve at elapsed seconds in the preview and in a video.
export function createAnimation(animation = {}) {
  const { style = "linear" } = animation;
  if (style === "spring" || style === "bounce") {
    const generator = spring({
      keyframes: [0, 1],
      stiffness: clamp(number(animation.stiffness, 90), 20, 300),
      damping: clamp(number(animation.damping, 15), 5, 40),
      mass: style === "bounce" ? 0.9 : 1,
    });
    // Determine the actual settling time instead of cutting springs off at 2s.
    let frames = 1;
    while (!generator.next((frames / FPS) * 1000).done && frames < FPS * 20) {
      frames++;
    }
    const duration = frames / FPS;
    return {
      duration,
      progressAt: (time) => {
        if (time <= 0) return 0;
        if (time >= duration) return 1;
        // A ring cannot sweep beyond a full circle or backwards past its start.
        return clamp(generator.next(time * 1000).value, 0, 1);
      },
    };
  }

  const duration = clamp(number(animation.duration, 2), 0.1, 5);
  const easing = style === "easeOut"
    ? easeOut
    : style === "easeInOut" ? easeInOut : (t) => t;
  return { duration, progressAt: (time) => easing(clamp(time / duration, 0, 1)) };
}

export function createDonutScene(data = [], settings = {}) {
  const { appearance = {}, labels = {}, diagram = {} } = settings;
  const animation = createAnimation(settings.animation);
  const cx = DESIGN_WIDTH * (number(appearance.positionX, 50) / 100);
  const cy = DESIGN_HEIGHT * (number(appearance.positionY, 35) / 100);
  const outerRadius = (number(appearance.size, 70) / 100) * 240;
  const thickness = outerRadius * (number(appearance.thickness, 30) / 100);
  const rotation = number(appearance.rotation, 0);
  const isProgress = diagram.mode === "progress";
  const values = data.map((item) => Math.max(0, number(item.value, 0)));
  const total = values.reduce((sum, value) => sum + value, 0);
  let angle = rotation;
  const segments = (isProgress ? data.slice(0, 1) : data)
    .map((item, index) => {
      const percentage = isProgress
        ? clamp(values[index], 0, 100) / 100
        : total > 0 ? values[index] / total : 0;
      const start = angle;
      angle += percentage * 360;
      return {
        ...item, color: item.color ?? "#a855f7",
        percentage, start, end: angle,
      };
    })
    .filter((segment) => segment.percentage > 0);
  const showLabels = !isProgress && segments.length > 0 &&
    (labels.showCategory || labels.showValue);
  const totalDuration = animation.duration + (showLabels ? LABEL_DURATION : 0);
  return {
    animation, cx, cy, outerRadius, thickness,
    innerRadius: outerRadius - thickness,
    rotation, isProgress, segments, labels, showLabels,
    gap: number(appearance.gap, 0),
    totalDuration,
    // Include a sample at/after the final state, including fully opaque labels.
    frameCount: Math.ceil(totalDuration * FPS) + 1,
  };
}

// Both consumers render onto a transparent 1080x1920 canvas. All coordinates
// below use the 360x640 design space, including fonts and separator widths.
export function renderDonutFrame(ctx, scene, time = scene.totalDuration) {
  const { cx, cy, outerRadius, innerRadius, thickness, segments, animation } = scene;
  ctx.save();
  ctx.setTransform(
    VIDEO_WIDTH / DESIGN_WIDTH, 0, 0,
    VIDEO_HEIGHT / DESIGN_HEIGHT, 0, 0,
  );
  ctx.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
  const progress = animation.progressAt(time);
  const sweep = scene.isProgress
    ? (segments[0]?.percentage ?? 0) * 360
    : 360;
  const visibleEnd = scene.rotation + progress * sweep;

  for (const segment of segments) {
    const end = Math.min(segment.end, visibleEnd);
    if (end <= segment.start) continue;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius - thickness / 2, radians(segment.start), radians(end));
    ctx.strokeStyle = segment.color;
    ctx.lineWidth = thickness;
    ctx.lineCap = "butt";
    ctx.stroke();
  }

  if (!scene.isProgress && scene.gap > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = scene.gap;
    for (const segment of segments) {
      const direction = radians(segment.start);
      ctx.beginPath();
      ctx.moveTo(
        cx + Math.cos(direction) * (innerRadius - 2),
        cy + Math.sin(direction) * (innerRadius - 2),
      );
      ctx.lineTo(
        cx + Math.cos(direction) * (outerRadius + 2),
        cy + Math.sin(direction) * (outerRadius + 2),
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  if (scene.showLabels) {
    const { labels } = scene;
    const fontSize = number(labels.fontSize, 12);
    const opacity = clamp((time - animation.duration) / LABEL_DURATION, 0, 1);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${fontSize}px Arial, sans-serif`;
    // Set canvas text state explicitly as well as the element's CSS above.
    ctx.letterSpacing = "0px";
    ctx.wordSpacing = "0px";
    ctx.direction = "ltr";
    for (const segment of segments) {
      const angle = radians((segment.start + segment.end) / 2);
      const radius = outerRadius + number(labels.distance, 24);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const offset = labels.showCategory && labels.showValue ? fontSize * 0.6 : 0;
      if (labels.showCategory) ctx.fillText(String(segment.category ?? ""), x, y - offset);
      if (labels.showValue) ctx.fillText(`${Math.round(segment.percentage * 100)}%`, x, y + offset);
    }
  }
  ctx.restore();
}
