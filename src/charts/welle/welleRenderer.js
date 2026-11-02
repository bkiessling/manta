export function waveValue(scene, time, staticPreview = false) {
  const t = staticPreview ? 1 : Math.max(0, Math.min(1, time / scene.animation.duration));
  const style = scene.settings.animation.style;
  const progress = style === "easeOut" ? 1 - (1 - t) ** 3
    : style === "easeInOut" ? t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2 : t;
  return Math.max(0, Math.min(100, scene.rows[0]?.value || 0)) * progress;
}
export function renderWave(ctx, scene, time, { staticPreview = false } = {}) {
  const row = scene.rows[0];
  if (!row || row.visible === false || !row.value) return;
  const current = waveValue(scene, time, staticPreview);
  const surface = 640 * (1 - current / 100);
  const edge = Math.max(0, Math.min(1, current / 8, (100 - current) / 8));
  const amplitude = Math.max(0, Number(scene.settings.appearance.waveHeight) || 0) * edge;
  const speed = 0.3 + Math.max(0, Math.min(100, Number(scene.settings.appearance.waveSpeed) || 0)) / 100 * 1.7;
  const phase = time * Math.PI * speed;
  ctx.save();
  ctx.translate(360 * ((scene.settings.appearance.positionX ?? 50) - 50) / 100, 640 * ((scene.settings.appearance.positionY ?? 50) - 50) / 100);
  ctx.beginPath();
  for (let x = 0; x <= 360; x += 3) {
    const y = surface + Math.sin(x / 360 * Math.PI * 4 + phase) * amplitude;
    if (!x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.lineTo(360, 640); ctx.lineTo(0, 640); ctx.closePath();
  ctx.fillStyle = row.color; ctx.fill(); ctx.restore();
}
