import { formatChartValue } from "../../utils/formatChartValue.js";
// Values and rank positions share a time interpolation, keeping category identity stable.
export function raceState(scene, time) {
  const times = [...new Set(scene.rows.map((r) => Number(r.time)).filter(Number.isFinite))].sort((a, b) => a - b);
  if (!times.length) return { rows: [], year: "" };
  const position = Math.min(1, Math.max(0, scene.animation.progressAt(time))) * (times.length - 1);
  const index = Math.min(times.length - 1, Math.floor(position));
  const next = Math.min(times.length - 1, index + 1); const t = position - index;
  const categories = [...new Set(scene.rows.map((r) => r.category))];
  const at = (year) => categories.map((category) => {
    const row = scene.rows.find((r) => r.category === category && Number(r.time) === year);
    const template = row ?? scene.rows.find((r) => r.category === category);
    return { ...template, category, value: row?.value ?? 0 };
  }).filter((r) => r.visible !== false).sort((a, b) => b.value - a.value || a.category.localeCompare(b.category));
  const start = at(times[index]); const end = at(times[next]);
  const rows = start.map((r, rank) => {
    const endRank = end.findIndex((e) => e.category === r.category); const target = end[endRank];
    return { ...r, value: r.value + ((target?.value ?? 0) - r.value) * t,
      rank: rank + ((endRank < 0 ? rank : endRank) - rank) * t };
  });
  return { rows, year: times[index] + (times[next] - times[index]) * t };
}
export function renderRace(ctx, scene, time) {
  const { rows, year } = raceState(scene, time);
  const left = scene.cx - scene.width / 2; const top = scene.cy - scene.height / 2;
  const step = scene.height / Math.max(1, rows.length);
  const maximum = Math.max(1, ...rows.map((r) => r.value));
  const font = Math.min(scene.labels.fontSize ?? 12, step * 0.4);
  for (const row of rows) {
    const y = top + row.rank * step;
    ctx.fillStyle = row.color;
    ctx.fillRect(left, y, scene.width * row.value / maximum, Math.max(1, step - scene.gap));
    ctx.fillStyle = scene.labels.color || "#111111"; ctx.font = `600 ${font}px Arial, sans-serif`;
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    if (scene.labels.showCategory) ctx.fillText(row.category, left + 3, y + step / 2, scene.width * 0.65);
    ctx.textAlign = "right";
    if (scene.labels.showValue) ctx.fillText(formatChartValue(Math.round(row.value), scene.settings.format), left + scene.width, y + step / 2);
  }
  ctx.fillStyle = scene.labels.color || "#111111"; ctx.font = "700 24px Arial, sans-serif";
  ctx.textAlign = "right"; ctx.fillText(String(Math.floor(year)), left + scene.width, top - 20);
}
