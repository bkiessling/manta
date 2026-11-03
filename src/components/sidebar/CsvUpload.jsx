import { useState } from "react";
import { parseChartCsv } from "../../utils/csv.js";
export default function CsvUpload({ onImport, race, ...limits }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  return <div className="csv-upload">
    <label className="control-header" htmlFor="csv-upload">CSV IMPORTIEREN</label>
    <p>Spalten: Kategorie, Wert{race ? ", Zeit (z. B. Jahr)" : ""}. Komma oder Semikolon als Trennzeichen.</p>
    <pre>{race ? "kategorie,wert,zeit\nZustimmung,40,2020\nAblehnung,30,2020\nZustimmung,50,2021\nAblehnung,60,2021" : "kategorie,wert\nZustimmung,40\nAblehnung,30"}</pre>
    <input id="csv-upload" type="file" accept=".csv,text/csv" onChange={async (event) => {
      const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
      try {
        if (file.size > 1024 * 1024) throw new Error("Die CSV darf höchstens 1 MiB groß sein.");
        const rows = parseChartCsv(await file.text(), { race, ...limits });
        onImport(rows); setError(false); setMessage(`${rows.length} Zeilen geprüft und übernommen.`);
      } catch (e) { setError(true); setMessage(e.message); }
    }} />
    <p role={error ? "alert" : "status"}>{message}</p>
    <small>Gültige Daten ersetzen die aktuelle Tabelle. Fehlerhafte Dateien ändern nichts.</small>
  </div>;
}
