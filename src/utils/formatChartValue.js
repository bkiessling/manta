export function formatChartValue(value, format = "number") {
    const number = Number(value);
  
    const formatted = new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: 2,
    }).format(Number.isFinite(number) ? number : 0);
  
    return format === "percent"
      ? `${formatted} %`
      : formatted;
  }