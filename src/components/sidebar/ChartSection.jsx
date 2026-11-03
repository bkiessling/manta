
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
  {
    value: "welle",
    label: "Welle",
    icon: "welle",
  },
  {
    value: "explosion",
    label: "Explosion",
    icon: "explosion",
  },
  { value: "group", label: "Gruppe", icon: "group" },
  { value: "race", label: "Bar Race", icon: "race" },
];

function ChartIcon({ type }) {
  if (type === "race") return <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
    <rect className="mini-race-a" x="3" y="5" width="23" height="6" rx="1" />
    <rect className="mini-race-b" x="3" y="14" width="16" height="6" rx="1" opacity=".65" />
    <rect className="mini-race-c" x="3" y="23" width="10" height="6" rx="1" opacity=".4" />
  </svg>;
  if (type === "group") return <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
    {[7, 16, 25].map((x) => <g key={x}><circle cx={x} cy="8" r="3" />
      <rect x={x - 3} y="13" width="6" height="9" rx="2" />
      <path d={`M${x - 3} 20h2v9h-2zM${x + 1} 20h2v9h-2z`} /></g>)}
  </svg>;
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

  if (type === "welle") {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 15 C7 10 11 10 16 15
             S25 20 29 15"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M3 20 C7 15 11 15 16 20
             S25 25 29 20
             V29 H3 Z"
          fill="currentColor"
          opacity="0.75"
        />
      </svg>
    );
  }

  if (type === "explosion") {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 2 L19 11 L28 6
             L23 15 L31 19
             L21 21 L23 30
             L16 24 L9 30
             L11 21 L1 19
             L9 15 L4 6
             L13 11 Z"
          fill="currentColor"
          opacity="0.8"
        />
        <circle
          cx="16"
          cy="17"
          r="4"
          fill="currentColor"
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
          const isActive =
            chart.value === chartType;

          return (
            <button
              key={chart.value}
              type="button"
              className={`chart-type-button ${
                isActive ? "active" : ""
              }`}
              onClick={() =>
                setChartType(chart.value)
              }
              aria-pressed={isActive}
            >
              <span className={`chart-type-icon mini-chart-${chart.value}`} aria-hidden="true">
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
