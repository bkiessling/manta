import {
  createDonutScene, renderDonutFrame, DESIGN_WIDTH, DESIGN_HEIGHT,
  VIDEO_WIDTH, VIDEO_HEIGHT, FPS,
} from "./donut/donutRenderer.js";

export { getDonutContext as getChartContext, VIDEO_WIDTH, VIDEO_HEIGHT, FPS } from "./donut/donutRenderer.js";
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const value = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
export const chartNames = { donut: "Donut", bar: "Balken", group: "Gruppe" };

export function createChartScene(data, settings, chartType = "donut") {
  if (!chartNames[chartType]) throw new Error("Unbekannter Diagrammtyp.");
  const base = createDonutScene(data, settings);
  const rows = data.map((item, index) => ({
    ...item, id: item.id ?? `row-${index}`, value: Math.max(0, value(item.value)),
    color: item.color || "#a855f7",
  }));
  const peopleCount = clamp(Math.round(value(settings.appearance?.peopleCount, 100)), 1, 100);
  const people = [];
  for (const row of rows) {
    const count = Math.min(Math.floor(row.value), peopleCount - people.length);
    for (let i = 0; i < count; i++) people.push(row.color);
  }
  const width = 280 * value(settings.appearance?.size, 85) / 100;
  const height = chartType === "bar" ? width : Math.ceil(peopleCount / Math.ceil(Math.sqrt(peopleCount))) * width / Math.ceil(Math.sqrt(peopleCount)) * 1.5;
  const labelsVisible = rows.length > 0 && (base.labels.showCategory || base.labels.showValue);
  const totalDuration = base.animation.duration + (labelsVisible ? 0.35 : 0);
  return {
    ...base, type: chartType, rows, width, height, peopleCount, people,
    totalDuration, frameCount: Math.ceil(totalDuration * FPS) + 1,
    output: settings.output ?? { transparent: true },
  };
}

export function getChartLabels(scene) {
  const { labels, rows, cx, cy, outerRadius, width, height } = scene;
  if (!labels.showCategory && !labels.showValue) return [];
  const fontSize = value(labels.fontSize, 12);
  let cumulative = scene.rotation;
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return rows.flatMap((row, index) => {
    let x;
    let y;
    let text = String(row.value);
    if (scene.type === "donut") {
      const fraction = scene.isProgress ? clamp(row.value, 0, 100) / 100 : total > 0 ? row.value / total : 0;
      if ((scene.isProgress && index > 0) || fraction <= 0) return [];
      const angle = (cumulative + fraction * 180 - 90) * Math.PI / 180;
      cumulative += fraction * 360;
      const radius = outerRadius + value(labels.distance, 24);
      x = cx + Math.cos(angle) * radius;
      y = cy + Math.sin(angle) * radius;
      text = `${Math.round(fraction * 100)}%`;
    } else if (scene.type === "bar") {
      x = cx - width / 2 + (index + 0.5) * width / rows.length;
      y = cy + height / 2 + value(labels.distance, 24);
    } else {
      const columns = Math.min(2, rows.length);
      x = cx + (index % columns - (columns - 1) / 2) * width / columns;
      y = cy + height / 2 + value(labels.distance, 24) + Math.floor(index / columns) * fontSize * 3;
    }
    const lines = [];
    if (labels.showCategory) lines.push(String(row.category ?? ""));
    if (labels.showValue) lines.push(text);
    const labelWidth = Math.min(336, Math.max(32, ...lines.map((line) => line.length * fontSize * 0.7)));
    const labelHeight = lines.length * fontSize * 1.2;
    const minX = labelWidth / 2 + 4;
    const minY = labelHeight / 2 + 4;
    const offset = labels.positions?.[row.id] ?? {};
    // Keep labels reachable even when the ring extends outside the canvas.
    const anchorX = clamp(x, minX, DESIGN_WIDTH - minX);
    const anchorY = clamp(y, minY, DESIGN_HEIGHT - minY);
    return [{
      id: row.id, lines, fontSize, width: labelWidth, height: labelHeight,
      x: clamp(anchorX + value(offset.x), minX, DESIGN_WIDTH - minX),
      y: clamp(anchorY + value(offset.y), minY, DESIGN_HEIGHT - minY),
      anchorX, anchorY,
    }];
  });
}

function drawPerson(ctx, x, y, width, color, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  const unit = width / 10;
  ctx.beginPath();
  ctx.arc(0, -unit * 4, unit * 1.4, 0, Math.PI * 2);
  ctx.fill();
  for (const [left, top, w, h] of [
    [-1.8, -2, 3.6, 5], [-3, -1.8, 1.5, 5], [1.5, -1.8, 1.5, 5],
    [-1.8, 2, 1.5, 5], [0.3, 2, 1.5, 5],
  ]) {
    ctx.beginPath();
    ctx.roundRect(left * unit, top * unit, w * unit, h * unit, unit * 0.6);
    ctx.fill();
  }
  ctx.restore();
}

export function renderChartFrame(ctx, scene, time = scene.totalDuration) {
  if (scene.type === "donut") {
    renderDonutFrame(ctx, { ...scene, showLabels: false }, time);
  } else {
    ctx.save();
    ctx.setTransform(VIDEO_WIDTH / DESIGN_WIDTH, 0, 0, VIDEO_HEIGHT / DESIGN_HEIGHT, 0, 0);
    ctx.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    const progress = scene.animation.progressAt(time);
    const left = scene.cx - scene.width / 2;
    const top = scene.cy - scene.height / 2;
    if (scene.type === "bar") {
      const maximum = Math.max(1, ...scene.rows.map((row) => row.value));
      const step = scene.width / Math.max(1, scene.rows.length);
      const barWidth = Math.max(1, step - scene.gap);
      for (const [index, row] of scene.rows.entries()) {
        const height = row.value / maximum * scene.height * progress;
        ctx.fillStyle = row.color;
        ctx.fillRect(left + index * step + (step - barWidth) / 2, top + scene.height - height, barWidth, height);
      }
    } else {
      const columns = Math.ceil(Math.sqrt(scene.peopleCount));
      const cell = scene.width / columns;
      for (let i = 0; i < scene.peopleCount; i++) {
        const x = left + (i % columns + 0.5) * cell;
        const y = top + (Math.floor(i / columns) + 0.5) * cell * 1.5;
        const iconWidth = Math.max(2, cell - scene.gap);
        drawPerson(ctx, x, y, iconWidth, "#b5b5bc");
        if (scene.people[i]) {
          const reveal = clamp(progress * scene.peopleCount - i, 0, 1);
          ctx.save();
          ctx.globalAlpha = reveal;
          drawPerson(ctx, x, y, iconWidth, scene.people[i], 0.6 + reveal * 0.4);
          ctx.restore();
        }
      }
    }
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
  for (const label of getChartLabels(scene)) {
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
