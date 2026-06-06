import React, { useMemo } from "react";
import { Row, Col } from "antd";
import { UserOutlined, TeamOutlined, DollarCircleOutlined } from "@ant-design/icons";
import { StatCard, useNeedsScroll } from "pages/backOffice/dashboard/components/statCards";
import { chunkArray, buildTypeStats, resolveCurrentEventName, buildColorMapFromLabels, getApexSequentialPalette, hexToRgba } from "utils/dashboard";

const StatSection = ({
    t,
    isMobile,
    isTablet,
    dashboardData,
    eventOptions,
    selectedEvent,

    statCardMinH = 150,
    rowGap = 16,
    maxVisibleRows = 2,
    outerGap = 16,
    highlightTypes = true,
}) => {
    const currentEventName = useMemo(
        () =>
            resolveCurrentEventName({
                eventOptions,
                selectedEvent,
                dashboardData,
                fallbackLabel: t("back.dashboard.event"),
            }),
        [eventOptions, selectedEvent, dashboardData, t]
    );

    const totalByEvent = dashboardData?.participantByEvent ?? 0;
    const capacityByEvent = dashboardData?.capacityByEvent ?? 0;
    const paidByEvent = dashboardData?.paidByEvent ?? 0;

    const typeStats = useMemo(() => buildTypeStats(dashboardData), [dashboardData]);

    const columns = isTablet ? 2 : 3;
    const perRow = columns - 1;
    const typeStatChunks = useMemo(() => chunkArray(typeStats, perRow), [typeStats, perRow]);

    const totalCards = 1 + (typeStats?.length || 0);
    const cardsPerRow = isMobile ? 1 : 2;
    const rowsNeeded = Math.ceil(totalCards / cardsPerRow);
    const shouldScroll = isTablet && rowsNeeded > maxVisibleRows;

    const { ref: statWrapRef, needsScroll } = useNeedsScroll([
        shouldScroll,
        rowsNeeded,
        selectedEvent,
        typeStats?.length,
    ]);

    const maxH = statCardMinH * maxVisibleRows + rowGap * (maxVisibleRows - 1);

    const scrollWrapStyle = shouldScroll
        ? {
            maxHeight: maxH,
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: needsScroll ? 8 : 0,
            scrollbarGutter: needsScroll ? "stable" : "auto",
        }
        : {};

    const sectionStyle = {
        ...scrollWrapStyle,
        marginBottom: outerGap,
        display: "flex",
        flexDirection: "column",
        gap: rowGap,
    };

    const pieColors = useMemo(() => getApexSequentialPalette(), []);
    const labelsForColorMap = useMemo(() => {
        const paidKeys = Object.keys(dashboardData?.paidByEventType || {});
        return paidKeys.length ? paidKeys : (typeStats || []).map((s) => s.name);
    }, [dashboardData, typeStats]);

    const colorMap = useMemo(
        () => buildColorMapFromLabels(labelsForColorMap, pieColors),
        [labelsForColorMap, pieColors]
    );

    return (
        <div ref={statWrapRef} style={sectionStyle}>
            <Row gutter={[16, 16]}>
                {/* Event card */}
                <Col xs={24} sm={12} md={12} lg={12} xl={8} xxl={8}>
                    <StatCard
                        highlight
                        title={currentEventName}
                        topLabel={t("back.dashboard.totalByEvent")}
                        topIcon={<TeamOutlined />}
                        topNum={totalByEvent}
                        bottomLabel={t("back.dashboard.paidRegistrations")}
                        bottomIcon={<DollarCircleOutlined />}
                        bottomNum={paidByEvent}
                        bottomDen={capacityByEvent}
                        reserveTitleSpace
                    />
                </Col>

                {/* First event type card */}
                {typeStatChunks.length > 0 &&
                    typeStatChunks[0].map((stat) => {
                        const c = colorMap[stat.name];

                        const highlightStyle = highlightTypes && c
                            ? {
                                border: `1px solid ${c}`,
                                boxShadow: `0 0 0 2px ${hexToRgba(c, 0.16)}`,
                            }
                            : undefined;

                        return (
                            <Col
                                key={`type-${selectedEvent || "all"}-${stat.name}`}
                                xs={24} sm={12} md={12} lg={12} xl={8} xxl={8}
                            >
                                <StatCard
                                    highlight={Boolean(highlightStyle)}
                                    highlightStyle={highlightStyle}
                                    title={stat.name}
                                    topLabel={t("back.dashboard.countRegistrant")}
                                    topIcon={<UserOutlined />}
                                    topNum={stat.total}
                                    bottomLabel={t("back.dashboard.paidRegistrations")}
                                    bottomIcon={<DollarCircleOutlined />}
                                    bottomNum={stat.paid}
                                    bottomDen={stat.capacity}
                                />
                            </Col>
                        );
                    })}
            </Row>

            {/* Additional event type cards */}
            {typeStatChunks.slice(1).map((chunk, rowIndex) => (
                <Row gutter={[16, 16]} key={`row-${selectedEvent || "all"}-${rowIndex}`}>
                    <Col xs={0} sm={0} md={isTablet ? 12 : 8} />

                    {chunk.map((stat) => {
                        const c = colorMap[stat.name];

                        const highlightStyle = highlightTypes && c
                            ? {
                                border: `1px solid ${c}`,
                                boxShadow: `0 0 0 2px ${hexToRgba(c, 0.16)}`,
                            }
                            : undefined;

                        return (
                            <Col
                                key={`type-${selectedEvent || "all"}-${stat.name}`}
                                xs={24} sm={12} md={12} lg={12} xl={8} xxl={8}
                            >
                                <StatCard
                                    highlight={Boolean(highlightStyle)}
                                    highlightStyle={highlightStyle}
                                    title={stat.name}
                                    topLabel={t("back.dashboard.countRegistrant")}
                                    topIcon={<UserOutlined />}
                                    topNum={stat.total}
                                    bottomLabel={t("back.dashboard.paidRegistrations")}
                                    bottomIcon={<DollarCircleOutlined />}
                                    bottomNum={stat.paid}
                                    bottomDen={stat.capacity}
                                />
                            </Col>
                        );
                    })}
                </Row>
            ))}
        </div>
    );
};

export default StatSection;
