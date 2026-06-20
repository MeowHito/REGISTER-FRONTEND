import React from "react";

/**
 * Clickable "box" selector used for gender / blood type / shirt size, matching
 * the streamlined design. Works as an Ant Design Form.Item child (value/onChange).
 */
const BoxRadio = ({ value, onChange, options = [], columns = 4, size = "md" }) => {
  const padding = size === "sm" ? "py-2 px-2 text-sm" : "py-3 px-3";

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange?.(active ? undefined : opt.value)}
            className={[
              "rounded-lg border font-semibold transition-all flex flex-col items-center justify-center gap-1",
              padding,
              opt.disabled
                ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                : active
                ? "border-[#006193] !border-2 bg-[#cce5ff] text-[#006193]"
                : "border-[#bfc7d2] text-[#3f4850] hover:border-[#006193] hover:text-[#006193]",
            ].join(" ")}
          >
            {opt.icon ? <span className="text-xl leading-none">{opt.icon}</span> : null}
            <span className="leading-tight text-center">{opt.label}</span>
            {opt.sub ? (
              <span className="text-[11px] font-normal text-gray-400 leading-tight">
                {opt.sub}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export default BoxRadio;
