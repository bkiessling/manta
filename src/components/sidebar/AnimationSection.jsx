import SegmentedControl from "./SegmentedControl";

import {
  useEffect,
  useRef,
  useState,
} from "react";

const animationLabels = {
  linear: "Linear",
  easeOut: "Sanft",
  easeInOut: "Sanft (In & Out)",
  spring: "Federnd",
};

export default function AnimationSection({
  animation,
  animationOptions,
  updateSetting,
  visibleCategoryCount = 0,
  chartType,
}) {
  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef({});

  const isExplosion = chartType === "explosion";

  const springAvailable =
    chartType !== "donut" || visibleCategoryCount === 1;

  const isSpringAnimation =
    !isExplosion &&
    animation.style === "spring" &&
    springAvailable;

  const availableStyles = (
    animationOptions?.styles ?? []
  ).filter((style) => style !== "bounce");

  const selectedStyle =
    animation.style === "spring" &&
    !springAvailable
      ? "easeOut"
      : animation.style;

  const enabledStyles = availableStyles.filter(
    (style) =>
      style !== "spring" || springAvailable
  );

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (dropdownOpen) {
      optionRefs.current[selectedStyle]?.focus();
    }
  }, [dropdownOpen, selectedStyle]);

  const selectAnimation = (style) => {
    if (
      style === "spring" &&
      !springAvailable
    ) {
      return;
    }

    updateSetting("animation", "style", style);
    setDropdownOpen(false);
    triggerRef.current?.focus();
  };

  const handleOptionKeyDown = (
    event,
    currentStyle
  ) => {
    const currentIndex =
      enabledStyles.indexOf(currentStyle);

    if (event.key === "ArrowDown") {
      event.preventDefault();

      optionRefs.current[
        enabledStyles[
          (currentIndex + 1) %
            enabledStyles.length
        ]
      ]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      optionRefs.current[
        enabledStyles[
          (currentIndex -
            1 +
            enabledStyles.length) %
            enabledStyles.length
        ]
      ]?.focus();
    }

    if (event.key === "Home") {
      event.preventDefault();

      optionRefs.current[
        enabledStyles[0]
      ]?.focus();
    }

    if (event.key === "End") {
      event.preventDefault();

      optionRefs.current[
        enabledStyles[
          enabledStyles.length - 1
        ]
      ]?.focus();
    }

    if (event.key === "Tab") {
      setDropdownOpen(false);
    }
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        ANIMATION
      </div>

      <div className="section-content">
        {chartType === "group" && <>
          <div className="control"><div className="control-header">PERSONEN EINBLENDEN</div>
            <SegmentedControl label="Personen einblenden" value={animation.groupMode || "individual"}
              options={[{ value: "individual", label: "Einzeln" }, { value: "category", label: "Je Kategorie" }]}
              onChange={(mode) => updateSetting("animation", "groupMode", mode)} />
          </div>
          <label className="checkbox-control"><span>ZUM ABSCHLUSS PULSIEREN</span>
            <input type="checkbox" checked={Boolean(animation.pulse)}
              onChange={(event) => updateSetting("animation", "pulse", event.target.checked)} />
          </label>
        </>}
        {!isExplosion && (
          <div className="control">
            <div className="control-header">
              <span>BEWEGUNG</span>
            </div>

            <div
              className={`animation-dropdown ${
                dropdownOpen ? "is-open" : ""
              }`}
              ref={dropdownRef}
            >
              <button
                ref={triggerRef}
                type="button"
                className="animation-dropdown-trigger"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                onClick={() =>
                  setDropdownOpen((open) => !open)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "ArrowDown" ||
                    event.key === "ArrowUp"
                  ) {
                    event.preventDefault();
                    setDropdownOpen(true);
                  }
                }}
              >
                <span>
                  {animationLabels[selectedStyle] ??
                    selectedStyle}
                </span>

                <svg
                  className="animation-dropdown-chevron"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {dropdownOpen && (
                <div
                  className="animation-dropdown-menu"
                  role="listbox"
                  aria-label="Bewegung auswählen"
                >
                  {availableStyles.map((style) => {
                    const disabled =
                      style === "spring" &&
                      !springAvailable;

                    const selected =
                      style === selectedStyle;

                    return (
                      <button
                        key={style}
                        ref={(element) => {
                          optionRefs.current[style] =
                            element;
                        }}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        aria-disabled={disabled}
                        disabled={disabled}
                        tabIndex={
                          selected ? 0 : -1
                        }
                        className={[
                          "animation-dropdown-option",
                          selected
                            ? "is-selected"
                            : "",
                          disabled
                            ? "is-disabled"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() =>
                          selectAnimation(style)
                        }
                        onKeyDown={(event) =>
                          handleOptionKeyDown(
                            event,
                            style
                          )
                        }
                      >
                        <span>
                          {animationLabels[style] ??
                            style}
                        </span>

                        {selected && (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {!isSpringAnimation && (
          <div className="control">
            <div className="control-header">
              <span>DAUER</span>
              <span>
                {Number(
                  animation.duration ?? 2
                ).toFixed(1)}{" "}
                s
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={animation.duration ?? 2}
              onChange={(event) =>
                updateSetting(
                  "animation",
                  "duration",
                  Number(event.target.value)
                )
              }
            />
          </div>
        )}

        {isSpringAnimation && (
          <>
            <div className="control">
              <div className="control-header">
                <span>GESCHWINDIGKEIT</span>
                <span>
                  {animation.speed ?? 50} %
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={animation.speed ?? 50}
                onChange={(event) =>
                  updateSetting(
                    "animation",
                    "speed",
                    Number(event.target.value)
                  )
                }
              />
            </div>

            <div className="control">
              <div className="control-header">
                <span>FEDERUNG</span>
                <span>
                  {animation.bounce ?? 35} %
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={animation.bounce ?? 35}
                onChange={(event) =>
                  updateSetting(
                    "animation",
                    "bounce",
                    Number(event.target.value)
                  )
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
