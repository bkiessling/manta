const clamp = (n) => Math.min(1, Math.max(0, n));
function drawPerson(ctx, x, y, width, color, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = color;
  const u = width / 10;
  ctx.beginPath(); ctx.arc(0, -u * 4, u * 1.4, 0, Math.PI * 2); ctx.fill();
  for (const [x, y, w, h] of [[-1.8, -2, 3.6, 5], [-3, -1.8, 1.5, 5], [1.5, -1.8, 1.5, 5], [-1.8, 2, 1.5, 5], [0.3, 2, 1.5, 5]]) {
    ctx.beginPath(); ctx.roundRect(x * u, y * u, w * u, h * u, u * 0.6); ctx.fill();
  }
  ctx.restore();
}
export function renderGroup(ctx, scene, time) {
  const progress = scene.animation.progressAt(time);
  const columns = Math.ceil(Math.sqrt(scene.peopleCount));
  const cell = scene.width / columns;
  for (let i = 0; i < scene.peopleCount; i++) {
    const x = scene.cx - scene.width / 2 + (i % columns + 0.5) * cell;
    const y = scene.cy - scene.height / 2 + (Math.floor(i / columns) + 0.5) * cell * 1.5;
    const width = Math.max(2, cell - scene.gap);
    drawPerson(ctx, x, y, width, "#b5b5bc");
    if (scene.people[i]) {
      const reveal = clamp(progress * scene.peopleCount - i);
      ctx.save(); ctx.globalAlpha = reveal;
      drawPerson(ctx, x, y, width, scene.people[i], 0.6 + reveal * 0.4);
      ctx.restore();
    }
  }
}
