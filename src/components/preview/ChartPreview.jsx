import { useEffect, useMemo, useRef } from "react";
import {
  VIDEO_WIDTH, VIDEO_HEIGHT, getChartContext, createChartScene,
  renderChartFrame, getChartLabels, chartNames,
} from "../../charts/chartRenderer.js";

export default function ChartPreview({ data, settings, chartType, playAnimation, onLabelMove }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const timeRef = useRef(0);
  const dragRef = useRef(null);
  const scene = useMemo(() => createChartScene(data, settings, chartType), [data, settings, chartType]);
  const { style, duration, speed, bounce, groupMode, pulse } = settings.animation;

  useEffect(() => {
    sceneRef.current = scene;
    const ctx = canvasRef.current && getChartContext(canvasRef.current);
    if (ctx) renderChartFrame(ctx, scene, playAnimation ? timeRef.current : chartType === "explosion" || chartType === "welle" ? 0 : scene.totalDuration, { staticPreview: !playAnimation });
  }, [scene, playAnimation]);

  useEffect(() => {
    const ctx = canvasRef.current && getChartContext(canvasRef.current);
    if (!ctx || (!playAnimation && chartType !== "welle")) return;
    let request;
    let start;
    timeRef.current = 0;
    renderChartFrame(ctx, sceneRef.current, 0, { staticPreview: !playAnimation });
    const tick = (timestamp) => {
      start ??= timestamp;
      const current = sceneRef.current;
      timeRef.current = chartType === "welle" ? (timestamp - start) / 1000 : Math.min((timestamp - start) / 1000, current.totalDuration);
      renderChartFrame(ctx, current, timeRef.current, { staticPreview: !playAnimation });
      if (chartType === "welle" || timeRef.current < current.totalDuration) request = requestAnimationFrame(tick);
      else timeRef.current = Infinity;
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playAnimation, chartType, settings.diagram?.mode, style, duration, speed, bounce, groupMode, pulse]);

  const move = (label, x, y) => {
    const cx = Math.max(label.width / 2 + 4, Math.min(356 - label.width / 2, x));
    const cy = Math.max(label.height / 2 + 4, Math.min(636 - label.height / 2, y));
    onLabelMove?.(label.id, { x: cx - label.anchorX, y: cy - label.anchorY });
  };

  return (
    <div className="chart-preview">
      <canvas ref={canvasRef} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} role="img"
        aria-label={`${chartNames[chartType]}: ${data.map((item) => `${item.category}: ${item.value}`).join(", ")}`} />
      {onLabelMove && getChartLabels(scene).map((label) => (
        <button key={label.id} type="button" className="chart-label-handle"
          aria-label={`Beschriftung ${label.lines.join(" ")} verschieben`}
          title="Beschriftung ziehen oder mit den Pfeiltasten verschieben"
          style={{ left: `${label.x / 360 * 100}%`, top: `${label.y / 640 * 100}%`,
            width: `${label.width / 360 * 100}%`, height: `${label.height / 640 * 100}%` }}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            const rect = canvasRef.current.getBoundingClientRect();
            dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY,
              label, width: rect.width, height: rect.height };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            event.stopPropagation();
            move(drag.label, drag.label.x + (event.clientX - drag.x) / drag.width * 360,
              drag.label.y + (event.clientY - drag.y) / drag.height * 640);
          }}
          onPointerUp={(event) => {
            dragRef.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => { dragRef.current = null; }}
          onKeyDown={(event) => {
            const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
            if (!arrows[event.key]) return;
            event.preventDefault();
            event.stopPropagation();
            const step = event.shiftKey ? 10 : 2;
            move(label, label.x + arrows[event.key][0] * step, label.y + arrows[event.key][1] * step);
          }} />
      ))}
    </div>
  );
}
