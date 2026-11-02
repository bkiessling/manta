export function chartTransform(scene) {
  const a = scene.settings.appearance;
  return { x: a.positionX === undefined ? (scene.type === "welle" || scene.type === "explosion" ? 180 : scene.cx) : a.positionX * 3.6,
    y: a.positionY === undefined ? (scene.type === "welle" || scene.type === "explosion" ? 320 : scene.cy) : a.positionY * 6.4,
    scale: a.transformScale ?? 1, angle: (a.transformRotation ?? 0) * Math.PI / 180 };
}
export function transformPoint(point, t, inverse = false) {
  const angle = inverse ? -t.angle : t.angle;
  const scale = inverse ? 1 / t.scale : t.scale;
  const x = point.x - t.x; const y = point.y - t.y;
  return { x: t.x + (x * Math.cos(angle) - y * Math.sin(angle)) * scale,
    y: t.y + (x * Math.sin(angle) + y * Math.cos(angle)) * scale };
}
