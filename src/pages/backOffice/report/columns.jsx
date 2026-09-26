import React from "react";
import { HeaderHint, Money } from "./parts";

/** antd column definition for a money field. */
export const moneyColumn = ({ title, dataIndex, sign, strong, hint, width = 120, ...rest }) => ({
  title: hint ? <HeaderHint title={title} hint={hint} /> : title,
  dataIndex,
  key: dataIndex,
  align: "right",
  width,
  render: (v) => <Money value={v} sign={sign} strong={strong} />,
  ...rest,
});

