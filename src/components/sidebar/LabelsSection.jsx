import ToggleControl from "./ToggleControl";
import NumberControl from "./NumberControl";
import SegmentedControl from "./SegmentedControl";
export default function LabelsSection({ labels, chartType, updateSetting }) {
  const primaryNumber = chartType === "explosion";
  return <div className="sidebar-section">
    <div className="sidebar-section-title">BESCHRIFTUNG</div>
    <div className="section-content">
      <ToggleControl label="Kategorie" checked={Boolean(labels.showCategory)} onChange={(v) => updateSetting("labels", "showCategory", v)} />
      <ToggleControl label="Wert" checked={Boolean(labels.showValue)} onChange={(v) => updateSetting("labels", "showValue", v)} />
      {(labels.showCategory || labels.showValue) && <>
      <label className="control"><span className="control-header">FARBE</span>
        <input type="color" aria-label="Beschriftungsfarbe" value={labels.color || "#111111"}
          onChange={(event) => updateSetting("labels", "color", event.target.value)} />
      </label>
      <NumberControl label="Schriftgröße" value={labels.fontSize ?? (primaryNumber ? 80 : 12)} min={8} max={180} unit="px" onChange={(n) => updateSetting("labels", "fontSize", n)} />
      <button type="button" className="add-row" onClick={() => updateSetting("labels", "positions", {})}>
        Beschriftungen zurücksetzen
      </button>
      {<>
        <div className="control"><div className="control-header">ANORDNUNG</div>
          <SegmentedControl label="Label-Anordnung" value={labels.layout || "stacked"}
            options={[{value:"stacked",label:"Zwei Zeilen"},{value:"inline",label:"Kategorie · Wert"}]}
            onChange={(v) => updateSetting("labels", "layout", v)} />
        </div>
        <div className="control"><div className="control-header">AUSRICHTUNG</div>
          <SegmentedControl label="Label-Ausrichtung" value={labels.align || "center"}
            options={[{value:"left",label:"Links"},{value:"center",label:"Mitte"},{value:"right",label:"Rechts"}]}
            onChange={(v) => updateSetting("labels", "align", v)} />
        </div>
        {chartType === "bar" && <div className="control"><div className="control-header">LABEL-POSITION</div>
          <SegmentedControl label="Balkenlabels" value={labels.placement || "separate"}
            options={[{value:"separate",label:"Eigene Reihe"},{value:"end",label:"Am Balkenende"}]}
            onChange={(v) => updateSetting("labels", "placement", v)} />
        </div>}
      </>}
      </>}
    </div>
  </div>;
}
