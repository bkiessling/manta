export default function AppearanceSection({ chartType, appearance, updateSetting, minimumPeople = 1 }) {
  const controls = [
    ["size", "GRÖSSE", 20, 100, "%"],
    ["positionX", "POSITION X", -50, 150, "%"],
    ["positionY", "POSITION Y", -50, 150, "%"],
    ...(chartType === "donut" ? [["thickness", "RINGSTÄRKE", 5, 80, "%"]] : []),
    ["gap", "ABSTAND", 0, 12, ""],
  ];
  return <div className="sidebar-section">
    <div className="sidebar-section-title">DARSTELLUNG</div>
    <div className="section-content">
      {chartType === "group" && <label className="control">
        <span className="control-header"><span>ANZAHL PERSONEN</span><span>{appearance.peopleCount}</span></span>
        <input type="number" aria-label="Anzahl Personen" min={minimumPeople} max="100" step="1"
          value={appearance.peopleCount}
          onChange={(event) => updateSetting("appearance", "peopleCount",
            Math.max(minimumPeople, Math.min(100, Math.round(Number(event.target.value) || 1))))} />
        <span className="panel-note">1–100 Personen. Für weniger Personen zuerst die zugeordneten Werte reduzieren.</span>
      </label>}
      {controls.map(([key, title, min, max, suffix]) => <label className="control" key={key}>
        <span className="control-header"><span>{title}</span><span>{appearance[key]}{suffix}</span></span>
        <input aria-label={title} type="range" min={min} max={max} step="1" value={appearance[key]}
          onChange={(event) => updateSetting("appearance", key, Number(event.target.value))} />
      </label>)}
    </div>
  </div>;
}
