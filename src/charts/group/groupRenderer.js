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
export const GROUP_PULSE_DURATION = 0.8;

export function groupPulse(scene, time) {
  if (!scene.settings.animation.pulse) return 1;
  const t = (time - scene.animation.duration) / GROUP_PULSE_DURATION;
  return t > 0 && t < 1 ? 1 + 0.08 * Math.sin(Math.PI * t) ** 2 : 1;
}

export function renderGroup(ctx, scene, time) {
  const progress = scene.animation.progressAt(time);
  const columns = Math.ceil(Math.sqrt(scene.peopleCount));
  const cell = scene.width / columns;
  const categoryMode = scene.settings.animation.groupMode === "category";
  const pulse = groupPulse(scene, time);
  for (const person of scene.personStates) {
    const reveal = categoryMode
      ? clamp(progress * scene.visibleGroupCount - person.categoryOrder)
      : clamp(progress * scene.personStates.length - person.order);
    if (reveal <= 0) continue;
    const x = scene.cx - scene.width / 2 + (person.slot % columns + 0.5) * cell;
    const y = scene.cy - scene.height / 2 + (Math.floor(person.slot / columns) + 0.5) * cell * 1.5;
    const width = Math.max(2, cell - scene.gap);
    ctx.save(); ctx.globalAlpha = reveal;
    drawPerson(ctx, x, y, width, person.color, (0.6 + reveal * 0.4) * pulse);
    ctx.restore();
  }
}
