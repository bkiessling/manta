
import BouncingDonut from "./BouncingDonut";
import BouncingBars from "./BouncingBars";

import "./OnboardingPreview.css";

const onboardingContent = {
  diagram: {
    title: "Bereit für deine Story?",
    description:
      "Wähle dein Diagramm und bring deine Ideen in Bewegung.",
    button: "Weiter zu Daten",
  },

  data: {
    title: "Jetzt kommen deine Daten.",
    description:
      "Passe Kategorien, Werte und Farben an. Danach geht's an die Gestaltung.",
    button: "Weiter zum Editor",
  },
};

export default function OnboardingPreview({
  step = "diagram",
  onNext,
}) {
  const content =
    onboardingContent[step] ??
    onboardingContent.diagram;

  return (
    <div className="onboarding-preview">
      <div className="onboarding-illustration">
        {step === "data" ? (
          <BouncingBars />
        ) : (
          <BouncingDonut />
        )}
      </div>

      <div className="onboarding-content">
        <h2>{content.title}</h2>

        <p>{content.description}</p>

        <button
          type="button"
          className="onboarding-next"
          onClick={onNext}
        >
          <span>{content.button}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
