
export const chartData = {
  donut: [
    {
      category: "Zustimmung",
      value: 70,
      color: "#71C9BE",
      visible: true,
    },
    {
      category: "Ablehnung",
      value: 20,
      color: "#B995E8",
      visible: true,
    },
    {
      category: "Keine Angabe",
      value: 10,
      color: "#B7B5C0",
      visible: true,
    },
  ],

  welle: [
    {
      category: "Füllstand",
      value: 75,
      color: "#71C9BE",
      visible: true,
    },
  ],

  explosion: [
    {
      category: "Zahl",
      value: 75,
      color: "#71C9BE",
      visible: true,
    },
  ],
};

chartData.bar = chartData.donut.map((row) => ({ ...row }));
chartData.group = chartData.donut.map((row) => ({ ...row }));
for (const [type, rows] of Object.entries(chartData)) {
  rows.forEach((row, index) => { row.id = `${type}-${index}`; });
}
