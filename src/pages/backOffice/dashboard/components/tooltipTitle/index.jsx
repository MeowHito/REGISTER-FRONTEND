import React from "react";
import { Tooltip } from "antd";

export default function TooltipTitle({
    text,
    placement = "top",
    trigger = ["hover", "click"],
}) {
    return (
        <Tooltip title={text} placement={placement} trigger={trigger} autoDestroy>
            <span
                style={{
                    display: "inline-block",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    verticalAlign: "bottom",
                }}
            >
                {text}
            </span>
        </Tooltip>
    );
}
