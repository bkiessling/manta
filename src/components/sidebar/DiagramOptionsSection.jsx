const diagramModes = [
    {
      value: "distribution",
      label: "Verteilung",
    },
    {
      value: "progress",
      label: "Fortschritt",
    },
  ];
  
  export default function DiagramOptionsSection({
    diagramMode,
    setDiagramMode,
  }) {
    return (
      <div className="diagram-options">
        <div className="sidebar-section-title">
          DARSTELLUNG
        </div>
  
        <div
          className="diagram-mode-switch"
          role="group"
          aria-label="Donut-Darstellung"
        >
          {diagramModes.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`diagram-mode-button ${
                diagramMode === item.value
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setDiagramMode(item.value)
              }
              aria-pressed={
                diagramMode === item.value
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  