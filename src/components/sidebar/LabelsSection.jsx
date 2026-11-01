// Sidebar controls for chart labels.
export default function LabelsSection({
    labels,
    updateSetting,
  }) {
    return (
      <div className="sidebar-section">
        {/* Section title */}
        <div className="sidebar-section-title">
          BESCHRIFTUNG
        </div>
  
        {/* Label controls */}
        <div className="section-content">
  
          <p className="panel-note">Beschriftungen direkt in der Vorschau ziehen oder per Pfeiltasten verschieben. Positionen gelten auch für den Export.</p>
          <button type="button" className="add-row" onClick={() => updateSetting("labels", "positions", {})}>
            Beschriftungen zurücksetzen
          </button>
          <label className="control">
            <span className="control-header">TEXTFARBE</span>
            <input type="color" aria-label="Beschriftungsfarbe" value={labels.color || "#111111"}
              onChange={(event) => updateSetting("labels", "color", event.target.value)} />
          </label>
          {/* Category visibility */}
          <label className="checkbox-control">
            <span>KATEGORIE ANZEIGEN</span>
  
            <input
              type="checkbox"
              checked={labels.showCategory}
              onChange={(event) =>
                updateSetting(
                  "labels",
                  "showCategory",
                  event.target.checked
                )
              }
            />
          </label>
  
          {/* Value visibility */}
          <label className="checkbox-control">
            <span>WERTE ANZEIGEN</span>
  
            <input
              type="checkbox"
              checked={labels.showValue}
              onChange={(event) =>
                updateSetting(
                  "labels",
                  "showValue",
                  event.target.checked
                )
              }
            />
          </label>
  
          {/* Label font size */}
          <div className="control label-control">
            <div className="control-header">
              <span>GRÖSSE</span>
              <span>{labels.fontSize}</span>
            </div>
  
            <input
              type="range"
              min="8"
              max="32"
              step="1"
              value={labels.fontSize}
              onChange={(event) =>
                updateSetting(
                  "labels",
                  "fontSize",
                  Number(event.target.value)
                )
              }
            />
          </div>
  
          {/* Distance from chart */}
          <div className="control">
            <div className="control-header">
              <span>POSITION</span>
              <span>{labels.distance}</span>
            </div>
  
            <input
              type="range"
              min="-40"
              max="80"
              step="1"
              value={labels.distance}
              onChange={(event) =>
                updateSetting(
                  "labels",
                  "distance",
                  Number(event.target.value)
                )
              }
            />
          </div>
  
        </div>
      </div>
    );
  }