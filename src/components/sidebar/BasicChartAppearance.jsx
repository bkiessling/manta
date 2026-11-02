import SegmentedControl from "./SegmentedControl";
export default function BasicChartAppearance({ chartType, appearance, updateSetting, minimumPeople = 1 }) {
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
      {chartType === "bar" && <div className="control">
        <div className="control-header">AUSRICHTUNG</div>
        <SegmentedControl label="Balkenausrichtung" value={appearance.orientation || "vertical"}
          options={[{ value: "horizontal", label: "Balken" }, { value: "vertical", label: "Säulen" }]}
          onChange={(orientation) => updateSetting("appearance", "orientation", orientation)} />
      </div>}
      {chartType === "group" && <label className="control">
        <span className="control-header"><span>ANZAHL PERSONEN</span><span>{appearance.peopleCount}</span></span>
        <input type="number" aria-label="Anzahl Personen" min={minimumPeople} max="100" step="1"
          value={appearance.peopleCount}
          onChange={(event) => updateSetting("appearance", "peopleCount",
            Math.max(minimumPeople, Math.min(100, Math.round(Number(event.target.value) || 1))))} />
        <span className="panel-note">Bis zu 100 Personen. Die Datenwerte bestimmen, wie viele erscheinen; freie Plätze bleiben leer. Für ein kleineres Maximum zuerst die Datenwerte reduzieren.</span>
      </label>}
      {controls.map(([key, title, min, max, suffix]) => <label className="control" key={key}>
        <span className="control-header"><span>{title}</span><span>{appearance[key]}{suffix}</span></span>
        <input aria-label={title} type="range" min={min} max={max} step="1" value={appearance[key]}
          onChange={(event) => updateSetting("appearance", key, Number(event.target.value))} />
      </label>)}
    </div>
  </div>;
}
