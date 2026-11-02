import { useEffect, useState } from "react";

function FontSize({ size, onChange }) {
  const [draft, setDraft] = useState(String(size));
  useEffect(() => setDraft(String(size)), [size]);
  const commit = () => {
    const n = Math.max(8, Math.min(180, Math.round(Number(draft) || size)));
    setDraft(String(n)); onChange(n);
  };
  return <label className="control">
    <span className="control-header">SCHRIFTGRÖSSE</span>
    <span className="font-size-input"><input type="number" aria-label="Schriftgröße"
      min="8" max="180" step="1" value={draft}
      onChange={(event) => {
        const raw = event.target.value; setDraft(raw);
        const n = Number(raw);
        if (raw && Number.isInteger(n) && n >= 8 && n <= 180) onChange(n);
      }} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") { commit(); event.currentTarget.blur(); } }} />
      <span>px</span></span>
  </label>;
}

export default function LabelsSection({ labels, chartType, updateSetting }) {
  const primaryNumber = chartType === "explosion";
  return <div className="sidebar-section">
    <div className="sidebar-section-title">BESCHRIFTUNG</div>
    <div className="section-content">
      <FontSize size={labels.fontSize ?? (primaryNumber ? 80 : 12)}
        onChange={(size) => updateSetting("labels", "fontSize", size)} />
      <p className="panel-note">{primaryNumber ? "Die Zahl" : "Beschriftungen"} direkt in der Vorschau ziehen oder per Pfeiltasten verschieben. Positionen gelten auch für den Export.</p>
      <button type="button" className="add-row" onClick={() => updateSetting("labels", "positions", {})}>
        Beschriftungen zurücksetzen
      </button>
      {!primaryNumber && <>
        <label className="control"><span className="control-header">TEXTFARBE</span>
          <input type="color" aria-label="Beschriftungsfarbe" value={labels.color || "#111111"}
            onChange={(event) => updateSetting("labels", "color", event.target.value)} />
        </label>
        <label className="checkbox-control"><span>KATEGORIE ANZEIGEN</span>
          <input type="checkbox" checked={labels.showCategory} onChange={(event) => updateSetting("labels", "showCategory", event.target.checked)} />
        </label>
        <label className="checkbox-control"><span>WERTE ANZEIGEN</span>
          <input type="checkbox" checked={labels.showValue} onChange={(event) => updateSetting("labels", "showValue", event.target.checked)} />
        </label>
      </>}
    </div>
  </div>;
}
