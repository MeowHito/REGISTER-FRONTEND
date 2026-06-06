import React, { useMemo } from "react";
import { Row, Col, Card } from "antd";
import Chart from "react-apexcharts";
import TooltipTitle from "pages/backOffice/dashboard/components/tooltipTitle";

const Gender = ({ t, dashboardData }) => {
    const genderByEvent = dashboardData?.genderByEvent || {};
    const genderByEventLabels = Object.keys(genderByEvent);
    const genderByEventSeries = Object.values(genderByEvent);

    const genderByEventType = dashboardData?.genderByEventType || {};
    const genderByEventTypeLabels = useMemo(
        () => Object.keys(genderByEventType),
        [genderByEventType]
    );

    const normalizeGenderKey = (data) =>
        Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [String(k).toLowerCase(), v]));

    const { maleSeries, femaleSeries } = useMemo(() => {
        const male = genderByEventTypeLabels.map((eventType) => normalizeGenderKey(genderByEventType[eventType])["male"] || 0);
        const female = genderByEventTypeLabels.map((eventType) => normalizeGenderKey(genderByEventType[eventType])["female"] || 0);
        return { maleSeries: male, femaleSeries: female };
    }, [genderByEventType, genderByEventTypeLabels]);

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
                <Card
                    title={<TooltipTitle text={t("back.dashboard.totalByGender")} />}
                    style={{ height: 470, textAlign: "center" }}
                    styles={{ body: { height: "calc(100% - 56px)", display: "flex", alignItems: "center", justifyContent: "center" } }}
                >
                    <Chart
                        options={{
                            chart: { type: "pie", height: 350 },
                            labels: genderByEventLabels,
                            legend: { position: "bottom" },
                            states: { hover: { filter: { type: "darken", value: 0.9 } } },
                        }}
                        series={genderByEventSeries}
                        type="pie"
                        width="100%"
                        height={320}
                    />
                </Card>
            </Col>

            <Col xs={24} md={12}>
                <Card title={<TooltipTitle text={t("back.dashboard.totalByGenderAndEventType")} />} style={{ textAlign: "center" }}>
                    <Chart
                        options={{
                            chart: { type: "bar", height: 350, toolbar: { show: false } },
                            plotOptions: { bar: { horizontal: false } },
                            xaxis: { categories: genderByEventTypeLabels },
                            legend: { position: "top" },
                            states: { hover: { filter: { type: "darken", value: 0.9 } } },
                        }}
                        series={[
                            { name: "male", data: maleSeries },
                            { name: "female", data: femaleSeries },
                        ]}
                        type="bar"
                        width="100%"
                        height={350}
                    />
                </Card>
            </Col>
        </Row>
    );
};

export default Gender;
