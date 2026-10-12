import React from "react";
import dayjs from "dayjs";

/**
 * iOS-style calendar glyph: red header strip with the weekday, today's date in the body.
 * Used as the phone-menu shortcut to /eventCalendar so it reads as "calendar" at a glance.
 */
const CalendarDateIcon = ({ size = 32, lang = "th", className = "" }) => {
  const today = dayjs().locale(lang);
  const weekday = today.format("ddd").replace(/\.$/, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="30" height="30" rx="7" fill="#ffffff" stroke="#d1d5db" strokeWidth="1" />
      <path d="M1 8 a7 7 0 0 1 7 -7 h16 a7 7 0 0 1 7 7 v3 H1 z" fill="#ef4444" />
      <text
        x="16"
        y="8.6"
        textAnchor="middle"
        fontSize="6"
        fontWeight="700"
        fill="#ffffff"
        fontFamily="Kanit, system-ui, sans-serif"
      >
        {weekday}
      </text>
      <text
        x="16"
        y="26"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="#1d1d1f"
        fontFamily="Kanit, system-ui, sans-serif"
      >
        {today.format("D")}
      </text>
    </svg>
  );
};

export default CalendarDateIcon;
