const clamp = (n) => Math.min(1, Math.max(0, n));
function drawPerson(ctx, x, y, width, color, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = color;
  const u = width / 10;
  // Filled vector silhouette: circular head, rounded shoulders and one clean leg block.
  ctx.beginPath(); ctx.arc(0, -u * 4.6, u * 1.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-2.1 * u, -2.7 * u, 4.2 * u, 4.5 * u, 0.8 * u); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-1.15 * u, 1.1 * u, 2.3 * u, 5.5 * u, 0.4 * u); ctx.fill();
  ctx.restore();
}
export const GROUP_PULSE_DURATION = 2.4;

export const GROUP_PULSE_CYCLES = 3;

export function groupPulse(scene, time, continuous = false) {
  if (!scene.settings.animation.pulse) return 1;
  if (time <= scene.animation.duration || (!continuous && time >= (scene.contentDuration ?? scene.totalDuration))) return 1;
  const t = ((time - scene.animation.duration) % GROUP_PULSE_DURATION) / GROUP_PULSE_DURATION;
  return 1 + 0.06 * Math.sin(Math.PI * t) ** 2;
}

export function renderGroup(ctx, scene, time, options = {}) {
  const progress = scene.animation.progressAt(time);
  const columns = scene.gridColumns;
  const cell = scene.width / columns;
  const categoryMode = scene.settings.animation.groupMode === "category";
  const pulse = groupPulse(scene, time, options.continuous);
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
