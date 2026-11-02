import SegmentedControl from "./SegmentedControl";
export default function ToggleControl({ label, checked, onChange, disabled = false }) {
  return <div className="control"><div className="control-header">{label}</div>
    <fieldset className="boolean-buttons" disabled={disabled}>
      <SegmentedControl label={label} value={checked ? "yes" : "no"}
        options={[{ value: "yes", label: "Ja" }, { value: "no", label: "Nein" }]}
        onChange={(value) => onChange(value === "yes")} />
    </fieldset>
  </div>;
}
