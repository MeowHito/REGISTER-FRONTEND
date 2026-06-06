import React from "react";
import { Card } from "antd";
import Chart from "react-apexcharts";
import TooltipTitle from "pages/backOffice/dashboard/components/tooltipTitle";

const Province = ({ t, dashboardData }) => {
    const participantByProvince = dashboardData?.participantByProvince || {};
    const categories = Object.keys(participantByProvince);
    const values = Object.values(participantByProvince);

    return (
        <div>
            <Card title={<TooltipTitle text={t("back.dashboard.totalByProvince")} />} style={{ textAlign: "center" }}>
                <Chart
                    options={{
                        chart: {
                            type: "bar",
                            height: 350,
                            toolbar: { show: false },
                        },
                        plotOptions: {
                            bar: { horizontal: false, columnWidth: "55%" },
                        },
                        dataLabels: { enabled: true },
                        xaxis: {
                            categories,
                            labels: {
                                formatter: (val) => (String(val).trim().toUpperCase() === "UNKNOWN" ? t("general.unknown") : val)
                            },
                        },
                        legend: { position: "bottom" },
                        states: {
                            hover: { filter: { type: "darken", value: 0.9 } },
                        },
                    }}
                    series={[
                        {
                            name: t("back.dashboard.countParticipant"),
                            data: values,
                        },
                    ]}
                    type="bar"
                    width="100%"
                    height={350}
                />
            </Card>
        </div>
    );
};

export default Province;
