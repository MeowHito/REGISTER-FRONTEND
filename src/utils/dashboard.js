import dayjs from "dayjs";
import { toStartOfDay } from "utils/format";
import { SYS_ISO_DATE_FORMAT } from "constants/helper";
import { handleQueryStatus } from "utils";

/**
 * Split array into chunks of size N.
 */
export const chunkArray = (arr, size) => {
  if (!Array.isArray(arr) || !Number.isFinite(size) || size <= 0) return [];
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * Build event-type stats used by BOTH pages.
 * Normalizes capacity to a single field name `capacity`.
 *
 * Supports:
 * - participantByEventType: { [name]: { participant, capacityByEventType? , capacity? } }
 * - paidByEventType:       { [name]: number }
 */
export const buildTypeStats = (dashboardData) => {
  const allTypes = dashboardData?.participantByEventType ?? {};
  const paidTypes = dashboardData?.paidByEventType ?? {};

  const typeNames = Array.from(
    new Set([...Object.keys(allTypes), ...Object.keys(paidTypes)]),
  );

  return typeNames.map((name) => ({
    name,
    total: Number(allTypes[name]?.participant ?? 0),
    capacity: Number(
      allTypes[name]?.capacity ?? allTypes[name]?.capacityByEventType ?? 0,
    ),
    paid: Number(paidTypes[name] ?? 0),
  }));
};

/**
 * Convert rows [{dateTime, daily}] to a map {YYYY-MM-DD: sum(daily)}.
 */
export const toDailyMap = (rows = []) =>
  (Array.isArray(rows) ? rows : []).reduce((acc, { dateTime, daily }) => {
    if (!dateTime) return acc;
    const k = dayjs(dateTime).format(SYS_ISO_DATE_FORMAT);
    acc[k] = (acc[k] ?? 0) + (Number(daily) || 0);
    return acc;
  }, {});

/**
 * Build daily and cumulative series from map + ordered days.
 */
export const toSeries = (map, days) => {
  const daily = days.map((d) => map[d] ?? 0);
  let acc = 0;
  const cumulative = daily.map((v) => (acc += v));
  return { daily, cumulative };
};

/**
 * Normalize RangePicker value to start-of-day range (same behavior both pages).
 */
export const normalizeDateRange = (dates) => {
  if (!dates) return [];
  const [a, b] = dates;
  if (!a || !b) return [];
  return [toStartOfDay(a), toStartOfDay(b)];
};

/**
 * Shared "dashboard ready" pattern used by both pages.
 * - calls handleQueryStatus on query result
 * - setReady(true) when data exists
 * - reset ready when selectedEvent changes (when not empty)
 */
export const bindDashboardReady = ({
  query,
  data,
  setReady,
  selectedEvent,
  onError,
}) => {
  handleQueryStatus(
    query,
    () => {
      if (data) setReady(true);
    },
    () => {
      if (typeof onError === "function") onError();
      else console.error("Error fetching dashboard data");
    },
  );

  if (selectedEvent) setReady(false);
};

/**
 * Build event select options from events list.
 * Keeps shape { value, label, ...rest }.
 */
export const buildEventOptions = (events = []) => {
  if (!Array.isArray(events)) return [];
  return events.map(({ id, name, eventDate, createdTime }) => ({
    value: id,
    label: name,
    eventDate,
    createdTime,
  }));
};

/**
 * Auto-pick selected id from options.
 * If current selected still exists, keep else pick first option or emptyValue
 */
export const pickSelectedId = (options, current, emptyValue = null) => {
  if (!Array.isArray(options) || options.length === 0) return emptyValue;
  return options.some((o) => o.value === current)
    ? current
    : (options[0]?.value ?? emptyValue);
};

/**
 * Find label from options by id, with fallbacks.
 */
export const resolveCurrentEventName = ({
  eventOptions,
  selectedEvent,
  dashboardData,
  fallbackLabel,
}) => {
  const opt = (eventOptions || []).find((o) => o.value === selectedEvent);
  return opt?.label || dashboardData?.eventName || fallbackLabel;
};

/**
 * ApexCharts official palettes
 */
export const APEX_PALETTES = [
  ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"],
  ["#3f51b5", "#03a9f4", "#4caf50", "#f9ce1d", "#FF9800"],
  ["#33b2df", "#546E7A", "#d4526e", "#13d8aa", "#A5978B"],
  ["#4ecdc4", "#c7f464", "#81D4FA", "#546E7A", "#fd6a6a"],
  ["#2b908f", "#f9a3a4", "#90ee7e", "#fa4443", "#69d2e7"],
  ["#449DD1", "#F86624", "#EA3546", "#662E9B", "#C5D86D"],
  ["#D7263D", "#1B998B", "#2E294E", "#F46036", "#E2C044"],
  ["#662E9B", "#F86624", "#F9C80E", "#EA3546", "#43BCCD"],
  ["#5C4742", "#A5978B", "#8D5B4C", "#5A2A27", "#C4BBAF"],
  ["#A300D6", "#7D02EB", "#5653FE", "#2983FF", "#00B1F2"],
];

/**
 * Flatten APEX_PALETTES into a single long palette:
 * palette1 to palette10
 */
export const getApexSequentialPalette = (palettes = APEX_PALETTES) => {
  const src = Array.isArray(palettes) ? palettes : APEX_PALETTES;
  return src.flat().filter(Boolean);
};

/**
 * Build a color map from labels -> sequential colors (cycled).
 */
export const buildColorMapFromLabels = (labels = [], palette = []) => {
  const safeLabels = Array.isArray(labels) ? labels : [];
  const safePalette =
    Array.isArray(palette) && palette.length > 0
      ? palette
      : getApexSequentialPalette();

  const map = {};
  safeLabels.forEach((name, idx) => {
    map[name] = safePalette[idx % safePalette.length];
  });
  return map;
};

/**
 * Convert hex color to rgba string for boxShadow highlight.
 */
export const hexToRgba = (hex, alpha = 0.16) => {
  if (!hex) return `rgba(51,122,183,${alpha})`;
  const h = String(hex).replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;

  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
};
