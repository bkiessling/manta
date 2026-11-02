import NumberControl from "./NumberControl";
import SegmentedControl from "./SegmentedControl";
export default function BasicChartAppearance({ chartType, appearance, updateSetting, minimumPeople = 1 }) {
  const controls = [
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
      {chartType === "group" && <>
        <NumberControl label="Spalten" min={Math.max(1, Math.ceil(minimumPeople / 20))} max={20} value={appearance.gridColumns ?? 10}
          onChange={(n) => { const count = Math.round(n); updateSetting("appearance", "gridColumns", count);
            if (count * (appearance.gridRows ?? 10) < minimumPeople) updateSetting("appearance", "gridRows", Math.ceil(minimumPeople / count)); }} />
        <NumberControl label="Reihen" min={Math.max(1, Math.ceil(minimumPeople / 20))} max={20} value={appearance.gridRows ?? 10}
          onChange={(n) => { const count = Math.round(n); updateSetting("appearance", "gridRows", count);
            if (count * (appearance.gridColumns ?? 10) < minimumPeople) updateSetting("appearance", "gridColumns", Math.ceil(minimumPeople / count)); }} />
      </>}
      {controls.map(([key, title, min, max, suffix]) => <label className="control" key={key}>
        <span className="control-header"><span>{title}</span><span>{appearance[key]}{suffix}</span></span>
        <input aria-label={title} type="range" min={min} max={max} step="1" value={appearance[key]}
          onChange={(event) => updateSetting("appearance", key, Number(event.target.value))} />
      </label>)}
    </div>
  </div>;
}
