export function getBarLayout(scene) {
  const horizontal = scene.settings.appearance.orientation === "horizontal";
  const left = scene.cx - scene.width / 2;
  return {
    horizontal, left: left + (horizontal ? scene.width * 0.28 : 0),
    top: scene.cy - scene.height / 2,
    width: scene.width * (horizontal ? 0.72 : 1), height: scene.height,
    step: (horizontal ? scene.height : scene.width) / Math.max(1, scene.rows.length),
  };
}

export function renderBars(ctx, scene, time) {
  const progress = Math.max(0, scene.animation.progressAt(time));
  const maximum = Math.max(1, ...scene.rows.map((row) => row.value));
  const plot = getBarLayout(scene);
  const thickness = Math.max(1, plot.step - scene.gap);
  for (const [index, row] of scene.rows.entries()) {
    if (row.visible === false) continue;
    const extent = row.value / maximum * progress;
    ctx.fillStyle = row.color;
    if (plot.horizontal) {
      ctx.fillRect(plot.left, plot.top + index * plot.step + (plot.step - thickness) / 2,
        plot.width * extent, thickness);
    } else {
      const height = plot.height * extent;
      ctx.fillRect(plot.left + index * plot.step + (plot.step - thickness) / 2,
        plot.top + plot.height - height, thickness, height);
    }
  }
}
