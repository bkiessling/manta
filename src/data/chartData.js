
export const chartData = {
  donut: [
    {
      category: "Instagram",
      value: 70,
      color: "#7c3aed",
      visible: true,
    },
    {
      category: "Facebook",
      value: 20,
      color: "#a855f7",
      visible: true,
    },
    {
      category: "WhatsApp",
      value: 10,
      color: "#c084fc",
      visible: true,
    },
  ],

  welle: [
    {
      category: "Füllstand",
      value: 75,
      color: "#7c3aed",
      visible: true,
    },
  ],

  explosion: [
    {
      category: "Zahl",
      value: 75,
      color: "#7c3aed",
      visible: true,
    },
  ],
};

chartData.bar = chartData.donut.map((row) => ({ ...row }));
chartData.group = chartData.donut.slice(0, 2).map((row, index) => ({ ...row, value: index ? 25 : 50 }));
for (const [type, rows] of Object.entries(chartData)) {
  rows.forEach((row, index) => { row.id = `${type}-${index}`; });
}
