// Chart tokens and helpers for the event stats dashboard.

// Series colours (validated as a set on white: blue / orange). Status colours are reserved for
// payment state and always sit next to a text label.
export const SERIES = ["#2a78d6", "#eb6834"];
export const STATUS_COLOR = { success: "#0ca30c", pending: "#fab219", failed: "#d03b3b" };
// One identity colour per distance, in the validated categorical order (assigned by the event's
// distance order, so a distance keeps its colour whichever one is selected).
export const DISTANCE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
export const distanceColor = (index) => DISTANCE_COLORS[index % DISTANCE_COLORS.length];
const INK_MUTED = "#6e6e73";
const GRID = "#ececf0";

export const fmtNumber = (n) => (Number(n) || 0).toLocaleString("th-TH");
export const fmtBaht = (n) => `฿${(Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
export const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);

/** Shared ApexCharts options: recessive grid/axes, thin marks, tooltips on. */
export const baseChart = (overrides = {}) => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false }, parentHeightOffset: 0, fontFamily: "inherit", animations: { enabled: false } },
  grid: { borderColor: GRID, strokeDashArray: 0, padding: { left: 4, right: 8, top: -8, bottom: 0 } },
  dataLabels: { enabled: false },
  legend: { show: false },
  xaxis: { labels: { style: { colors: INK_MUTED, fontSize: "11px" } }, axisBorder: { color: "#d2d2d7" }, axisTicks: { show: false } },
  yaxis: { labels: { style: { colors: INK_MUTED, fontSize: "11px" }, formatter: (v) => fmtNumber(Math.round(v)) }, forceNiceScale: true, min: 0 },
  tooltip: { theme: "light" },
  states: { hover: { filter: { type: "darken", value: 0.9 } } },
  ...overrides,
});

/** Column-chart options: 4px rounded data ends, 2px gap between stacked fills. */
export const barChart = ({ categories, stacked = false, colors = SERIES, horizontal = false, labelEvery = 1 }) =>
  baseChart({
    chart: { ...baseChart().chart, type: "bar", stacked },
    colors,
    plotOptions: {
      bar: {
        horizontal,
        columnWidth: "60%",
        barHeight: "60%",
        borderRadius: 4,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      },
    },
    stroke: { show: true, width: stacked ? 2 : 0, colors: ["#ffffff"] },
    xaxis: {
      ...baseChart().xaxis,
      categories,
      // Dense axes (days, hours) print every n-th label, flat, instead of a rotated pile.
      // Short category sets (ages, sizes) may tilt when crowded; thinned ones stay flat.
      labels: labelEvery > 1
        ? {
          ...baseChart().xaxis.labels,
          rotate: 0,
          hideOverlappingLabels: false,
          formatter: (v) => (categories.indexOf(v) % labelEvery === 0 ? v : ""),
        }
        : {
          ...baseChart().xaxis.labels,
          rotate: -45,
          rotateAlways: false,
          trim: false,
          style: { ...baseChart().xaxis.labels.style, fontSize: categories.length > 5 ? "10px" : "11px" },
        },
      tooltip: { enabled: false },
    },
  });
