
import { useEffect, useRef, useState } from "react";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function normalizeHex(value) {
  const trimmed = value.trim();

  const withHash = trimmed.startsWith("#")
    ? trimmed
    : `#${trimmed}`;

  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash;

    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  if (HEX_COLOR_PATTERN.test(withHash)) {
    return withHash.toUpperCase();
  }

  return null;
}

function ColorEditor({
  color,
  category,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(color);
  const containerRef = useRef(null);

  const validColor = normalizeHex(color) ?? "#A855F7";

  useEffect(() => {
    setDraft(validColor);
  }, [validColor]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen]);

  const updateDraft = (value) => {
    setDraft(value);

    const normalized = normalizeHex(value);

    if (normalized) {
      onChange(normalized);
    }
  };

  const commitDraft = () => {
    const normalized = normalizeHex(draft);

    if (normalized) {
      onChange(normalized);
      setDraft(normalized);
    } else {
      setDraft(validColor);
    }
  };

  return (
    <div
      className="data-color-editor"
      ref={containerRef}
    >
      <button
        type="button"
        className="data-color-trigger"
        style={{ backgroundColor: validColor }}
        aria-label={`Farbe für ${category} bearbeiten`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={validColor}
        onClick={() =>
          setIsOpen((current) => !current)
        }
      />

      {isOpen && (
        <div
          className="data-color-popover"
          role="dialog"
          aria-label={`Farbe für ${category}`}
        >
          <div className="data-color-popover-title">
            FARBE
          </div>

          <div className="data-color-popover-content">
            <input
              className="data-color-picker"
              type="color"
              value={validColor}
              aria-label="Farbe auswählen"
              onChange={(event) => {
                const nextColor =
                  event.target.value.toUpperCase();

                setDraft(nextColor);
                onChange(nextColor);
              }}
            />

            <input
              className="data-color-hex"
              type="text"
              value={draft}
              maxLength={7}
              spellCheck={false}
              aria-label="HEX-Farbwert"
              placeholder="#A855F7"
              onChange={(event) =>
                updateDraft(event.target.value)
              }
              onBlur={commitDraft}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitDraft();
                  setIsOpen(false);
                }
              }}
            />
          </div>

          <div className="data-color-popover-hint">
            HEX · z. B. #A855F7
          </div>
        </div>
      )}
    </div>
  );
}

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
  maxTotal = null,
  integer = false,
}) {
  const isProgress = mode === "progress";

  const effectiveMaxRows = isProgress ? 1 : maxRows;
  const effectiveMinRows = isProgress ? 1 : minRows;

  const effectiveMinValue = isProgress ? 0 : minValue;
  const effectiveMaxValue = isProgress ? 100 : maxValue;

  const visibleData =
    effectiveMaxRows === null
      ? data
      : data.slice(0, effectiveMaxRows);

  const updateRow = (index, field, value) => {
    setData((currentData) =>
      currentData.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const toggleVisibility = (index) => {
    setData((currentData) =>
      currentData.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              visible: item.visible === false,
            }
          : item
      )
    );
  };

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
        <div
          className={`data-header ${
            !isProgress
              ? "data-header-with-visibility"
              : ""
          }`}
        >
          <span>KATEGORIE</span>
          <span>WERT</span>
          <span />
          {!isProgress && <span />}
          <span />
        </div>

        <div className="data-table">
          {visibleData.map((item, index) => {
            const isVisible = item.visible !== false;
            const rowMax = maxTotal === null ? effectiveMaxValue : Math.max(0,
              maxTotal - data.reduce((sum, row, i) => sum + (i === index ? 0 : Number(row.value) || 0), 0));
            const normalize = (raw) => {
              const n = integer ? Math.round(clampValue(raw)) : clampValue(raw);
              return rowMax === null ? n : Math.min(n, rowMax);
            };

            return (
              <div
                className={`data-row ${
                  !isProgress
                    ? "data-row-with-visibility"
                    : ""
                } ${
                  !isVisible
                    ? "data-row-hidden"
                    : ""
                }`}
                key={item.id ?? index}
              >
                <input
                  type="text"
                  value={item.category}
                  aria-label={`Kategorie ${index + 1}`}
                  onChange={(event) =>
                    updateRow(
                      index,
                      "category",
                      event.target.value
                    )
                  }
                />

                <input
                  type="number"
                  min={effectiveMinValue}
                  max={
                    rowMax ?? undefined
                  }
                  step={integer ? 1 : "any"}
                  value={item.value}
                  aria-label={`Wert für ${
                    item.category ||
                    `Kategorie ${index + 1}`
                  }`}
                  onChange={(event) =>
                    updateRow(
                      index,
                      "value",
                      event.target.value === ""
                        ? ""
                        : maxTotal === null ? Number(event.target.value) : normalize(event.target.value)
                    )
                  }
                  onBlur={(event) =>
                    updateRow(
                      index,
                      "value",
                      normalize(event.target.value)
                    )
                  }
                />

                <ColorEditor
                  color={item.color}
                  category={
                    item.category ||
                    `Kategorie ${index + 1}`
                  }
                  onChange={(value) =>
                    updateRow(
                      index,
                      "color",
                      value
                    )
                  }
                />

                {!isProgress && (
                  <button
                    type="button"
                    className={`visibility-button ${
                      isVisible
                        ? "is-visible"
                        : "is-hidden"
                    }`}
                    onClick={() =>
                      toggleVisibility(index)
                    }
                    aria-label={
                      isVisible
                        ? `${item.category} ausblenden`
                        : `${item.category} einblenden`
                    }
                    aria-pressed={!isVisible}
                    title={
                      isVisible
                        ? "Kategorie ausblenden"
                        : "Kategorie einblenden"
                    }
                  >
                    {isVisible ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M10.6 6.1A11.7 11.7 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.1 3.5" />
                        <path d="M6.3 6.3C3.5 8 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.2-1" />
                        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                        <path d="M3 3l18 18" />
                      </svg>
                    )}
                  </button>
                )}

                {!isProgress &&
                visibleData.length > effectiveMinRows ? (
                  <button
                    type="button"
                    className="delete-row"
                    onClick={() =>
                      deleteRow(index)
                    }
                    aria-label={`${item.category} löschen`}
                    title="Kategorie löschen"
                  >
                    ×
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })}
        </div>

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
