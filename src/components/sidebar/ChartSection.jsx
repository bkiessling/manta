
const chartTypes = [
  {
    value: "donut",
    label: "Donut",
    icon: "donut",
  },
  {
    value: "bar",
    label: "Balken",
    icon: "bar",
  },
];

function ChartIcon({ type }) {
  if (type === "donut") {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="16"
          cy="16"
          r="11"
          stroke="currentColor"
          strokeWidth="5"
          opacity="0.25"
        />
        <path
          d="M16 5 A11 11 0 0 1 27 16"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M27 16 A11 11 0 0 1 10.5 25.5"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.65"
        />
      </svg>
    );
  }

  if (type === "bar") {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="17"
          width="6"
          height="11"
          rx="1.5"
          fill="currentColor"
          opacity="0.45"
        />
        <rect
          x="13"
          y="10"
          width="6"
          height="18"
          rx="1.5"
          fill="currentColor"
        />
        <rect
          x="22"
          y="4"
          width="6"
          height="24"
          rx="1.5"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>
    );
  }

  return null;
}

export default function ChartSection({
  chartType,
  setChartType,
}) {
  return (
    <div className="sidebar-section">
      <div
        className="chart-type-list"
        role="group"
        aria-label="Diagrammtyp auswählen"
      >
        {chartTypes.map((chart) => {
          const isActive = chart.value === chartType;

          return (
            <button
              key={chart.value}
              type="button"
              className={`chart-type-button ${
                isActive ? "active" : ""
              }`}
              onClick={() => setChartType(chart.value)}
              aria-pressed={isActive}
            >
              <span className="chart-type-icon">
                <ChartIcon type={chart.icon} />
              </span>

              <span className="chart-type-label">
                {chart.label}
              </span>

              <span
                className="chart-type-indicator"
                aria-hidden="true"
              >
                {isActive ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
