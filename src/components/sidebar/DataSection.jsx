
export default function DataSection({
  data,
  setData,
  addRow,
  deleteRow,
  minRows = 1,
  maxRows = null,
  minValue = 0,
  maxValue = null,
  mode = "distribution",
}) {
  const isProgress = mode === "progress";

  // Fortschritt zeigt maximal eine Datenzeile.
  const effectiveMaxRows = isProgress ? 1 : maxRows;
  const effectiveMinRows = isProgress ? 1 : minRows;

  // Fortschrittswerte liegen zwischen 0 und 100.
  const effectiveMinValue = isProgress ? 0 : minValue;
  const effectiveMaxValue = isProgress ? 100 : maxValue;

  const visibleData =
    effectiveMaxRows === null
      ? data
      : data.slice(0, effectiveMaxRows);

  // Einzelnes Feld einer Datenzeile aktualisieren.
  const updateRow = (index, field, value) => {
    setData((currentData) =>
      currentData.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  // Zahlenwerte auf den erlaubten Bereich begrenzen.
  const clampValue = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return effectiveMinValue;
    }

    return Math.max(
      effectiveMinValue,
      effectiveMaxValue === null
        ? number
        : Math.min(number, effectiveMaxValue)
    );
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        DATEN
      </div>

      <div className="section-content">
        <div className="data-header">
          <span>KATEGORIE</span>
          <span>WERT</span>
          <span></span>
          <span></span>
        </div>

        <div className="data-table">
          {visibleData.map((item, index) => (
            <div
              className="data-row"
              key={index}
            >
              {/* Kategorie */}
              <input
                type="text"
                value={item.category}
                onChange={(event) =>
                  updateRow(
                    index,
                    "category",
                    event.target.value
                  )
                }
              />

              {/* Wert */}
              <input
                type="number"
                min={effectiveMinValue}
                max={effectiveMaxValue ?? undefined}
                value={item.value}
                onChange={(event) =>
                  updateRow(
                    index,
                    "value",
                    event.target.value === ""
                      ? ""
                      : Number(event.target.value)
                  )
                }
                onBlur={(event) =>
                  updateRow(
                    index,
                    "value",
                    clampValue(event.target.value)
                  )
                }
              />

              {/* Farbe */}
              <input
                className="data-color"
                type="color"
                value={item.color}
                onChange={(event) =>
                  updateRow(
                    index,
                    "color",
                    event.target.value
                  )
                }
              />

              {/* Löschen nur bei Verteilung */}
              {!isProgress &&
              visibleData.length > effectiveMinRows ? (
                <button
                  type="button"
                  className="delete-row"
                  onClick={() => deleteRow(index)}
                  aria-label="Zeile löschen"
                >
                  ×
                </button>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>

        {/* Weitere Zeilen nur bei Verteilung */}
        {!isProgress &&
          (effectiveMaxRows === null ||
            data.length < effectiveMaxRows) && (
            <button
              type="button"
              className="add-row"
              onClick={addRow}
            >
              + ZEILE HINZUFÜGEN
            </button>
          )}
      </div>
    </div>
  );
}
