import { useEffect, useRef, useState } from "react";
export default function DraggableChart({ children, chartType, positionX, positionY, size,
  gridColumns = 10, gridRows = 10, transformScale = 1, rotation = 0, onTransformChange, onPositionChange }) {
  const ref = useRef(null); const drag = useRef(null); const [selected, select] = useState(false);
  useEffect(() => {
    const outside = (event) => { if (!ref.current?.contains(event.target)) select(false); };
    const escape = (event) => { if (event.key === "Escape") select(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  const start = (event, mode) => {
    if (event.button !== 0 || event.target.closest('.chart-label-handle')) return;
    event.preventDefault(); event.stopPropagation(); select(true);
    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 360;
    const y = (event.clientY - rect.top) / rect.height * 640;
    drag.current = { mode, x, y, px: positionX, py: positionY, scale: transformScale,
      angle: Math.atan2(y - positionY * 6.4, x - positionX * 3.6), rotation,
      distance: Math.max(1, Math.hypot(x - positionX * 3.6, y - positionY * 6.4)) };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event) => {
    const d = drag.current; if (!d) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 360;
    const y = (event.clientY - rect.top) / rect.height * 640;
    if (d.mode === "move") onPositionChange(Math.max(-50, Math.min(150, d.px + (x - d.x) / 3.6)), Math.max(-50, Math.min(150, d.py + (y - d.y) / 6.4)));
    if (d.mode === "scale") onTransformChange("transformScale", Math.max(0.1, Math.min(4, d.scale * Math.hypot(x - d.px * 3.6, y - d.py * 6.4) / d.distance)));
    if (d.mode === "rotate") onTransformChange("transformRotation", d.rotation + (Math.atan2(y - d.py * 6.4, x - d.px * 3.6) - d.angle) * 180 / Math.PI);
  };
  const cell = Math.min(size * 2.8 / gridColumns, 420 * size / 100 / (gridRows * 1.5));
  const width = chartType === "welle" ? 312 : chartType === "donut" ? size * 4.8 : chartType === "explosion" ? 150 : chartType === "group" ? cell * gridColumns : size * 2.8;
  const height = chartType === "welle" ? 592 : chartType === "group" ? cell * gridRows * 1.5 : width;
  return <div ref={ref} className="transform-container" onPointerDown={(e) => start(e, "move")}
    onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
    {children}
    {selected && <button type="button" className="transform-reset" onPointerDown={(e) => e.stopPropagation()}
      onClick={() => { onTransformChange("transformScale", 1); onTransformChange("transformRotation", 0); }}>Transformation zurücksetzen</button>}
    {selected && <div className="transform-box" style={{ left: `${positionX}%`, top: `${positionY}%`, width: `${width * transformScale / 3.6}%`, height: `${height * transformScale / 6.4}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}>
      {["nw", "ne", "sw", "se"].map((corner) => <button key={corner} type="button" className={`transform-grip ${corner}`} aria-label={`Chart proportional skalieren ${corner}`} onPointerDown={(e) => start(e, "scale")} />)}
      <button type="button" className="transform-rotate" aria-label="Chart drehen" onPointerDown={(e) => start(e, "rotate")}>↻</button>
    </div>}
  </div>;
}
