import { useEffect, useState } from "react";
export default function NumberControl({ label, value, onChange, min = 0, max = Infinity, step = 1, unit = "", buttons = true }) {
  const [draft, setDraft] = useState(String(value).replace(".", ","));
  useEffect(() => setDraft(String(value).replace(".", ",")), [value]);
  const parse = (raw) => raw.trim() && !/[,.]$/.test(raw) ? Number(raw.replace(",", ".")) : NaN;
  const bound = (n) => Math.max(min, Math.min(max, Math.round(n * 100) / 100));
  const commit = () => { const n = parse(draft); const next = Number.isFinite(n) ? bound(n) : value; onChange(next); setDraft(String(next).replace(".", ",")); };
  return <label className="control"><span className="control-header">{label}</span>
    <span className="number-control">
      {buttons && <button type="button" aria-label={`${label} verringern`} onClick={() => onChange(bound(value - step))}>−</button>}
      <input aria-label={label} inputMode="decimal" value={draft} onChange={(event) => {
        setDraft(event.target.value); const n = parse(event.target.value);
        if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
      }} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
      {unit && <span>{unit}</span>}
      {buttons && <button type="button" aria-label={`${label} erhöhen`} onClick={() => onChange(bound(value + step))}>+</button>}
    </span>
  </label>;
}
