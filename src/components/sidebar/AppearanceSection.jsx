
export default function AppearanceSection({
  chartType,
  appearance,
  updateSetting,
}) {
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        DARSTELLUNG
      </div>

      <div className="section-content">
        {/* Donut size */}
        {chartType === "donut" && (
          <div className="control">
            <div className="control-header">
              <span>GRÖSSE</span>
              <span>{appearance.size}%</span>
            </div>

            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={appearance.size}
              onChange={(event) =>
                updateSetting(
                  "appearance",
                  "size",
                  Number(event.target.value)
                )
              }
            />
          </div>
        )}

        {/* Donut ring thickness */}
        {chartType === "donut" && (
          <div className="control">
            <div className="control-header">
              <span>RINGSTÄRKE</span>
              <span>{appearance.thickness}%</span>
            </div>

            <input
              type="range"
              min="5"
              max="80"
              step="1"
              value={appearance.thickness}
              onChange={(event) =>
                updateSetting(
                  "appearance",
                  "thickness",
                  Number(event.target.value)
                )
              }
            />
          </div>
        )}

        {/* Space between chart segments */}
        <div className="control">
          <div className="control-header">
            <span>ABSTAND</span>
            <span>{appearance.gap}</span>
          </div>

          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={appearance.gap}
            onChange={(event) =>
              updateSetting(
                "appearance",
                "gap",
                Number(event.target.value)
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
