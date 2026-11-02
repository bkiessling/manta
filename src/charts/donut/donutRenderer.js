import { easeInOut, easeOut } from "motion";

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
  const duration = Math.max(0.1, number(animation.duration, 2));
  const strength = clamp(number(animation.bounce, 35), 0, 100) / 100;
  return {
    duration,
    progressAt(time) {
      const t = clamp(time / duration, 0, 1);
      if (style === "spring") {
        if (!strength) return 1 - (1 - t) ** 3;
        const oscillations = 1.5 + strength * 1.5;
        const decay = 7 - strength * 4;
        const response = (v) => 1 - Math.exp(-decay * v) * Math.cos(v * Math.PI * 2 * oscillations);
        return Math.max(0, response(t) / response(1));
      }
      return style === "easeOut" ? easeOut(t) : style === "easeInOut" ? easeInOut(t) : t;
    },
  };
}

export function createDonutScene(data = [], settings = {}) {
  const { appearance = {}, labels = {}, diagram = {} } = settings;
  const visibleCount = data.filter((row) => row.visible !== false && Number(row.value) > 0).length;
  const animation = createAnimation(settings.animation?.style === "spring" && visibleCount !== 1
    ? { ...settings.animation, style: "easeOut" } : settings.animation);
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
    animation, animationStyle: settings.animation?.style === "spring" && visibleCount === 1 ? "spring" : "tween",
    cx, cy, outerRadius, thickness,
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
  for (const segment of segments) {
    if (segment.visible === false) continue;
    const isSpring = scene.animationStyle === "spring";
    const delay = isSpring ? 0 : animation.duration * (segment.start - scene.rotation) / 360;
    const progress = animation.progressAt(isSpring ? time : (time - delay) / segment.percentage);
    const end = segment.start + Math.min(359.999, (segment.end - segment.start) * progress);
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
    for (const [index, segment] of segments.entries()) {
      const previous = segments[(index - 1 + segments.length) % segments.length];
      if (segment.visible === false || previous.visible === false) continue;
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

  ctx.restore();
}
