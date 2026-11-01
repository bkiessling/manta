
import { useEffect, useState } from "react";

import { chartData } from "./data/chartData";
import { chartPresets } from "./data/chartPresets";

import Donut from "./charts/donut/Donut";
import Welle from "./charts/welle/Welle";
import Explosion from "./charts/explosion/Explosion";
import Bar from "./charts/bar/Bar";
import Group from "./charts/group/Group";

import DataSection from "./components/sidebar/DataSection";
import ChartSection from "./components/sidebar/ChartSection";
import LabelsSection from "./components/sidebar/LabelsSection";
import AppearanceSection from "./components/sidebar/AppearanceSection";
import AnimationSection from "./components/sidebar/AnimationSection";
import ExportSection from "./components/sidebar/ExportSection";

import OnboardingPreview from "./components/onboarding/OnboardingPreview";
import DraggableChart from "./components/preview/DraggableChart";

import mantaRay from "./assets/manta_ray.svg";

import "./App.css";

const MODES = [
  {
    id: "diagram",
    label: "Diagramm",
    number: "01",
  },
  {
    id: "data",
    label: "Daten",
    number: "02",
  },
  {
    id: "editor",
    label: "Editor",
    number: "03",
  },
  {
    id: "export",
    label: "Export",
    number: "04",
  },
];

export default function App() {
  const [mode, setMode] = useState("diagram");
  const [onboardingStep, setOnboardingStep] =
    useState("diagram");

  const [replay, setReplay] = useState(0);
  const [playAnimation, setPlayAnimation] =
    useState(false);

  const [chartType, setChartType] =
    useState("donut");

  const [chartDatasets, setChartDatasets] =
    useState(() => structuredClone(chartData));

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
  const data = chartDatasets[chartType] ?? [];

  const visibleCategoryCount = data.filter(
    (item) =>
      item.visible !== false &&
      Number(item.value) > 0
  ).length;

  useEffect(() => {
    if (
      chartType === "donut" && settings?.animation?.style === "spring" &&
      visibleCategoryCount !== 1
    ) {
      setChartSettings((current) => ({
        ...current,
        [chartType]: {
          ...current[chartType],
          animation: {
            ...current[chartType].animation,
            style: "easeOut",
          },
        },
      }));
    }
  }, [
    chartType,
    settings?.animation?.style,
    visibleCategoryCount,
  ]);

  const setData = (value) => {
    setChartDatasets((current) => ({
      ...current,
      [chartType]:
        typeof value === "function"
          ? value(current[chartType] ?? [])
          : value,
    }));
  };

  const addRow = () => {
    if (
      preset?.data?.maxRows != null &&
      data.length >= preset.data.maxRows
    ) {
      return;
    }

    setData((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        category: "Neue Kategorie",
        value: chartType === "group" ? Math.min(10, Math.max(0,
          settings.appearance.peopleCount - current.reduce((sum, row) => sum + Number(row.value || 0), 0))) : 10,
        color: "#a855f7",
        visible: true,
      },
    ]);
  };

  const deleteRow = (indexToDelete) => {
    if (
      data.length <=
      (preset?.data?.minRows ?? 1)
    ) {
      return;
    }

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

  const moveLabel = (id, position) => {
    setChartSettings((current) => ({
      ...current,
      [chartType]: {
        ...current[chartType],
        labels: { ...current[chartType].labels,
          positions: { ...current[chartType].labels.positions, [id]: position } },
      },
    }));
  };
  const Chart = { donut: Donut, bar: Bar, group: Group, welle: Welle, explosion: Explosion }[chartType];
  const preview = settings && Chart ? <Chart key={`${chartType}-${replay}`} data={data}
    settings={settings} playAnimation={playAnimation} onLabelMove={moveLabel} /> : null;

  const updateFormat = (value) => {
    if (!settings) return;

    setChartSettings((current) => ({
      ...current,
      [chartType]: {
        ...current[chartType],
        format: value,
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

  const changeChartType = (value) => {
    setPlayAnimation(false);
    setChartType(value);
  };

  const changeMode = (value) => {
    setMode(value);

    if (onboardingStep === "complete") {
      return;
    }

    if (
      value === "editor" ||
      value === "export"
    ) {
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
                mode === item.id
                  ? "active"
                  : ""
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

          {mode === "data" && preset && (
            <DataSection
              data={data}
              setData={setData}
              addRow={addRow}
              deleteRow={deleteRow}
              mode="distribution"
              maxTotal={chartType === "group" ? settings.appearance.peopleCount : null}
              integer={chartType === "group"}
              minRows={preset.data?.minRows ?? 1}
              maxRows={preset.data?.maxRows ?? null}
              minValue={preset.data?.minValue ?? 0}
              maxValue={preset.data?.maxValue ?? null}
            />
          )}

          {mode === "editor" &&
            settings &&
            preset && (
              <AnimationSection
                chartType={chartType}
                animation={settings.animation}
                animationOptions={preset.options.animation}
                updateSetting={updateSetting}
                visibleCategoryCount={
                  chartType === "donut"
                    ? visibleCategoryCount
                    : 0
                }
              />
            )}

          {mode === "export" &&
            settings && (
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
            <span>Live Preview · 9:16</span>
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

              <div
                className="phone-preview"
                style={{
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {showOnboarding ? (
                  <OnboardingPreview
                    step={onboardingStep}
                    onNext={nextOnboardingStep}
                  />
                ) : (
                  <>
                    {settings && chartType === "donut" ? (
                      <DraggableChart positionX={settings.appearance.positionX}
                        positionY={settings.appearance.positionY} size={settings.appearance.size}
                        thickness={settings.appearance.thickness} onPositionChange={updateChartPosition}>
                        {preview}
                      </DraggableChart>
                    ) : preview}
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
            ![
              "donut",
              "welle",
              "explosion", "bar", "group",
            ].includes(chartType) && (
              <div className="panel-note">
                Für diesen Diagrammtyp
                gibt es noch keine Optionen.
              </div>
            )}

          {mode === "data" && settings && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">
                FORMAT
              </div>

              <div className="section-content">
                <div
                  role="radiogroup"
                  aria-label="Format"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="value-format"
                      value="number"
                      checked={
                        settings.format === "number"
                      }
                      onChange={() =>
                        updateFormat("number")
                      }
                    />
                    Zahl
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="value-format"
                      value="percent"
                      checked={
                        settings.format === "percent"
                      }
                      onChange={() =>
                        updateFormat("percent")
                      }
                    />
                    Prozent
                  </label>
                </div>

                <p
                  className="panel-note"
                  style={{ marginTop: "16px" }}
                >
                  {chartType === "donut"
                    ? "Bei Prozent wird der Anteil an der Gesamtsumme angezeigt."
                    : "Das Format verändert nur die Anzeige, nicht den eingegebenen Wert."}
                </p>
              </div>
            </div>
          )}

          {mode === "editor" && settings && (
            <>
              <AppearanceSection
                chartType={chartType}
                appearance={settings.appearance}
                minimumPeople={Math.max(1, data.reduce((sum, row) => sum + Math.round(Number(row.value) || 0), 0))}
                updateSetting={updateSetting}
              />

              <LabelsSection chartType={chartType} labels={settings.labels} updateSetting={updateSetting} />
            </>
          )}

          {mode === "export" && (
            <div className="panel-note">
              MOV mit ProRes 4444 für alle fünf Diagrammtypen.
              Transparenz oder Hintergrundfarbe sowie verschobene Beschriftungen werden übernommen.
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
