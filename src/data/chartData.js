
export const chartData = {
  donut: [
    {
      category: "Zustimmung",
      value: 70,
      color: "#a855f7",
      visible: true,
    },
    {
      category: "Ablehnung",
      value: 20,
      color: "#71C9BE",
      visible: true,
    },
    {
      category: "Keine Angabe",
      value: 10,
      color: "#D4D3DA",
      visible: true,
    },
  ],

  welle: [
    {
      category: "Füllstand",
      value: 75,
      color: "#a855f7",
      visible: true,
    },
  ],

  explosion: [
    {
      category: "Zahl",
      value: 75,
      color: "#a855f7",
      visible: true,
    },
  ],
};

chartData.bar = chartData.donut.map((row) => ({ ...row }));
chartData.group = chartData.donut.map((row) => ({ ...row }));
for (const [type, rows] of Object.entries(chartData)) {
  rows.forEach((row, index) => { row.id = `${type}-${index}`; });
}

// Ten categories across five years, with changing leaders.
chartData.race = Array.from({ length: 5 }, (_, year) =>
  Array.from({ length: 10 }, (_, i) => ({
    id: `race-${year}-${i}`, category: `Kategorie ${i + 1}`, time: 2020 + year,
    value: 20 + ((i * 17 + year * (37 - i * 3)) % 100),
    color: ["#a855f7", "#71C9BE", "#D4D3DA", "#C084FC", "#50B8B0", "#E2C6FA", "#7C3AED", "#99DED5", "#B3A0CF", "#DDD6FE"][i], visible: true,
  }))
).flat();
