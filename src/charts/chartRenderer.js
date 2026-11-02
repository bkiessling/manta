import { chartTransform, transformPoint } from "./transform.js";
import { renderBars, getBarLayout } from "./bar/barRenderer.js";
import { renderGroup, GROUP_PULSE_DURATION } from "./group/groupRenderer.js";
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
  if (chartType !== "donut") base.animation = createAnimation(chartType === "group" && settings.animation.style === "spring" ? { ...settings.animation, style: "easeOut" } : settings.animation);
  const rows = data.map((item, index) => ({
    ...item, id: item.id ?? `row-${index}`, value: Math.max(0, value(item.value)),
    color: item.color || "#a855f7",
  }));
  const gridColumns = clamp(Math.round(value(settings.appearance?.gridColumns, 10)), 1, 20);
  const gridRows = clamp(Math.round(value(settings.appearance?.gridRows, 10)), 1, 20);
  const peopleCount = Math.min(100, gridColumns * gridRows);
  const people = [];
  const personStates = [];
  let visibleGroupCount = 0;
  for (const row of rows) {
    const count = Math.min(Math.floor(row.value), peopleCount - people.length);
    const visible = row.visible !== false && count > 0;
    const categoryOrder = visibleGroupCount;
    if (visible) visibleGroupCount++;
    for (let i = 0; i < count; i++) {
      const slot = people.length;
      people.push(visible ? row.color : null);
      if (visible) personStates.push({ slot, color: row.color, categoryOrder, order: personStates.length });
    }
  }
  let width = 280 * value(settings.appearance?.size, 85) / 100;
  const cell = Math.min(width / gridColumns, 420 * value(settings.appearance?.size, 85) / 100 / (gridRows * 1.5));
  const height = chartType === "group" ? cell * gridRows * 1.5 : width;
  if (chartType === "group") width = cell * gridColumns;
  const labelsVisible = rows.length > 0 && (base.labels.showCategory || base.labels.showValue);
  const totalDuration = base.animation.duration + (chartType === "explosion" ? BURST_DURATION
    : chartType === "welle" ? 0
    : Math.max(labelsVisible ? 0.35 : 0, chartType === "group" && settings.animation.pulse ? GROUP_PULSE_DURATION : 0));
  return {
    ...base, settings, type: chartType, rows, width, height, gridColumns, gridRows, peopleCount, people, personStates, visibleGroupCount,
    totalDuration, frameCount: Math.ceil(totalDuration * FPS) + 1,
    output: settings.output ?? { transparent: true },
  };
}

