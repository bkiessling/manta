
import { useEffect, useState } from "react";

import { formatChartValue } from "../../utils/formatChartValue";

const WIDTH = 360;
const HEIGHT = 640;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

function easeProgress(progress, style) {
  const t = clamp(progress, 0, 1);

  if (style === "easeOut") {
    return 1 - Math.pow(1 - t, 3);
  }

  if (style === "easeInOut") {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  return t;
}

function createWavePath({
  level,
  phase,
  amplitude,
}) {
  const points = [];

  for (let x = 0; x <= WIDTH; x += 3) {
    const wave =
      Math.sin(
        (x / WIDTH) * Math.PI * 4 +
          phase
      ) * amplitude;

    const y = level + wave;

    points.push(
      `${x === 0 ? "M" : "L"} ${x} ${y}`
    );
  }

  return [
    ...points,
    `L ${WIDTH} ${HEIGHT}`,
    `L 0 ${HEIGHT}`,
    "Z",
  ].join(" ");
}

export default function Welle({
  data = [],
  duration = 3,
  animationStyle = "easeInOut",
  waveHeight = 12,
  waveSpeed = 50,
  showCategory = false,
  showValue = false,
  labelFontSize = 12,
  valueFormat = "percent",
  playAnimation = false,
}) {
  const [frame, setFrame] = useState({
    progress: playAnimation ? 0 : 1,
    phase: 0,
  });

  const item = data[0];

  const value = clamp(
    Number(item?.value) || 0,
    0,
    100
  );

  const color = item?.color || "#7c3aed";

  const visible = item?.visible !== false;

  useEffect(() => {
    let frameId;
    let startTime = null;

    const riseDuration =
      Math.max(0.1, Number(duration) || 3) *
      1000;

    function animateFrame(timestamp) {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;

      const progress = playAnimation
        ? clamp(
            elapsed / riseDuration,
            0,
            1
          )
        : 1;

      const speedFactor =
        0.3 +
        (clamp(waveSpeed, 0, 100) / 100) *
          1.7;

      const phase =
        (elapsed / 1000) *
        Math.PI *
        speedFactor;

      setFrame({
        progress,
        phase,
      });

      frameId = requestAnimationFrame(
        animateFrame
      );
    }

    frameId = requestAnimationFrame(
      animateFrame
    );

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    duration,
    waveSpeed,
    playAnimation,
  ]);

  const fillProgress = easeProgress(
    frame.progress,
    animationStyle
  );

  const currentValue = value * fillProgress;

  const surfaceY =
    HEIGHT * (1 - currentValue / 100);

  const amplitude = Math.max(
    0,
    Number(waveHeight) || 0
  );

  const edgeFactor = clamp(
    Math.min(
      currentValue / 8,
      (100 - currentValue) / 8
    ),
    0,
    1
  );

  const activeAmplitude =
    amplitude * edgeFactor;

  const wavePath = createWavePath({
    level: surfaceY,
    phase: frame.phase,
    amplitude: activeAmplitude,
  });

  const labelText = [
    showCategory ? item?.category : null,
    showValue
      ? formatChartValue(
          Math.round(currentValue),
          valueFormat
        )
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="welle-chart"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
        role="img"
        aria-label={`Welle: ${formatChartValue(
          value,
          valueFormat
        )}`}
      >
        {visible && value > 0 && (
          <path
            d={wavePath}
            fill={color}
          />
        )}

        {labelText && (
          <text
            x={WIDTH / 2}
            y={HEIGHT / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={labelFontSize * 2}
            fontWeight="600"
            fill="#292235"
          >
            {labelText}
          </text>
        )}
      </svg>
    </div>
  );
}
