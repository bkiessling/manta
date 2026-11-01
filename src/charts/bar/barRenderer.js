export function renderBars(ctx, scene, time) {
  const progress = Math.max(0, scene.animation.progressAt(time));
  const maximum = Math.max(1, ...scene.rows.map((row) => row.value));
  const step = scene.width / Math.max(1, scene.rows.length);
  const barWidth = Math.max(1, step - scene.gap);
  for (const [index, row] of scene.rows.entries()) {
    if (row.visible === false) continue;
    const height = row.value / maximum * scene.height * progress;
    ctx.fillStyle = row.color;
    ctx.fillRect(scene.cx - scene.width / 2 + index * step + (step - barWidth) / 2,
      scene.cy + scene.height / 2 - height, barWidth, height);
  }
}
