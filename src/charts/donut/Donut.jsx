import ChartPreview from "../../components/preview/ChartPreview";

// Compatibility wrapper; all chart types share the same preview and export path.
export default function Donut({ data = [], mode = "distribution", playAnimation = false,
  animationStyle = "linear", duration = 2, stiffness = 90, damping = 15,
  size = 70, thickness = 30, gap = 3, positionX = 50, positionY = 35, rotation = 0,
  showCategory = true, showValue = true, labelFontSize = 12, labelDistance = 24 }) {
  const settings = {
    diagram: { mode },
    animation: { style: animationStyle, duration, stiffness, damping },
    appearance: { size, thickness, gap, positionX, positionY, rotation },
    labels: { showCategory, showValue, fontSize: labelFontSize, distance: labelDistance },
  };
  return <ChartPreview data={data} settings={settings} chartType="donut" playAnimation={playAnimation} />;
}
