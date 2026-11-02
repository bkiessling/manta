export default function ToggleControl({ label, checked, onChange, disabled = false }) {
  return <label className="toggle-control"><span>{label}</span>
    <span className="toggle-track"><input type="checkbox" role="switch" aria-label={label}
      checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="toggle-thumb"/><span className="toggle-value">{checked ? "Ja" : "Nein"}</span>
    </span>
  </label>;
}
