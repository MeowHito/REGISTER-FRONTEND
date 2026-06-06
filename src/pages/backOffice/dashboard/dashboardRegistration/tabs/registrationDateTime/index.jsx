import React, { useMemo, useState } from "react";
import { Card, DatePicker } from "antd";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { SYS_DATE_FORMAT, SYS_ISO_DATE_FORMAT } from "constants/helper";
import { toStartOfDay } from "utils/format";
import TooltipTitle from "pages/backOffice/dashboard/components/tooltipTitle";

const { RangePicker } = DatePicker;

const RegistrationDateTime = ({ t, dashboardData }) => {
    const [dateRange, setDateRange] = useState(null);

    const handleDateRangeChange = (dates) => {
        if (dates) {
            setDateRange([toStartOfDay(dates[0]), toStartOfDay(dates[1])]);
        } else {
            setDateRange(dates);
        }
    };

    const registerDates = dashboardData?.participantRegisterDate || [];

    const { appDateLabels, appDateSeries, appTimeLabels, appTimeSeries } = useMemo(() => {
        const rows = Array.isArray(registerDates) ? registerDates : [];

        const filtered = rows
            .filter(({ dateTime }) => {
                if (!dateTime) return false;
                if (!dateRange || !dateRange[0] || !dateRange[1]) return true;
                const current = dayjs(dateTime);
                return (
                    (current.isAfter(dateRange[0], "day") || current.isSame(dateRange[0], "day")) &&
                    (current.isBefore(dateRange[1], "day") || current.isSame(dateRange[1], "day"))
                );
            })
            .sort((a, b) => dayjs(a.dateTime).unix() - dayjs(b.dateTime).unix());

        const dateCountMap = {};
        filtered.forEach(({ dateTime, count }) => {
            const date = dayjs(dateTime).format(SYS_ISO_DATE_FORMAT);
            dateCountMap[date] = (dateCountMap[date] || 0) + (Number(count) || 0);
        });

        const timeCountMap = {};
        filtered.forEach(({ dateTime, count }) => {
            const hour = dayjs(dateTime).format("HH:00");
            timeCountMap[hour] = (timeCountMap[hour] || 0) + (Number(count) || 0);
        });

        const appDateLabels = Object.keys(dateCountMap).sort();
        const appDateSeries = appDateLabels.map((d) => dateCountMap[d]);

        const appTimeLabels = Object.keys(timeCountMap).sort();
        const appTimeSeries = appTimeLabels.map((h) => timeCountMap[h]);

        return { appDateLabels, appDateSeries, appTimeLabels, appTimeSeries };
    }, [registerDates, dateRange]);

    const appTimeOptions = useMemo(
        () => ({
            chart: {
                type: "line",
                height: 350,
                toolbar: {
                    show: false,
                    tools: {
                        download: false,
                        selection: false,
                        zoom: false,
                        zoomin: false,
                        zoomout: false,
                        pan: false,
                        reset: true,
                    },
                },
            },
            dataLabels: { enabled: false },
            stroke: { curve: "smooth", width: 2 },
            xaxis: { categories: appTimeLabels },
        }),
        [appTimeLabels]
    );

    return (
        <div>
            <Card title={<TooltipTitle text={t("back.dashboard.date")} />} style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <RangePicker
                        format={SYS_DATE_FORMAT}
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        style={{ width: 226 }}
                    />
                </div>

                <Chart
                    options={{
                        chart: {
                            type: "line",
                            height: 350,
                            toolbar: {
                                show: false,
                                tools: {
                                    download: false,
                                    selection: false,
                                    zoom: false,
                                    zoomin: false,
                                    zoomout: false,
                                    pan: false,
                                    reset: true,
                                },
                            },
                        },
                        dataLabels: { enabled: false },
                        stroke: { curve: "smooth", width: 2 },
                        xaxis: {
                            categories: appDateLabels.map((date) => dayjs(date).format(SYS_DATE_FORMAT)),
                        },
                    }}
                    series={[
                        {
                            name: t("back.dashboard.countParticipant"),
                            data: appDateSeries,
                        },
                    ]}
                    type="line"
                    width="100%"
                    height={350}
                />
            </Card>

            <Card title={<TooltipTitle text={t("back.dashboard.time")} />} style={{ textAlign: "center" }}>
                <Chart
                    options={appTimeOptions}
                    series={[
                        {
                            name: t("back.dashboard.countParticipant"),
                            data: appTimeSeries,
                        },
                    ]}
                    type="line"
                    width="100%"
                    height={350}
                />
            </Card>
        </div>
    );
};

export default RegistrationDateTime;
