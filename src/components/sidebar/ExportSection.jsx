
import { useEffect, useRef, useState } from "react";
import { exportMov } from "../../utils/exportMov";

const PHASES = {
  preparing: "Export vorbereiten",
  rendering: "Bilder vorbereiten und übertragen",
  uploading: "Bilder vorbereiten und übertragen",
  encoding: "Video erstellen",
  downloading: "Download starten",
  finished: "Download gestartet",
};

export default function ExportSection({
  data,
  settings,
  chartType,
  updateSetting,
}) {
  const [isExporting, setIsExporting] =
    useState(false);

  const [progress, setProgress] = useState({ phase: "preparing", percent: 0 });
  const controllerRef = useRef(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => () => controllerRef.current?.abort(), []);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const handleExport = async () => {
    if (controllerRef.current) {
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setIsExporting(true);
    setCancelled(false);
    setProgress({ phase: "preparing", percent: 0 });
    setError("");
    setFinished(false);

    try {
      await exportMov({
        data,
        settings,
        chartType,
        onProgress: setProgress,
        signal: controller.signal,
      });

      setFinished(true);
    } catch (err) {
      if (controller.signal.aborted || err?.name === "AbortError") {
        setCancelled(true);
      } else setError(
        err?.message ?? "Export fehlgeschlagen."
      );
    } finally {
      controllerRef.current = null;
      setIsExporting(false);
    }
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        VIDEOEXPORT
      </div>

      <div className="section-content">
        <div className="control">
          <div className="control-header">
            <span>FORMAT</span>
            <span>MOV · PRORES 4444</span>
          </div>
        </div>

        <div className="control">
          <div className="control-header">
            <span>AUFLÖSUNG</span>
            <span>1080 × 1920</span>
          </div>
        </div>

        <div className="control">
          <div className="control-header">
            <span>BILDRATE</span>
            <span>30 FPS</span>
          </div>
        </div>

        <div className="control">
          <div className="control-header">
            <span>HINTERGRUND</span>
            <span>{settings.output?.transparent !== false ? "TRANSPARENT" : settings.output.backgroundColor}</span>
          </div>
        </div>

        <label className="checkbox-control">
          <span>TRANSPARENTER HINTERGRUND</span>
          <input type="checkbox" checked={settings.output?.transparent !== false} disabled={isExporting}
            onChange={(event) => updateSetting("output", "transparent", event.target.checked)} />
        </label>
        {settings.output?.transparent === false && <label className="control">
          <span className="control-header">HINTERGRUNDFARBE</span>
          <input type="color" aria-label="Export-Hintergrundfarbe" disabled={isExporting}
            value={settings.output.backgroundColor || "#f5f5f3"}
            onChange={(event) => updateSetting("output", "backgroundColor", event.target.value)} />
        </label>}

        <div
          className="panel-note"
          style={{
            marginTop: 22,
            marginBottom: 18,
          }}
        >
          Exportiere deine Animation für Premiere Pro.
          Transparenz oder gewählte Hintergrundfarbe sowie verschobene Beschriftungen
          werden wie in der Vorschau übernommen.
        </div>

        <button
          type="button"
          className="nav-button"
          onClick={handleExport}
          disabled={
            isExporting
          }
          style={{
            width: "100%",
            minHeight: 44,
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
            cursor: isExporting
              ? "wait"
              : "pointer",
            opacity: isExporting ? 0.7 : 1,
          }}
        >
          <span>
            {isExporting
              ? `EXPORTIERE ... ${progress.percent}%`
              : "↓ MOV EXPORTIEREN"}
          </span>
        </button>

        {isExporting && (
          <progress
            value={progress.percent}
            max={100}
            style={{
              display: "block",
              width: "100%",
              marginTop: 14,
              accentColor: "var(--accent)",
            }}
          />
        )}

        {isExporting && (
          <>
            <p role="status" aria-live="polite" style={{ fontSize: 12, marginTop: 12 }}>
              {PHASES[progress.phase]} · {progress.percent}%
              {progress.detail && <span style={{ display: "block" }}>{progress.detail}</span>}
            </p>
            <button type="button" className="add-row" onClick={() => controllerRef.current?.abort()}>
              Export abbrechen
            </button>
          </>
        )}

        {cancelled && <p role="status" style={{ fontSize: 12, marginTop: 14 }}>Export abgebrochen.</p>}

        {finished && (
          <p
            role="status"
            style={{
              color: "var(--accent-bright)",
              fontSize: 12,
              marginTop: 14,
            }}
          >
            Video erstellt. Der Download wurde gestartet.
          </p>
        )}

        {error && (
          <p
            role="alert"
            style={{
              color: "#ff8585",
              fontSize: 12,
              lineHeight: 1.6,
              marginTop: 14,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
