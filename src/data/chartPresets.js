const animation = { style: "linear", duration: 2, stiffness: 90, damping: 15 };
const labels = { showCategory: true, showValue: true, fontSize: 12, distance: 24, positions: {}, color: "#111111" };
const output = { transparent: true, backgroundColor: "#f5f5f3" };
const options = { animation: { styles: ["linear", "easeOut", "easeInOut", "spring", "bounce"] } };

export const chartPresets = {
  donut: {
    data: { maxRows: null, maxValue: null },
    defaults: {
      diagram: { mode: "distribution" }, animation, labels, output,
      appearance: { size: 70, positionX: 50, positionY: 28, thickness: 30, gap: 3, rotation: 0 },
    },
    options,
  },
  bar: {
    data: { maxRows: 12, maxValue: null },
    defaults: {
      animation, labels, output,
      appearance: { size: 85, positionX: 50, positionY: 40, gap: 8 },
    },
    options,
  },
  group: {
    data: { maxRows: 8, maxValue: 100 },
    defaults: {
      animation, labels, output,
      appearance: { size: 85, positionX: 50, positionY: 35, gap: 3, peopleCount: 100 },
    },
    options,
  },
};
