import { renderBars } from "./bar/barRenderer.js";
import { renderGroup } from "./group/groupRenderer.js";
import { renderWave, waveValue } from "./welle/welleRenderer.js";
import { renderExplosion, BURST_DURATION } from "./explosion/explosionRenderer.js";
import { formatChartValue } from "../utils/formatChartValue.js";
import {
  createDonutScene, createAnimation, renderDonutFrame, DESIGN_WIDTH, DESIGN_HEIGHT,
  VIDEO_WIDTH, VIDEO_HEIGHT, FPS,
} from "./donut/donutRenderer.js";

export { getDonutContext as getChartContext, VIDEO_WIDTH, VIDEO_HEIGHT, FPS } from "./donut/donutRenderer.js";
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const value = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
export const chartNames = { donut: "Donut", bar: "Balken", group: "Gruppe", welle: "Welle", explosion: "Explosion" };

export function createChartScene(data, settings, chartType = "donut") {
  if (!chartNames[chartType]) throw new Error("Unbekannter Diagrammtyp.");
  const base = createDonutScene(data, settings);
  if (chartType !== "donut") base.animation = createAnimation(settings.animation);
  const rows = data.map((item, index) => ({
    ...item, id: item.id ?? `row-${index}`, value: Math.max(0, value(item.value)),
    color: item.color || "#a855f7",
  }));
  const peopleCount = clamp(Math.round(value(settings.appearance?.peopleCount, 100)), 1, 100);
  const people = [];
  for (const row of rows) {
    const count = Math.min(Math.floor(row.value), peopleCount - people.length);
    for (let i = 0; i < count; i++) people.push(row.visible === false ? null : row.color);
  }
  const width = 280 * value(settings.appearance?.size, 85) / 100;
  const height = chartType === "bar" ? width : Math.ceil(peopleCount / Math.ceil(Math.sqrt(peopleCount))) * width / Math.ceil(Math.sqrt(peopleCount)) * 1.5;
  const labelsVisible = rows.length > 0 && (base.labels.showCategory || base.labels.showValue);
  const totalDuration = base.animation.duration + (chartType === "explosion" ? BURST_DURATION
    : chartType === "welle" ? 0 : labelsVisible ? 0.35 : 0);
  return {
    ...base, settings, type: chartType, rows, width, height, peopleCount, people,
    totalDuration, frameCount: Math.ceil(totalDuration * FPS) + 1,
    output: settings.output ?? { transparent: true },
  };
}

