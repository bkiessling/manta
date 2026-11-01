
import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";

import {
  polarToCartesian,
  createDonutSegment,
} from "./donutUtils";

import { formatChartValue } from "../../utils/formatChartValue";

const MAX_SEGMENT_ANGLE = 359.999;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

function getSpringDuration(speed) {
  const normalized =
    Math.max(0, Math.min(100, speed)) / 100;

  return 8 - normalized * 7.4;
}

function springProgress(time, bounce) {
  const strength = clamp(bounce, 0, 100) / 100;

  if (strength === 0) {
    return 1 - Math.pow(1 - time, 3);
  }

  const oscillations = 1.5 + strength * 1.5;
  const decay = 7 - strength * 4;

  const envelope = Math.exp(-decay * time);

  const oscillation = Math.cos(
    time * Math.PI * 2 * oscillations
  );

  const raw = 1 - envelope * oscillation;

  const endEnvelope = Math.exp(-decay);
  const endOscillation = Math.cos(
    Math.PI * 2 * oscillations
  );

  const endValue =
    1 - endEnvelope * endOscillation;

  return raw / endValue;
}

function getAnimationTransition(
  style,
  duration,
  delay = 0
) {
  if (style === "easeInOut") {
    return {
      type: "tween",
      duration,
      delay,
      ease: "easeInOut",
    };
  }

  if (style === "easeOut") {
    return {
      type: "tween",
      duration,
      delay,
      ease: "easeOut",
    };
  }

  return {
    type: "tween",
    duration,
    delay,
    ease: "linear",
  };
}

function AnimatedSegment({
  cx,
  cy,
  outerRadius,
  innerRadius,
  startAngle,
  endAngle,
  color,
  duration,
  delay = 0,
  animationStyle = "linear",
  speed = 50,
  bounce = 35,
  playAnimation = false,
}) {
  const isSpring =
    animationStyle === "spring";

  const progress = useMotionValue(
    playAnimation ? 0 : 1
  );

  const segmentAngle = Math.max(
    0,
    endAngle - startAngle
  );

  const path = useTransform(
    progress,
    (currentProgress) => {
      const safeProgress = Math.max(
        0,
        currentProgress
      );

      const currentAngle = Math.min(
        segmentAngle * safeProgress,
        MAX_SEGMENT_ANGLE
      );

      return createDonutSegment(
        cx,
        cy,
        outerRadius,
        innerRadius,
        startAngle,
        startAngle + currentAngle
      );
    }
  );

  useEffect(() => {
    if (!playAnimation) {
      progress.set(1);
      return;
    }

    progress.set(0);

    if (isSpring) {
      const springDuration =
        getSpringDuration(speed);

      const controls = animate(
        progress,
        1,
        {
          type: "tween",
          duration: springDuration,
          delay,
          ease: (time) =>
            springProgress(time, bounce),
        }
      );

      return () => controls.stop();
    }

    const controls = animate(
      progress,
      1,
      getAnimationTransition(
        animationStyle,
        duration,
        delay
      )
    );

    return () => controls.stop();
  }, [
    progress,
    duration,
    delay,
    animationStyle,
    speed,
    bounce,
    playAnimation,
    isSpring,
  ]);

  return (
    <motion.path
      d={path}
      fill={color}
    />
  );
}

