
export default function AppearanceSection({
  chartType,
  appearance,
  updateSetting,
}) {
  if (chartType === "explosion") {
    return (
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          DARSTELLUNG
        </div>

        <div className="section-content">
          <div className="control">
            <div className="control-header">
              <span>GRÖSSE</span>
              <span>
                {appearance.size ?? 80}
              </span>
            </div>

            <input
              type="range"
              min="20"
              max="180"
              step="1"
              value={appearance.size ?? 80}
              onChange={(event) =>
                updateSetting(
                  "appearance",
                  "size",
                  Number(event.target.value)
                )
              }
            />
          </div>

          <div className="control">
            <div className="control-header">
              <span>AUFBLÄHUNG</span>
              <span>
                {appearance.growth ?? 100}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={appearance.growth ?? 100}
              onChange={(event) =>
                updateSetting(
                  "appearance",
                  "growth",
                  Number(event.target.value)
                )
              }
            />
          </div>

          <div className="control">
            <div className="control-header">
              <span>PARTIKEL</span>
              <span>
                {appearance.particleCount ?? 24}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="32"
              step="1"
              value={
                appearance.particleCount ?? 24
              }
              onChange={(event) =>
                updateSetting(
                  "appearance",
                  "particleCount",
                  Number(event.target.value)
                )
              }
            />
          </div>
        </div>
      </div>
    );
  }

  if (chartType === "welle") {
    return (
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          DARSTELLUNG
        </div>

        <div className="section-content">
          <div className="control">
            <div className="control-header">
              <span>WELLENHÖHE</span>
              <span>
                {appearance.waveHeight ?? 12}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={
                appearance.waveHeight ?? 12
              }
              onChange={(event) =>
                updateSetting(
                  "appearance",
                  "waveHeight",
                  Number(event.target.value)
                )
              }
            />
          </div>

          <div className="control">
            <div className="control-header">
              <span>
                WELLENGESCHWINDIGKEIT
              </span>
              <span>
                {appearance.waveSpeed ?? 50}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={
                appearance.waveSpeed ?? 50
              }
              onChange={(event) =>
                updateSetting(
                  "appearance",
                  "waveSpeed",
                  Number(event.target.value)
                )
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        DARSTELLUNG
      </div>

      <div className="section-content">
        {chartType === "donut" && (
          <>
            <div className="control">
              <div className="control-header">
                <span>GRÖSSE</span>
                <span>
                  {appearance.size}%
                </span>
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

            <div className="control">
              <div className="control-header">
                <span>ROTATION</span>
                <span>
                  {appearance.rotation ?? 0}°
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={
                  appearance.rotation ?? 0
                }
                onChange={(event) =>
                  updateSetting(
                    "appearance",
                    "rotation",
                    Number(event.target.value)
                  )
                }
              />
            </div>

            <div className="control">
              <div className="control-header">
                <span>RINGSTÄRKE</span>
                <span>
                  {appearance.thickness}%
                </span>
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
          </>
        )}

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
