
import { useEffect, useRef, useState } from "react";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const MAX_RADIUS = 240;

// Mindestens so viel vom Ring soll erreichbar bleiben.
const VISIBLE_MARGIN = 20;

// Gemeinsamer Positionsbereich für Drag & Drop und Regler.
export const POSITION_MIN = -50;
export const POSITION_MAX = 150;

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

export default function DraggableChart({
  children,
  chartType = "donut",
  positionX,
  positionY,
  size,
  thickness,
  onPositionChange,
  enabled = true,
}) {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const onPositionChangeRef = useRef(onPositionChange);

  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  const outerRadius = (size / 100) * MAX_RADIUS;
  const innerRadius = Math.max(
    0,
    outerRadius * (1 - thickness / 100)
  );

  const getCanvasPoint = (event) => {
    const rect =
      containerRef.current?.getBoundingClientRect();

    if (!rect || !rect.width || !rect.height) {
      return null;
    }

    return {
      x:
        ((event.clientX - rect.left) / rect.width) *
        CANVAS_WIDTH,
      y:
        ((event.clientY - rect.top) / rect.height) *
        CANVAS_HEIGHT,
    };
  };

  const isInsideRing = (point) => {
    const centerX =
      CANVAS_WIDTH * (positionX / 100);

    const centerY =
      CANVAS_HEIGHT * (positionY / 100);

    if (chartType !== "donut") {
      return Math.abs(point.x - centerX) <= outerRadius && Math.abs(point.y - centerY) <= outerRadius;
    }
    const distance = Math.hypot(
      point.x - centerX,
      point.y - centerY
    );

    return (
      distance >= innerRadius - 6 &&
      distance <= outerRadius + 6
    );
  };

  const handleMouseDown = (event) => {
    if (!enabled || event.button !== 0) {
      return;
    }

    const point = getCanvasPoint(event);

    if (!point || !isInsideRing(point)) {
      return;
    }

    event.preventDefault();

    dragRef.current = {
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startPositionX: positionX,
      startPositionY: positionY,
    };

    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (event) => {
      const drag = dragRef.current;

      const rect =
        containerRef.current?.getBoundingClientRect();

      if (
        !drag ||
        !rect ||
        !rect.width ||
        !rect.height
      ) {
        return;
      }

      const deltaX =
        ((event.clientX - drag.startMouseX) /
          rect.width) *
        100;

      const deltaY =
        ((event.clientY - drag.startMouseY) /
          rect.height) *
        100;

      // Der Mittelpunkt darf außerhalb des Bildes liegen.
      // Ein kleiner Teil des Donuts bleibt aber erreichbar.
      const minVisibleX =
        ((VISIBLE_MARGIN - outerRadius) /
          CANVAS_WIDTH) *
        100;

      const maxVisibleX =
        ((CANVAS_WIDTH + outerRadius - VISIBLE_MARGIN) /
          CANVAS_WIDTH) *
        100;

      const minVisibleY =
        ((VISIBLE_MARGIN - outerRadius) /
          CANVAS_HEIGHT) *
        100;

      const maxVisibleY =
        ((CANVAS_HEIGHT + outerRadius - VISIBLE_MARGIN) /
          CANVAS_HEIGHT) *
        100;

      const minX = Math.max(
        POSITION_MIN,
        minVisibleX
      );

      const maxX = Math.min(
        POSITION_MAX,
        maxVisibleX
      );

      const minY = Math.max(
        POSITION_MIN,
        minVisibleY
      );

      const maxY = Math.min(
        POSITION_MAX,
        maxVisibleY
      );

      const nextX = clamp(
        drag.startPositionX + deltaX,
        minX,
        maxX
      );

      const nextY = clamp(
        drag.startPositionY + deltaY,
        minY,
        maxY
      );

      onPositionChangeRef.current?.(
        Math.round(nextX * 10) / 10,
        Math.round(nextY * 10) / 10
      );
    };

    const stopDragging = () => {
      dragRef.current = null;
      setIsDragging(false);
      setIsHovering(false);
    };

    window.addEventListener(
      "mousemove",
      handleWindowMouseMove
    );

    window.addEventListener(
      "mouseup",
      stopDragging
    );

    window.addEventListener(
      "blur",
      stopDragging
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        handleWindowMouseMove
      );

      window.removeEventListener(
        "mouseup",
        stopDragging
      );

      window.removeEventListener(
        "blur",
        stopDragging
      );
    };
  }, [isDragging, outerRadius]);

  const handleMouseMove = (event) => {
    if (!enabled || isDragging) {
      return;
    }

    const point = getCanvasPoint(event);

    setIsHovering(
      point ? isInsideRing(point) : false
    );
  };

  const cursor = !enabled
    ? "default"
    : isDragging
    ? "grabbing"
    : isHovering
    ? "grab"
    : "default";

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (!isDragging) {
          setIsHovering(false);
        }
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        cursor,
        userSelect: isDragging ? "none" : "auto",
      }}
    >
      {children}
    </div>
  );
}
