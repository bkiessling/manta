import NumberControl from "./NumberControl";
import SegmentedControl from "./SegmentedControl";
export default function BasicChartAppearance({ chartType, appearance, updateSetting, minimumPeople = 1, optionsOnly = false }) {
  const controls = [
    ...(chartType === "donut" ? [["thickness", "RINGSTÄRKE", 5, 80, "%"]] : []),
    ["gap", "ABSTAND", 0, 12, ""],
  ];
  return <div className="sidebar-section">
    {!optionsOnly && <h2 className="editor-section-heading">Gestaltung</h2>}
    <div className="section-content">
      {optionsOnly && chartType === "bar" && <div className="control">
        <div className="control-header">AUSRICHTUNG</div>
        <SegmentedControl label="Balkenausrichtung" value={appearance.orientation || "vertical"}
          options={[{ value: "horizontal", label: "Balken" }, { value: "vertical", label: "Säulen" }]}
          onChange={(orientation) => updateSetting("appearance", "orientation", orientation)} />
      </div>}
      {optionsOnly && chartType === "group" && <div className="grid-fields">
        <NumberControl buttons={false} label="Spalten" min={Math.max(1, Math.ceil(minimumPeople / 20))} max={20} value={appearance.gridColumns ?? 10}
          onChange={(n) => { const count = Math.round(n); updateSetting("appearance", "gridColumns", count);
            if (count * (appearance.gridRows ?? 10) < minimumPeople) updateSetting("appearance", "gridRows", Math.ceil(minimumPeople / count)); }} />
        <NumberControl buttons={false} label="Reihen" min={Math.max(1, Math.ceil(minimumPeople / 20))} max={20} value={appearance.gridRows ?? 10}
          onChange={(n) => { const count = Math.round(n); updateSetting("appearance", "gridRows", count);
            if (count * (appearance.gridColumns ?? 10) < minimumPeople) updateSetting("appearance", "gridColumns", Math.ceil(minimumPeople / count)); }} />
      </div>}
      {controls.map(([key, title, min, max, suffix]) => <label className="control" key={key}>
        <span className="control-header"><span>{title}</span><span>{appearance[key]}{suffix}</span></span>
        <input aria-label={title} type="range" min={min} max={max} step="1" value={appearance[key]}
          onChange={(event) => updateSetting("appearance", key, Number(event.target.value))} />
      </label>)}
    </div>
  </div>;
}
