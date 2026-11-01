
import { useState } from "react";

import { chartData } from "./data/chartData";
import { chartPresets } from "./data/chartPresets";

import ChartPreview from "./components/preview/ChartPreview";

import DataSection from "./components/sidebar/DataSection";
import ChartSection from "./components/sidebar/ChartSection";
import DiagramOptionsSection from "./components/sidebar/DiagramOptionsSection";
import LabelsSection from "./components/sidebar/LabelsSection";
import AppearanceSection from "./components/sidebar/AppearanceSection";
import AnimationSection from "./components/sidebar/AnimationSection";
import ExportSection from "./components/sidebar/ExportSection";

import OnboardingPreview from "./components/onboarding/OnboardingPreview";
import DraggableChart from "./components/preview/DraggableChart";

import mantaRay from "./assets/manta_ray.svg";

import "./App.css";

const MODES = [
  { id: "diagram", label: "Diagramm", number: "01" },
  { id: "data", label: "Daten", number: "02" },
  { id: "editor", label: "Editor", number: "03" },
  { id: "export", label: "Export", number: "04" },
];

export default function App() {
  const [mode, setMode] = useState("diagram");

  const [onboardingStep, setOnboardingStep] =
    useState("diagram");

  const [replay, setReplay] = useState(0);
  const [playAnimation, setPlayAnimation] =
    useState(false);

  const [chartType, setChartType] = useState("donut");

  const [chartDatasets, setChartDatasets] =
    useState(() => Object.fromEntries(["donut", "bar", "group"].map((type) => [type,
      (type === "group" ? chartData.slice(0, 2).map((item, index) => ({ ...item, value: index ? 25 : 50 })) : chartData)
        .map((item, index) => ({ ...item, id: `${type}-${index}` })),
    ])));

  const [progressData, setProgressData] = useState([
    {
      id: "progress",
      category: "Fortschritt",
      value: 75,
      color: "#a855f7",
    },
  ]);

  const [chartSettings, setChartSettings] =
    useState(() =>
      Object.fromEntries(
        Object.entries(chartPresets).map(
          ([type, preset]) => [
            type,
            structuredClone(preset.defaults),
          ]
        )
      )
    );

  const preset = chartPresets[chartType];
  const settings = chartSettings[chartType];

  const diagramMode =
    settings?.diagram?.mode ?? "distribution";

  const isProgress =
    chartType === "donut" &&
    diagramMode === "progress";

  const data = isProgress
    ? progressData
    : chartDatasets[chartType] ?? [];

  const setData = (value) => {
    if (isProgress) {
      setProgressData((current) =>
        typeof value === "function"
          ? value(current)
          : value
      );

      return;
    }

    setChartDatasets((current) => ({
      ...current,
      [chartType]:
        typeof value === "function"
          ? value(current[chartType] ?? [])
          : value,
    }));
  };

  const addRow = () => {
    if (isProgress) return;

    setData((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        category: "Neue Kategorie",
        value: chartType === "group" ? Math.min(10, Math.max(0,
          settings.appearance.peopleCount - current.reduce((sum, row) => sum + Number(row.value || 0), 0))) : 10,
        color: "#a855f7",
      },
    ]);
  };

  const deleteRow = (indexToDelete) => {
    if (isProgress) return;

    setData((current) =>
      current.filter(
        (_, index) => index !== indexToDelete
      )
    );
  };

  const activeMode = MODES.find(
    (item) => item.id === mode
  );

  const updateSetting = (group, key, value) => {
    if (!settings) return;

    setChartSettings((current) => ({
      ...current,
      [chartType]: {
        ...current[chartType],
        [group]: {
          ...current[chartType][group],
          [key]: value,
        },
      },
    }));
  };

  const updateChartPosition = (x, y) => {
    setChartSettings((current) => ({
      ...current,
      [chartType]: {
        ...current[chartType],
        appearance: {
          ...current[chartType].appearance,
          positionX: x,
          positionY: y,
        },
      },
    }));
  };

  const moveLabel = (id, position) => {
    setChartSettings((current) => ({
      ...current,
      [chartType]: {
        ...current[chartType],
        labels: {
          ...current[chartType].labels,
          positions: { ...current[chartType].labels.positions, [id]: position },
        },
      },
    }));
  };

  const setDiagramMode = (value) => {
    setPlayAnimation(false);
    updateSetting("diagram", "mode", value);
  };

  const changeChartType = (value) => {
    setPlayAnimation(false);
    setChartType(value);
  };

  const changeMode = (value) => {
    setMode(value);

    if (onboardingStep === "complete") {
      return;
    }

    if (value === "editor" || value === "export") {
      setOnboardingStep("complete");
      setPlayAnimation(true);
      setReplay((current) => current + 1);
    } else {
      setOnboardingStep(value);
    }
  };

  const nextOnboardingStep = () => {
    if (onboardingStep === "diagram") {
      changeMode("data");
    } else if (onboardingStep === "data") {
      changeMode("editor");
    }
  };

  const replayAnimation = () => {
    if (onboardingStep !== "complete") {
      return;
    }

    setPlayAnimation(true);
    setReplay((current) => current + 1);
  };

  const dataEditor = preset ? (
    <DataSection
      data={data}
      setData={setData}
      addRow={addRow}
      deleteRow={deleteRow}
      mode={
        isProgress
          ? "progress"
          : "distribution"
      }
      minRows={1}
      maxTotal={chartType === "group" ? settings.appearance.peopleCount : null}
      integer={chartType === "group"}
      maxRows={
        isProgress
          ? 1
          : preset.data?.maxRows ?? null
      }
      minValue={0}
      maxValue={
        isProgress
          ? 100
          : preset.data?.maxValue ?? null
      }
    />
  ) : null;

  const showOnboarding =
    onboardingStep !== "complete";

  return (
    <main className="app">
      <header className="app-header">
        <div className="brand">
          <img
            src={mantaRay}
            alt=""
            className="brand-icon"
            aria-hidden="true"
          />

          <span className="brand-name">
            MANTA
          </span>
        </div>

        <nav
          className="main-navigation"
          aria-label="Arbeitsbereiche"
        >
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-button ${
                mode === item.id ? "active" : ""
              }`}
              onClick={() => changeMode(item.id)}
              aria-current={
                mode === item.id
                  ? "page"
                  : undefined
              }
            >
              <span className="nav-number">
                {item.number}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="header-project">
          UNBENANNTES PROJEKT
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar sidebar-left">
          <div className="panel-heading">
            <span className="eyebrow">
              {activeMode?.label.toUpperCase()}
            </span>

            <h2>
              {mode === "diagram" &&
                "Diagramm wählen"}
              {mode === "data" &&
                "Daten bearbeiten"}
              {mode === "editor" &&
                "Animation"}
              {mode === "export" &&
                "Export"}
            </h2>
          </div>

          {mode === "diagram" && (
            <ChartSection
              chartType={chartType}
              setChartType={changeChartType}
            />
          )}

          {mode === "data" && dataEditor}

          {mode === "editor" &&
            settings &&
            preset && (
              <AnimationSection
                animation={settings.animation}
                animationOptions={
                  preset.options.animation
                }
                updateSetting={updateSetting}
              />
            )}

          {mode === "export" && settings && (
            <ExportSection
              data={data}
              settings={settings}
              chartType={chartType}
              updateSetting={updateSetting}
            />
          )}
        </aside>

        <section className="workspace">
          <div className="workspace-topline">
            <span>
              Live Preview · 9:16
            </span>
          </div>

          <div className="preview-stage">
            <div className="preview-stack">
              <div className="preview-actions">
                <button
                  type="button"
                  className="replay-button"
                  onClick={replayAnimation}
                  disabled={showOnboarding}
                  aria-label="Animation erneut abspielen"
                  title={
                    showOnboarding
                      ? "Vorschau ab dem Editor verfügbar"
                      : "Animation erneut abspielen"
                  }
                >
                  ↻
                </button>
              </div>

              <div className="phone-preview">
                {showOnboarding ? (
                  <OnboardingPreview
                    step={onboardingStep}
                    onNext={nextOnboardingStep}
                  />
                ) : (
                  <>
                    {settings && (
                      <DraggableChart
                        chartType={chartType}
                        positionX={settings.appearance.positionX}
                        positionY={settings.appearance.positionY}
                        size={settings.appearance.size}
                        thickness={settings.appearance.thickness ?? 30}
                        onPositionChange={updateChartPosition}
                      >
                        <ChartPreview
                          key={`${chartType}-${diagramMode}-${replay}`}
                          data={data} settings={settings} chartType={chartType}
                          playAnimation={playAnimation} onLabelMove={moveLabel}
                        />
                      </DraggableChart>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="sidebar sidebar-right">
          <div className="panel-heading">
            <span className="eyebrow">
              EIGENSCHAFTEN
            </span>

            <h2>
              {mode === "diagram" &&
                "Diagrammoptionen"}
              {mode === "data" &&
                "Datenoptionen"}
              {mode === "editor" &&
                "Gestaltung"}
              {mode === "export" &&
                "Ausgabe"}
            </h2>
          </div>

          {mode === "diagram" &&
            chartType === "donut" &&
            settings && (
              <DiagramOptionsSection
                diagramMode={diagramMode}
                setDiagramMode={setDiagramMode}
              />
            )}

          {mode === "diagram" &&
            chartType !== "donut" && (
              <div className="panel-note">
                {chartType === "group"
                  ? "Jede Person steht für einen Wert. Unter Daten kannst du bis zu 100 Personen farblich zuordnen."
                  : "Balken wachsen entsprechend den eingegebenen Werten. Animation und Gestaltung findest du im Editor."}
              </div>
            )}

          {mode === "data" && (
            <div className="panel-note">
              {isProgress
                ? "Lege den Fortschrittswert zwischen 0 und 100 % fest."
                : chartType === "group"
                  ? `Eine Person pro Wert, insgesamt höchstens ${settings.appearance.peopleCount}. Nicht zugeordnete Personen bleiben grau.`
                  : "Bearbeite links Kategorien, Werte und Farben."}
            </div>
          )}

          {mode === "editor" && settings && (
            <>
              <AppearanceSection
                chartType={chartType}
                appearance={
                  settings.appearance
                }
                minimumPeople={Math.max(1, data.reduce((sum, row) => sum + Math.round(Number(row.value) || 0), 0))}
                updateSetting={
                  updateSetting
                }
              />

              <LabelsSection
                labels={settings.labels}
                updateSetting={
                  updateSetting
                }
              />
            </>
          )}

          {mode === "export" && (
            <div className="panel-note">
              MOV mit ProRes 4444 für Premiere Pro.
              Wähle links Transparenz oder eine feste Hintergrundfarbe.
              Verschobene Beschriftungen werden mit exportiert.
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
