import React from "react";
import { Select } from "antd";
import { useMediaQuery } from "react-responsive";
import { DownOutlined } from "@ant-design/icons";
import { selectCls } from "./theme";

/**
 * A select that becomes the phone's own picker (the iOS wheel / Android list) on small screens.
 * antd's dropdown is a scrolling div inside the page, which is fiddly to flick through for long
 * lists like birth year; the native picker scrolls smoothly and is what people expect.
 * Desktop keeps the antd Select. Option values keep their type (numbers stay numbers).
 */
const PhoneFriendlySelect = ({
  id, value, onChange, options = [], placeholder, allowClear, className = selectCls, ...antdProps
}) => {
  const isPhone = useMediaQuery({ query: "(max-width: 767px)" });

  if (!isPhone) {
    return (
      <Select id={id} className={className} value={value} onChange={onChange} options={options}
        placeholder={placeholder} allowClear={allowClear} getPopupContainer={(n) => n.parentNode} {...antdProps} />
    );
  }

  const index = options.findIndex((o) => o.value === value);
  const empty = index < 0;
  return (
    <div className="relative w-full">
      <select
        id={id}
        value={empty ? "" : String(index)}
        onChange={(e) => {
          const v = e.target.value;
          onChange?.(v === "" ? undefined : options[Number(v)].value);
        }}
        className={`w-full h-12 appearance-none rounded-lg border border-[#bfc7d2] bg-white pl-3 pr-9 text-base focus:border-[#006193] focus:outline-none ${empty ? "text-[#9aa1a9]" : "text-[#181c1e]"}`}
      >
        <option value="" disabled={!allowClear}>{placeholder || ""}</option>
        {options.map((o, i) => (
          <option key={String(o.value)} value={String(i)}>{typeof o.label === "string" || typeof o.label === "number" ? o.label : String(o.value)}</option>
        ))}
      </select>
      <DownOutlined className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b7280]" />
    </div>
  );
};

export default PhoneFriendlySelect;
