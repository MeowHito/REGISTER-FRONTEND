import React, { useLayoutEffect, useRef, useState } from "react";
import { Card } from "antd";

/**
 * Check whether wrapper needs vertical scrollbar.
 * Useful for conditionally adding right padding / scrollbar-gutter only when a vertical scrollbar exists.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useNeedsScroll(deps = []) {
    const ref = useRef(null);
    const [needsScroll, setNeedsScroll] = useState(false);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const check = () => {
            setNeedsScroll(el.scrollHeight > el.clientHeight + 1);
        };

        check();

        const ro = new ResizeObserver(check);
        ro.observe(el);

        return () => ro.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { ref, needsScroll };
}

export const InlineStatRow = ({ icon, label, num = 0, den }) => {
    const hasDen = den !== undefined && den !== null;

    const n = Number(num) || 0;
    const d = Number(den) || 0;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                minWidth: 0,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    minWidth: 0,
                    flex: "1 1 0",
                }}
            >
                {icon}
                <span
                    style={{
                        opacity: 0.8,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                    title={label}
                >
                    {label}
                </span>
            </div>

            <strong
                style={{
                    fontSize: 14,
                    flex: "0 0 auto",
                    whiteSpace: "nowrap",
                }}
            >
                {hasDen ? `${n} / ${d}` : n}
            </strong>
        </div>
    );
};

/**
 * Statistic card with two inline rows (top/bottom).
 * Each row shows: icon + label (ellipsis) on the left, value (no-wrap) on the right.
 */
export const StatCard = ({
    title,
    titleIcon,
    topLabel,
    topIcon,
    topNum,
    topDen,
    bottomLabel,
    bottomIcon,
    bottomNum,
    bottomDen,
    highlight = false,
    reserveTitleSpace = false,

    minHeight = 150,
    highlightStyle = {
        border: "1px solid var(--primary-color)",
        boxShadow: "0 0 0 2px rgba(51,122,183,0.16)",
    },
}) => {
    const hasTitle = Boolean(title || titleIcon);

    return (
        <Card
            style={{
                textAlign: "left",
                minHeight,
                ...(highlight ? highlightStyle : {}),
                height: "100%",
            }}
            styles={{
                body: {
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: 16,
                },
            }}
        >
            {hasTitle ? (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: 600,
                        marginBottom: 8,
                        justifyContent: "center",
                    }}
                >
                    {titleIcon}
                    {title}
                </div>
            ) : reserveTitleSpace ? (
                <div style={{ height: 28, marginBottom: 8 }} />
            ) : null}

            <InlineStatRow icon={topIcon} label={topLabel} num={topNum} den={topDen} />
            <InlineStatRow icon={bottomIcon} label={bottomLabel} num={bottomNum} den={bottomDen} />
        </Card>
    );
};
