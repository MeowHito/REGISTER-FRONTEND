// Tag colours per race type on /eventCalendar. Imported rows carry free-text types, so match
// case-insensitively and fall back to blue.
const TYPE_TAG = {
  "marathon": "bg-rose-50 text-rose-700 border-rose-100",
  "half marathon": "bg-purple-50 text-purple-700 border-purple-100",
  "mini marathon": "bg-blue-50 text-blue-700 border-blue-100",
  "fun run": "bg-sky-50 text-sky-700 border-sky-100",
  "trail": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "triathlon": "bg-amber-50 text-amber-700 border-amber-100",
  "ironman": "bg-amber-50 text-amber-700 border-amber-100",
  "cycling": "bg-orange-50 text-orange-700 border-orange-100",
  "duathlon": "bg-orange-50 text-orange-700 border-orange-100",
  "swimming": "bg-cyan-50 text-cyan-700 border-cyan-100",
  "relay": "bg-indigo-50 text-indigo-700 border-indigo-100",
};

export const typeTagClass = (type) =>
  TYPE_TAG[String(type || "").trim().toLowerCase()] || "bg-blue-50 text-blue-700 border-blue-100";

// Quick filter chips in the sidebar ("ประเภทยอดนิยม"); values match eventTypeOption.
export const POPULAR_TYPES = [
  { value: "Marathon", emoji: "🏅" },
  { value: "Half Marathon", emoji: "⚡" },
  { value: "Mini Marathon", emoji: "🏃" },
  { value: "Fun Run", emoji: "🎉" },
  { value: "Trail", emoji: "🏔️" },
  { value: "Triathlon", emoji: "🏊" },
];
