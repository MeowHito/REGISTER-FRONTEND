import React from "react";
import { useTranslation } from "react-i18next";

import { parseCondition, plainCondition } from "./parse";

const hasDetail = (detail) => !!String(detail || "").trim();

/**
 * Renders a condition line. Text inside {braces} becomes a blue link that calls onOpen when
 * the condition has a detail; with no detail the braces are simply dropped. A condition that
 * has a detail but no braces gets a "read more" link at the end, so the popup is never lost.
 * Links swallow the click, so tapping one inside a <label> doesn't tick the box.
 */
export default function ConditionText({ text, detail, onOpen }) {
  const { t } = useTranslation();
  const parts = parseCondition(text);
  const withDetail = hasDetail(detail);

  const open = (e, title) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen?.(title);
  };

  const link = (label, key, title) => (
    // An <a>, not a <button>: buttons are atomic and jump to their own line instead of wrapping.
    <a
      key={key}
      href="#"
      role="button"
      onClick={(e) => open(e, title)}
      className="cond-link font-semibold text-[#0071e3] underline decoration-[#0071e3]/40 underline-offset-[3px] hover:text-[#0071e3] hover:decoration-[#0071e3] cursor-pointer"
    >
      {label}
    </a>
  );

  const anyLink = parts.some((p) => p.link);
  return (
    <span className="break-words">
      {parts.map((p, i) =>
        p.link && withDetail ? link(p.text, i, p.text) : <React.Fragment key={i}>{p.text}</React.Fragment>
      )}
      {withDetail && !anyLink ? (
        <>
          {" "}
          {link(t("front.reg.condition.readMore"), "more", plainCondition(text))}
        </>
      ) : null}
    </span>
  );
}
