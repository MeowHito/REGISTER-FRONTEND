import React, { useMemo } from "react";
import { Row, Col, Card } from "antd";
import Chart from "react-apexcharts";
import StatSection from "pages/backOffice/dashboard/components/statSection";
import TooltipTitle from "pages/backOffice/dashboard/components/tooltipTitle";
import { getApexSequentialPalette } from "utils/dashboard";

const General = ({ t, i18n, isMobile, isTablet, dashboardData, isDataReady, eventOptions, selectedEvent }) => {
    const paidByEventType = dashboardData?.paidByEventType || {};
    const paidByEventTypeLabels = Object.keys(paidByEventType);
    const paidByEventTypeSeries = Object.values(paidByEventType).map((v) => Number(v) || 0);

    const pieColors = useMemo(() => getApexSequentialPalette(), []);

    const showNewOld = false;

    return (
        <div>
            <StatSection
                t={t}
                isMobile={isMobile}
                isTablet={isTablet}
                dashboardData={dashboardData}
                eventOptions={eventOptions}
                selectedEvent={selectedEvent}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} md={showNewOld ? 8 : 12}>
                    <Card
                        title={<TooltipTitle text={t("back.dashboard.totalRegistrantByEvent")} />}
                        style={{ height: 420, textAlign: "center" }}
                        styles={{ body: { height: "calc(100% - 56px)", display: "flex", alignItems: "center", justifyContent: "center" } }}
                    >
                        {isDataReady && (
                            <Chart
                                key={`payment-status-${i18n.language}`}
                                options={{
                                    chart: { type: "pie" },
                                    labels: [t("back.dashboard.success"), t("back.dashboard.pending"), t("back.dashboard.failed")],
                                    colors: ["#00E396", "#FEB019", "#FF4560"],
                                    legend: { position: "bottom" },
                                    states: { hover: { filter: { type: "darken", value: 0.9 } } },
                                }}
                                series={[dashboardData?.paidPayment ?? 0, dashboardData?.pendingPayment ?? 0, dashboardData?.unpaidPayment ?? 0]}
                                type="pie"
                                width="100%"
                                height={320}
                            />
                        )}
                    </Card>
                </Col>

                <Col xs={24} md={showNewOld ? 8 : 12}>
                    <Card
                        title={<TooltipTitle text={t("back.dashboard.totalPaidByEventType")} />}
                        style={{ height: 420, textAlign: "center" }}
                        styles={{ body: { height: "calc(100% - 56px)", display: "flex", alignItems: "center", justifyContent: "center" } }}
                    >
                        {isDataReady && (
                            <Chart
                                options={{
                                    chart: { type: "pie" },
                                    labels: paidByEventTypeLabels,
                                    colors: pieColors,
                                    legend: { position: "bottom" },
                                    states: { hover: { filter: { type: "darken", value: 0.9 } } },
                                }}
                                series={paidByEventTypeSeries.length ? paidByEventTypeSeries : [0]}
                                type="pie"
                                width="100%"
                                height={320}
                            />
                        )}
                    </Card>
                </Col>

                {showNewOld && (
                    <Col xs={24} md={8}>
                        <Card
                            title={<TooltipTitle text={t("back.dashboard.newAndOld")} />}
                            style={{ height: 420, textAlign: "center" }}
                            styles={{ body: { height: "calc(100% - 56px)", display: "flex", alignItems: "center", justifyContent: "center" } }}
                        >
                            {isDataReady && (
                                <Chart
                                    options={{
                                        labels: [t("back.dashboard.newUser"), t("back.dashboard.oldUser")],
                                        legend: { position: "bottom" },
                                        states: { hover: { filter: { type: "darken", value: 0.9 } } },
                                    }}
                                    series={[dashboardData?.countExternalParticipant ?? 0, dashboardData?.countInternalParticipant ?? 0]}
                                    type="pie"
                                    width="100%"
                                    height={320}
                                />
                            )}
                        </Card>
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default General;