export function getChartLabels(scene, time = scene.totalDuration, options = {}) {
  const { labels, rows, cx, cy, outerRadius, width, height } = scene;
  if (!labels.showCategory && !labels.showValue) return [];
  const fontSize = value(labels.fontSize, scene.type === "explosion" ? 80 : 12);
  let cumulative = scene.rotation;
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return rows.flatMap((row, index) => {
    let x;
    let y;
    let text = formatChartValue(row.value, scene.settings.format);
    let startAt = scene.animation.duration;
    const barPlot = scene.type === "bar" ? getBarLayout(scene) : null;
    if (scene.type === "donut") {
      const fraction = scene.isProgress ? clamp(row.value, 0, 100) / 100 : total > 0 ? row.value / total : 0;
      if ((scene.isProgress && index > 0) || fraction <= 0) return [];
      const angle = (cumulative + fraction * 180 - 90) * Math.PI / 180;
      cumulative += fraction * 360;
      const radius = outerRadius + 24;
      x = cx + Math.cos(angle) * radius;
      y = cy + Math.sin(angle) * radius;
      text = formatChartValue(scene.settings.format === "percent" ? fraction * 100 : row.value, scene.settings.format);
      startAt = scene.animationStyle === "spring" ? scene.animation.duration : scene.animation.duration * (cumulative - scene.rotation) / 360;
    } else if (scene.type === "welle" || scene.type === "explosion") {
      if (index > 0) return [];
      x = 360 * value(scene.settings.appearance.positionX, 50) / 100; y = 640 * value(scene.settings.appearance.positionY, 50) / 100; startAt = 0;
      if (scene.type === "welle") text = formatChartValue(Math.round(waveValue(scene, time, options.staticPreview)), scene.settings.format);
    } else if (scene.type === "bar") {
      x = barPlot.horizontal ? barPlot.left - 40 : barPlot.left + (index + 0.5) * barPlot.step;
      y = barPlot.horizontal ? barPlot.top + (index + 0.5) * barPlot.step : cy + height / 2 + 24;
    } else {
      const columns = Math.min(2, rows.length);
      x = cx + (index % columns - (columns - 1) / 2) * width / columns;
      y = cy + height / 2 + 24 + Math.floor(index / columns) * fontSize * 3;
    }
    if (scene.type === "bar" && labels.placement === "end") {
      const extent = row.value / Math.max(1, ...rows.map((r) => r.value));
      x = barPlot.horizontal ? barPlot.left + barPlot.width * extent + 24 : barPlot.left + (index + 0.5) * barPlot.step;
      y = barPlot.horizontal ? barPlot.top + (index + 0.5) * barPlot.step : barPlot.top + barPlot.height * (1 - extent) - 20;
    }
    if (row.visible === false) return [];
    const lines = [];
    if (scene.type === "explosion") { if (labels.showCategory) lines.push(String(row.category || "")); if (labels.showValue) lines.push(text); }
    if (scene.type !== "explosion" && labels.showCategory) lines.push(String(row.category ?? ""));
    if (scene.type !== "explosion" && labels.showValue) lines.push(text);
    if (labels.layout === "inline" && lines.length > 1) lines.splice(0, lines.length, lines.join(" · "));
    const labelWidth = Math.min(336, Math.max(32, ...lines.map((line) => line.length * fontSize * 0.7)));
    const labelHeight = lines.length * fontSize * 1.2;
    if (barPlot?.horizontal && labels.placement !== "end") x = barPlot.left - 8 - labelWidth / 2;
    const minX = labelWidth / 2 + 4;
    const minY = labelHeight / 2 + 4;
    const id = scene.type === "bar" ? `${row.id}:${barPlot.horizontal ? "horizontal" : "vertical"}` : row.id;
    const offset = labels.positions?.[id] ?? {};
    // Keep labels reachable even when the ring extends outside the canvas.
    const anchorX = clamp(x, minX, DESIGN_WIDTH - minX);
    const anchorY = clamp(y, minY, DESIGN_HEIGHT - minY);
    return [{
      id, startAt, lines, fontSize, width: labelWidth, height: labelHeight,
      x: clamp(anchorX + value(offset.x), minX, DESIGN_WIDTH - minX),
      y: clamp(anchorY + value(offset.y), minY, DESIGN_HEIGHT - minY),
      anchorX, anchorY,
    }];
  });
}

function renderBaseFrame(ctx, scene, time = scene.totalDuration, options = {}) {
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
    ctx.textAlign = scene.labels.align || "center";
    const textX = label.x + (scene.labels.align === "left" ? -label.width / 2 : scene.labels.align === "right" ? label.width / 2 : 0);
    label.lines.forEach((line, index) => ctx.fillText(line, textX,
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

const transformCanvases = new WeakMap();
export function getDisplayLabels(scene) {
  const t = chartTransform(scene);
  return getChartLabels(scene).map((label) => ({ ...label, ...transformPoint(label, t),
    width: label.width * t.scale, height: label.height * t.scale,
    baseWidth: label.width, baseHeight: label.height, rotation: t.angle * 180 / Math.PI }));
}
export function renderChartFrame(ctx, scene, time = scene.totalDuration, options = {}) {
  const t = chartTransform(scene);
  if ((t.scale === 1 && t.angle === 0) || !ctx.canvas?.ownerDocument) return renderBaseFrame(ctx, scene, time, options);
  let canvas = transformCanvases.get(ctx);
  if (!canvas) { canvas = ctx.canvas.ownerDocument.createElement("canvas"); canvas.width = VIDEO_WIDTH; canvas.height = VIDEO_HEIGHT; transformCanvases.set(ctx, canvas); }
  const inner = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
  canvas.style.letterSpacing = "0px"; canvas.style.wordSpacing = "0px";
  canvas.style.fontSynthesis = "none"; canvas.style.textRendering = "geometricPrecision";
  renderBaseFrame(inner, { ...scene, output: { transparent: true } }, time, options);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  ctx.translate(t.x * 3, t.y * 3); ctx.rotate(t.angle); ctx.scale(t.scale, t.scale);
  ctx.drawImage(canvas, -t.x * 3, -t.y * 3); ctx.restore();
  if (!scene.output.transparent) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = scene.output.backgroundColor || "#f5f5f3"; ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT); ctx.restore();
  }
}
