export const DEFAULT_COLORS = ["#a855f7", "#71C9BE", "#D4D3DA"];

// RFC-style quoted fields, including escaped quotes and embedded newlines.
export function parseChartCsv(text, { race = false, minRows = 1, maxRows = null, minValue = 0,
  maxValue = null, maxTotal = null, integer = false } = {}) {
  const source = text.replace(/^\uFEFF/, "");
  const delimiter = source.split(/\r?\n/)[0].includes(";") ? ";" : ",";
  const records = []; let row = []; let field = ""; let quoted = false; let closed = false;
  const finish = () => { row.push(field.trim()); field = ""; closed = false; };
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === '"') {
      if (field.trim() || closed) throw new Error("Ungültige Anführungszeichen in der CSV.");
      quoted = true;
    } else if (c === delimiter) finish();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && source[i + 1] === '\n') i++;
      finish(); if (row.some(Boolean)) records.push(row); row = [];
    } else {
      if (closed && c.trim()) throw new Error("Nach einem zitierten Feld muss ein Trennzeichen folgen.");
      field += c;
    }
  }
  if (quoted) throw new Error("Ein Anführungszeichen wurde nicht geschlossen.");
  finish(); if (row.some(Boolean)) records.push(row);
  const expected = race ? ["kategorie", "wert", "zeit"] : ["kategorie", "wert"];
  if (records[0]?.map((s) => s.toLowerCase()).join(",") !== expected.join(",")) {
    throw new Error(`Die Kopfzeile muss ${expected.join(", ")} lauten.`);
  }
  const data = records.slice(1);
  if (data.length < minRows || (maxRows !== null && data.length > maxRows))
    throw new Error(`Erwartet: ${minRows} bis ${maxRows ?? "beliebig viele"} Datenzeilen.`);
  const colors = new Map(); const keys = new Set();
  const result = data.map((cells, index) => {
    const [category, raw, time] = cells;
    const value = Number(raw?.replace(",", "."));
    if (cells.length !== expected.length || !category || !raw || !Number.isFinite(value) || value < minValue ||
      (maxValue !== null && value > maxValue) || (integer && !Number.isInteger(value)))
      throw new Error(`Zeile ${index + 2}: Kategorie und gültigen ${integer ? "ganzzahligen " : ""}Wert prüfen.`);
    if (race && (!time || !Number.isFinite(Number(time)))) throw new Error(`Zeile ${index + 2}: Zeit muss eine Zahl sein, z. B. 2024.`);
    const key = JSON.stringify([category, race ? Number(time) : null]);
    if (keys.has(key)) throw new Error(`Zeile ${index + 2}: Kategorie${race ? " und Zeit" : ""} ist doppelt vorhanden.`);
    keys.add(key);
    if (!colors.has(category)) colors.set(category, DEFAULT_COLORS[colors.size % DEFAULT_COLORS.length]);
    return { id: `csv-${index}`, category, value, color: colors.get(category), visible: true,
      ...(race ? { time: Number(time) } : {}) };
  });
  if (maxTotal !== null && result.reduce((sum, r) => sum + r.value, 0) > maxTotal)
    throw new Error(`Die Summe darf höchstens ${maxTotal} betragen.`);
  if (race && new Set(result.map((r) => r.time)).size < 2) throw new Error("Bar Race benötigt mindestens zwei Zeitpunkte.");
  return result;
}
