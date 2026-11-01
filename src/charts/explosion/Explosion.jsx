
import { motion } from "motion/react";

import { formatChartValue } from "../../utils/formatChartValue";

const WIDTH = 360;
const HEIGHT = 640;

const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const PARTICLES = Array.from(
  { length: 32 },
  (_, index) => {
    const angle =
      (index / 32) * Math.PI * 2;

    const distance =
      65 + ((index * 17) % 95);

    return {
      id: index,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      radius: 2 + (index % 4),
    };
  }
);

export default function Explosion({
  data = [],
  duration = 3,
  size = 80,
  growth = 100,
  particleCount = 24,
  valueFormat = "number",
  playAnimation = false,
}) {
  const item = data[0];

  const value = item?.value ?? 75;
  const color = item?.color || "#7c3aed";
  const visible = item?.visible !== false;

  const displayedValue = formatChartValue(
    value,
    valueFormat
  );

  const totalDuration = Math.max(
    0.5,
    Number(duration) || 3
  );

  const fontSize = clamp(size, 20, 180);

  const finalScale =
    1 + clamp(growth, 0, 200) / 100;

  const count = clamp(
    Math.round(particleCount),
    0,
    PARTICLES.length
  );

  const burstDuration = 0.65;

  return (
    <div
      className="explosion-chart"
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
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        role="img"
        aria-label={`Explosion: ${displayedValue}`}
        style={{
          display: "block",
          overflow: "hidden",
        }}
      >
        {visible && (
          <>
            {/* ZAHL: LINEAR AUFBLASEN */}
            <motion.g
              style={{
                transformOrigin: `${CENTER_X}px ${CENTER_Y}px`,
              }}
              initial={{
                scale: 1,
                opacity: 1,
              }}
              animate={
                playAnimation
                  ? {
                      scale: [1, finalScale],
                      opacity: [1, 1, 0],
                    }
                  : {
                      scale: 1,
                      opacity: 1,
                    }
              }
              transition={{
                scale: {
                  duration: playAnimation
                    ? totalDuration
                    : 0,
                  ease: "linear",
                },
                opacity: {
                  duration: playAnimation
                    ? totalDuration
                    : 0,
                  times: [0, 0.999, 1],
                  ease: "linear",
                },
              }}
            >
              <motion.text
                x={CENTER_X}
                y={CENTER_Y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Arial Black, Arial, sans-serif"
                fontSize={fontSize}
                fontWeight="900"
                fill={color}
                stroke={color}
                strokeLinejoin="round"
                paintOrder="stroke fill"
                initial={{
                  strokeWidth: 0,
                }}
                animate={{
                  strokeWidth: playAnimation
                    ? [0, 7]
                    : 0,
                }}
                transition={{
                  duration: playAnimation
                    ? totalDuration
                    : 0,
                  ease: "linear",
                }}
              >
                {displayedValue}
              </motion.text>
            </motion.g>

            {/* PARTIKEL: ERST NACH DEM PLATZEN */}
            {playAnimation &&
              PARTICLES.slice(0, count).map(
                (particle) => (
                  <motion.circle
                    key={particle.id}
                    cx={CENTER_X}
                    cy={CENTER_Y}
                    r={particle.radius}
                    fill={color}
                    initial={{
                      opacity: 0,
                      x: 0,
                      y: 0,
                      scale: 0.5,
                    }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      x: particle.x,
                      y: particle.y,
                      scale: [
                        0.5,
                        1.3,
                        1,
                        0.2,
                      ],
                    }}
                    transition={{
                      delay: totalDuration,
                      duration: burstDuration,
                      ease: "easeOut",
                      times: [
                        0,
                        0.1,
                        0.55,
                        1,
                      ],
                    }}
                  />
                )
              )}
          </>
        )}
      </svg>
    </div>
  );
}
