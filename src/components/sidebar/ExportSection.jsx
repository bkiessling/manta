
import { useState } from "react";
import { exportMov } from "../../utils/exportMov";

export default function ExportSection({
  data,
  settings,
  chartType,
}) {
  const [isExporting, setIsExporting] =
    useState(false);

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const handleExport = async () => {
    if (isExporting || chartType !== "donut") {
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setError("");
    setFinished(false);

    try {
      await exportMov({
        data,
        settings,
        onProgress: setProgress,
      });

      setFinished(true);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ?? "Export fehlgeschlagen."
      );
    } finally {
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
            <span>TRANSPARENT</span>
          </div>
        </div>

        <div
          className="panel-note"
          style={{
            marginTop: 22,
            marginBottom: 18,
          }}
        >
          Exportiere deine Animation mit
          Alphakanal für Premiere Pro.
          Der Hintergrund der Vorschau
          wird nicht mit exportiert.
        </div>

        <button
          type="button"
          className="nav-button"
          onClick={handleExport}
          disabled={
            isExporting || chartType !== "donut"
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
              ? `EXPORTIERE ... ${progress}%`
              : "↓ MOV EXPORTIEREN"}
          </span>
        </button>

        {isExporting && (
          <progress
            value={progress}
            max={100}
            style={{
              display: "block",
              width: "100%",
              marginTop: 14,
              accentColor: "var(--accent)",
            }}
          />
        )}

        {finished && (
          <p
            role="status"
            style={{
              color: "var(--accent-bright)",
              fontSize: 12,
              marginTop: 14,
            }}
          >
            MOV-Datei erstellt.
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