export default function Donut({
  data = [],
  thickness = 24,
  gap = 3,
  size = 120,
  duration = 2,
  animationStyle = "linear",
  speed = 50,
  bounce = 35,
  positionX = 50,
  positionY = 35,
  rotation = 0,
  showCategory = true,
  showValue = true,
  labelFontSize = 12,
  labelDistance = 24,
  valueFormat = "percent",
  playAnimation = false,
}) {
  const canvasWidth = 360;
  const canvasHeight = 640;

  const cx =
    canvasWidth * (positionX / 100);

  const cy =
    canvasHeight * (positionY / 100);

  const outerRadius =
    (size / 100) * 240;

  const thicknessValue =
    outerRadius * (thickness / 100);

  const innerRadius =
    outerRadius - thicknessValue;

  // Ausgeblendete Kategorien zählen
  // weiterhin zur Gesamtsumme.
  const total = data.reduce(
    (sum, item) =>
      sum +
      Math.max(0, Number(item.value) || 0),
    0
  );

  let currentAngle = rotation;

  const segments = data.map((item) => {
    const value = Math.max(
      0,
      Number(item.value) || 0
    );

    const percentage =
      total > 0 ? value / total : 0;

    const startAngle = currentAngle;

    const endAngle =
      currentAngle + percentage * 360;

    currentAngle = endAngle;

    return {
      ...item,
      value,
      startAngle,
      endAngle,
      percentage,
      isVisible: item.visible !== false,
    };
  });

  const drawnSegments = segments.filter(
    (segment) =>
      segment.percentage > 0 &&
      segment.isVisible
  );

  const effectiveAnimationStyle =
    animationStyle === "spring" &&
    drawnSegments.length !== 1
      ? "easeOut"
      : animationStyle;

  return (
    <div className="donut">
      <svg
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {drawnSegments.map((segment, index) => {
          const isSpring =
            effectiveAnimationStyle === "spring";

          const segmentDuration = isSpring
            ? duration
            : duration * segment.percentage;

          const segmentDelay = isSpring
            ? 0
            : duration *
              ((segment.startAngle - rotation) / 360);

          return (
            <AnimatedSegment
              key={`segment-${index}`}
              cx={cx}
              cy={cy}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              startAngle={segment.startAngle}
              endAngle={segment.endAngle}
              color={segment.color}
              duration={segmentDuration}
              delay={segmentDelay}
              animationStyle={
                effectiveAnimationStyle
              }
              speed={speed}
              bounce={bounce}
              playAnimation={playAnimation}
            />
          );
        })}

        {drawnSegments.map((segment, index) => {
          if (gap <= 0) return null;

          const originalIndex =
            segments.indexOf(segment);

          const previousSegment =
            segments[
              (originalIndex - 1 +
                segments.length) %
                segments.length
            ];

          if (
            !previousSegment ||
            previousSegment.percentage <= 0 ||
            !previousSegment.isVisible
          ) {
            return null;
          }

          const overlap = 2;

          const innerPoint = polarToCartesian(
            cx,
            cy,
            innerRadius - overlap,
            segment.startAngle
          );

          const outerPoint = polarToCartesian(
            cx,
            cy,
            outerRadius + overlap,
            segment.startAngle
          );

          return (
            <line
              key={`gap-${index}`}
              x1={innerPoint.x}
              y1={innerPoint.y}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke="#f5f5f3"
              strokeWidth={gap}
            />
          );
        })}

        {(showCategory || showValue) &&
          drawnSegments.map((segment, index) => {
            const middleAngle =
              (segment.startAngle +
                segment.endAngle) /
              2;

            const labelPoint =
              polarToCartesian(
                cx,
                cy,
                outerRadius + labelDistance,
                middleAngle
              );

            const labelDelay =
              duration *
              ((segment.endAngle - rotation) /
                360);

            const displayedValue =
              valueFormat === "percent"
                ? formatChartValue(
                    segment.percentage * 100,
                    "percent"
                  )
                : formatChartValue(
                    segment.value,
                    "number"
                  );

            return (
              <motion.text
                key={`label-${index}`}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="donut-segment-label"
                fontSize={labelFontSize}
                initial={
                  playAnimation
                    ? { opacity: 0, y: 6 }
                    : false
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: playAnimation
                    ? 0.35
                    : 0,
                  delay: playAnimation
                    ? labelDelay
                    : 0,
                  ease: "easeOut",
                }}
              >
                {showCategory && (
                  <tspan
                    x={labelPoint.x}
                    dy={
                      showValue
                        ? "-0.5em"
                        : "0"
                    }
                  >
                    {segment.category}
                  </tspan>
                )}

                {showValue && (
                  <tspan
                    x={labelPoint.x}
                    dy={
                      showCategory
                        ? "1.2em"
                        : "0"
                    }
                  >
                    {displayedValue}
                  </tspan>
                )}
              </motion.text>
            );
          })}
      </svg>
    </div>
  );
}
