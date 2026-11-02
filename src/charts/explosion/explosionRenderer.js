import { easeOut } from "motion";
import { formatChartValue } from "../../utils/formatChartValue.js";
export const BURST_DURATION = 0.65;
export const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  x: Math.cos(i / 32 * Math.PI * 2) * (65 + (i * 17) % 95),
  y: Math.sin(i / 32 * Math.PI * 2) * (65 + (i * 17) % 95), radius: 2 + i % 4,
}));
export function renderExplosion(ctx, scene, time, { staticPreview = false, label } = {}) {
  const row = scene.rows[0];
  if (!row || row.visible === false || (!scene.labels.showValue && !scene.labels.showCategory)) return;
  const { growth = 100, particleCount = 24 } = scene.settings.appearance;
  const size = scene.labels.fontSize ?? 80;
  const x = label?.x ?? 180; const y = label?.y ?? 320;
  const duration = scene.animation.duration;
  if (staticPreview || time < duration) {
    const t = staticPreview ? 0 : Math.max(0, time / duration);
    const scale = 1 + Math.max(0, Math.min(200, growth)) / 100 * t;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = scene.labels.color || row.color; ctx.strokeStyle = scene.labels.color || row.color;
    ctx.textAlign = scene.labels.align || "center"; ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(20, Math.min(180, size))}px Arial Black, Arial, sans-serif`;
    ctx.lineWidth = 7 * t; ctx.lineJoin = "round";
    const lines = label?.lines ?? [formatChartValue(row.value, scene.settings.format)];
    const textX = scene.labels.align === "left" ? -(label?.width ?? 0) / 2 : scene.labels.align === "right" ? (label?.width ?? 0) / 2 : 0;
    for (const [i, text] of lines.entries()) {
      const y = (i - (lines.length - 1) / 2) * size * 1.2;
      if (t > 0) ctx.strokeText(text, textX, y);
      ctx.fillText(text, textX, y);
    }
 ctx.restore();
  } else if (time < duration + BURST_DURATION) {
    const t = Math.max(0, Math.min(1, (time - duration) / BURST_DURATION));
    const motion = easeOut(t);
    const opacity = t < 0.1 ? easeOut(t / 0.1) : t < 0.55 ? 1 : 1 - easeOut((t - 0.55) / 0.45);
    const scale = t < 0.1 ? 0.5 + easeOut(t / 0.1) * 0.8 : t < 0.55 ? 1.3 - easeOut((t - 0.1) / 0.45) * 0.3 : 1 - easeOut((t - 0.55) / 0.45) * 0.8;
    ctx.save(); ctx.globalAlpha = opacity; ctx.fillStyle = row.color;
    for (const p of PARTICLES.slice(0, Math.max(0, Math.min(32, Math.round(particleCount))))) {
      ctx.beginPath(); ctx.arc(x + p.x * motion, y + p.y * motion, p.radius * scale, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
