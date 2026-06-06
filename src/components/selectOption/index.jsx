import { Select } from "antd";
import React from "react";

const SelectOption = ({ search = false, placeholderText, options = [{}], ...props }) => {
  const defaultOption = { label: "ทั้งหมด", value: "all" };
  const mergedOptions = [defaultOption, ...options];
  return (
    <Select
      className="w-full"
      showSearch={search}
      placeholder={placeholderText}
      size="large"
      options={mergedOptions}
      {...props}
    />
  );
};

export default SelectOption;
