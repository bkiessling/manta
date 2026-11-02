import { useId } from "react";

export default function SegmentedControl({ label, value, options, onChange }) {
  const name = useId();
  return <div className="segmented-control" role="radiogroup" aria-label={label}>
    {options.map((option) => <label key={option.value}
      className={`segmented-option ${value === option.value ? "is-active" : ""}`}>
      <input type="radio" name={name} value={option.value} checked={value === option.value}
        onChange={() => onChange(option.value)} />
      <span>{option.label}</span>
    </label>)}
  </div>;
}
