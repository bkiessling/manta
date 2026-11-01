
const animationLabels = {
  linear: "Linear",
  easeOut: "Sanft",
  easeInOut: "Sanft (In & Out)",
  spring: "Federnd",
  bounce: "Springend",
};

export default function AnimationSection({
  animation,
  animationOptions,
  updateSetting,
}) {
  const styleControls =
    animationOptions.styleControls?.[animation.style] ??
    (["spring", "bounce"].includes(animation.style)
      ? ["stiffness", "damping"]
      : ["duration"]);

  const isSpringAnimation =
    styleControls.includes("stiffness");

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        ANIMATION
      </div>

      <div className="section-content">
        <div className="control">
          <div className="control-header">
            <span>BEWEGUNG</span>
          </div>

          <select
            className="animation-select"
            value={animation.style}
            onChange={(event) =>
              updateSetting(
                "animation",
                "style",
                event.target.value
              )
            }
          >
            {animationOptions.styles.map((style) => (
              <option key={style} value={style}>
                {animationLabels[style] ?? style}
              </option>
            ))}
          </select>
        </div>

        {!isSpringAnimation && (
          <div className="control">
            <div className="control-header">
              <span>DAUER</span>
              <span>
                {animation.duration.toFixed(1)} s
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={animation.duration}
              onChange={(event) =>
                updateSetting(
                  "animation",
                  "duration",
                  Number(event.target.value)
                )
              }
            />
          </div>
        )}

        {styleControls.includes("stiffness") && (
          <div className="control">
            <div className="control-header">
              <span>FEDERSTÄRKE</span>
              <span>{animation.stiffness}</span>
            </div>

            <input
              type="range"
              min="20"
              max="300"
              step="5"
              value={animation.stiffness}
              onChange={(event) =>
                updateSetting(
                  "animation",
                  "stiffness",
                  Number(event.target.value)
                )
              }
            />
          </div>
        )}

        {styleControls.includes("damping") && (
          <div className="control">
            <div className="control-header">
              <span>DÄMPFUNG</span>
              <span>{animation.damping}</span>
            </div>

            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={animation.damping}
              onChange={(event) =>
                updateSetting(
                  "animation",
                  "damping",
                  Number(event.target.value)
                )
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
