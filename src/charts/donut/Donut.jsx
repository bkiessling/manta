
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

function getAnimationTransition(style, duration, delay) {
  if (style === "spring") {
    return {
      type: "spring",
      stiffness: 90,
      damping: 15,
      mass: 1,
      delay,
    };
  }

  if (style === "bounce") {
    return {
      type: "spring",
      stiffness: 140,
      damping: 9,
      mass: 0.9,
      delay,
    };
  }

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
  playAnimation = false,
}) {
  const animatedAngle = useMotionValue(
    playAnimation ? startAngle : endAngle
  );

  const path = useTransform(
    animatedAngle,
    (currentAngle) =>
      createDonutSegment(
        cx,
        cy,
        outerRadius,
        innerRadius,
        startAngle,
        Math.max(
          startAngle,
          Math.min(currentAngle, startAngle + 359.999)
        )
      )
  );

  useEffect(() => {
    if (!playAnimation) {
      animatedAngle.set(endAngle);
      return;
    }

    animatedAngle.set(startAngle);

    const controls = animate(
      animatedAngle,
      endAngle,
      getAnimationTransition(
        animationStyle,
        duration,
        delay
      )
    );

    return () => controls.stop();
  }, [
    animatedAngle,
    startAngle,
    endAngle,
    duration,
    delay,
    animationStyle,
    playAnimation,
  ]);

  return <motion.path d={path} fill={color} />;
}

export default function Donut({
  data = [],
  mode = "distribution",
  thickness = 24,
  gap = 3,
  size = 120,
  duration = 2,
  animationStyle = "linear",
  positionX = 50,
  positionY = 35,
  rotation = 0,
  showCategory = true,
  showValue = true,
  labelFontSize = 12,
  labelDistance = 24,
  playAnimation = false,
}) {
  const canvasWidth = 360;
  const canvasHeight = 640;

  const cx = canvasWidth * (positionX / 100);
  const cy = canvasHeight * (positionY / 100);

  const maxRadius = 240;
  const outerRadius = (size / 100) * maxRadius;

  const thicknessValue =
    outerRadius * (thickness / 100);

  const innerRadius =
    outerRadius - thicknessValue;

  /* =====================================
     PROGRESS DONUT
     ===================================== */

  if (mode === "progress") {
    const item = data[0];

    const percentage = Math.min(
      100,
      Math.max(0, Number(item?.value) || 0)
    );

    const endAngle =
      rotation + (percentage / 100) * 359.999;

    return (
      <div className="donut">
        <svg
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {item && percentage > 0 && (
            <AnimatedSegment
              key="progress"
              cx={cx}
              cy={cy}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              startAngle={rotation}
              endAngle={endAngle}
              color={item.color}
              duration={duration}
              animationStyle={animationStyle}
              playAnimation={playAnimation}
            />
          )}
        </svg>
      </div>
    );
  }

  /* =====================================
     DISTRIBUTION DONUT
     ===================================== */

  const total = data.reduce(
    (sum, item) =>
      sum + Math.max(0, Number(item.value) || 0),
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
      startAngle,
      endAngle,
      percentage,
    };
  });

  return (
    <div className="donut">
      <svg
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {segments.map((segment, index) => {
          if (segment.percentage <= 0) {
            return null;
          }

          const segmentDuration =
            duration * segment.percentage;

          const segmentDelay =
            duration *
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
              animationStyle={animationStyle}
              playAnimation={playAnimation}
            />
          );
        })}

        {segments.map((segment, index) => {
          if (segment.percentage <= 0) {
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
          segments.map((segment, index) => {
            if (segment.percentage <= 0) {
              return null;
            }

            const middleAngle =
              (segment.startAngle +
                segment.endAngle) /
              2;

            const labelRadius =
              outerRadius + labelDistance;

            const labelPoint = polarToCartesian(
              cx,
              cy,
              labelRadius,
              middleAngle
            );

            const labelDelay =
              duration *
              ((segment.endAngle - rotation) / 360);

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
                    {Math.round(
                      segment.percentage * 100
                    )}
                    %
                  </tspan>
                )}
              </motion.text>
            );
          })}
      </svg>
    </div>
  );
}
