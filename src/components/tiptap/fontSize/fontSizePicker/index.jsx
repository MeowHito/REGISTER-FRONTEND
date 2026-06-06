import { Select, Tooltip } from "antd";
import { useState } from "react";

const generateFontSizes = () => {
  const sizes = [];

  for (let i = 8; i <= 30; i++) {
    sizes.push(i);
  }

  sizes.push(32, 36, 48, 64, 72, 96);

  return sizes.map((size) => ({
    value: size.toString(),
    label: `${size}px`,
  }));
};

const FontSizePicker = ({ editor }) => {
  const fontSizeOptions = generateFontSizes();
  const [value, setValue] = useState("16");

  const handleChange = (val) => {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setValue(val);
      editor.chain().focus().setFontSize(parsed).run();
    }
  };

  return (
    <Tooltip title="Font Size">
      <Select
        showSearch
        value={value}
        placeholder="Font Size"
        style={{ width: 70 }}
        size="small"
        onChange={handleChange}
        optionFilterProp="label"
        options={fontSizeOptions}
        filterOption={(input, option) =>
          option?.label?.toLowerCase().includes(input.toLowerCase())
        }
      />
    </Tooltip>
  );
};

export default FontSizePicker;