export function getChartLabels(scene, time = scene.totalDuration, options = {}) {
  const { labels, rows, cx, cy, outerRadius, width, height } = scene;
  if (scene.type !== "explosion" && !labels.showCategory && !labels.showValue) return [];
  const fontSize = scene.type === "explosion" ? value(scene.settings.appearance.size, 80) : value(labels.fontSize, 12) * (scene.type === "welle" ? 2 : 1);
  let cumulative = scene.rotation;
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return rows.flatMap((row, index) => {
    let x;
    let y;
    let text = formatChartValue(row.value, scene.settings.format);
    let startAt = scene.animation.duration;
    if (scene.type === "donut") {
      const fraction = scene.isProgress ? clamp(row.value, 0, 100) / 100 : total > 0 ? row.value / total : 0;
      if ((scene.isProgress && index > 0) || fraction <= 0) return [];
      const angle = (cumulative + fraction * 180 - 90) * Math.PI / 180;
      cumulative += fraction * 360;
      const radius = outerRadius + value(labels.distance, 24);
      x = cx + Math.cos(angle) * radius;
      y = cy + Math.sin(angle) * radius;
      text = formatChartValue(scene.settings.format === "percent" ? fraction * 100 : row.value, scene.settings.format);
      startAt = scene.animationStyle === "spring" ? scene.animation.duration : scene.animation.duration * (cumulative - scene.rotation) / 360;
    } else if (scene.type === "welle" || scene.type === "explosion") {
      if (index > 0) return [];
      x = 180; y = scene.type === "welle" ? 320 + value(labels.distance, 24) - 24 : 320; startAt = 0;
      if (scene.type === "welle") text = formatChartValue(Math.round(waveValue(scene, time, options.staticPreview)), scene.settings.format);
    } else if (scene.type === "bar") {
      x = cx - width / 2 + (index + 0.5) * width / rows.length;
      y = cy + height / 2 + value(labels.distance, 24);
    } else {
      const columns = Math.min(2, rows.length);
      x = cx + (index % columns - (columns - 1) / 2) * width / columns;
      y = cy + height / 2 + value(labels.distance, 24) + Math.floor(index / columns) * fontSize * 3;
    }
    if (row.visible === false) return [];
    const lines = [];
    if (scene.type === "explosion") lines.push(text);
    if (scene.type !== "explosion" && labels.showCategory) lines.push(String(row.category ?? ""));
    if (scene.type !== "explosion" && labels.showValue) lines.push(text);
    const labelWidth = Math.min(336, Math.max(32, ...lines.map((line) => line.length * fontSize * 0.7)));
    const labelHeight = lines.length * fontSize * 1.2;
    const minX = labelWidth / 2 + 4;
    const minY = labelHeight / 2 + 4;
    const offset = labels.positions?.[row.id] ?? {};
    // Keep labels reachable even when the ring extends outside the canvas.
    const anchorX = clamp(x, minX, DESIGN_WIDTH - minX);
    const anchorY = clamp(y, minY, DESIGN_HEIGHT - minY);
    return [{
      id: row.id, startAt, lines, fontSize, width: labelWidth, height: labelHeight,
      x: clamp(anchorX + value(offset.x), minX, DESIGN_WIDTH - minX),
      y: clamp(anchorY + value(offset.y), minY, DESIGN_HEIGHT - minY),
      anchorX, anchorY,
    }];
  });
}

export function renderChartFrame(ctx, scene, time = scene.totalDuration, options = {}) {
  if (scene.type === "donut") {
    renderDonutFrame(ctx, scene, time);
  } else {
    ctx.save();
    ctx.setTransform(VIDEO_WIDTH / DESIGN_WIDTH, 0, 0, VIDEO_HEIGHT / DESIGN_HEIGHT, 0, 0);
    ctx.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    if (scene.type === "bar") renderBars(ctx, scene, time);
    if (scene.type === "group") renderGroup(ctx, scene, time);
    if (scene.type === "welle") renderWave(ctx, scene, time, options);
    if (scene.type === "explosion") renderExplosion(ctx, scene, time, {
      ...options, label: getChartLabels(scene, time, options)[0],
    });
    ctx.restore();
  }
  ctx.save();
  ctx.setTransform(VIDEO_WIDTH / DESIGN_WIDTH, 0, 0, VIDEO_HEIGHT / DESIGN_HEIGHT, 0, 0);
  ctx.globalAlpha = clamp((time - scene.animation.duration) / 0.35, 0, 1);
  ctx.fillStyle = /^#[0-9a-f]{6}$/i.test(scene.labels.color) ? scene.labels.color : "#111111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "0px";
  ctx.wordSpacing = "0px";
  ctx.direction = "ltr";
  for (const label of scene.type === "explosion" ? [] : getChartLabels(scene, time, options)) {
    ctx.globalAlpha = scene.type === "welle" ? 1 : clamp((time - label.startAt) / 0.35, 0, 1);
    ctx.font = `600 ${label.fontSize}px Arial, sans-serif`;
    label.lines.forEach((line, index) => ctx.fillText(line, label.x,
      label.y + (index - (label.lines.length - 1) / 2) * label.fontSize * 1.2, 336));
  }
  ctx.restore();
  // Fill behind the complete chart so transparent ring gaps get the chosen
  // background too, rather than being cut out of an earlier background fill.
  if (!scene.output.transparent) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = /^#[0-9a-f]{6}$/i.test(scene.output.backgroundColor) ? scene.output.backgroundColor : "#f5f5f3";
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    ctx.restore();
  }
}
