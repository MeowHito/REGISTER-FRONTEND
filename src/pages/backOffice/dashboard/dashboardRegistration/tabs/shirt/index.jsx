import React, { useMemo } from "react";
import { Row, Col, Card } from "antd";
import Chart from "react-apexcharts";
import TooltipTitle from "pages/backOffice/dashboard/components/tooltipTitle";

const Shirt = ({ t, dashboardData }) => {
    const shirtByEvent = dashboardData?.shirtByEvent || {};
    const shirtByEventType = dashboardData?.shirtByEventType || {};

    const shirtSizeOrder = [
        "3XS",
        "XXXS",
        "2XS",
        "XXS",
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "2XL",
        "XXXL",
        "3XL",
        "XXXXL",
        "4XL",
        "XXXXXL",
        "5XL",
        "XXXXXXL",
        "6XL",
        "XXXXXXXL",
        "7XL",
        "FREE SIZE",
        "FREESIZE",
    ];

    const sizeMapping = {
        "FREE SIZE": "FREESIZE",
    };

    const normalizeSize = (size) => {
        if (!size) return "";
        const upper = String(size).toUpperCase();
        return sizeMapping[upper] || upper;
    };

    const {
        finalSortedSizes,
        shirtByEventSeries,
        xCategories,
        groupLabels,
        series,
    } = useMemo(() => {
        const normalizedCountsByShirtType = {};

        Object.entries(shirtByEvent).forEach(([, sizes]) => {
            Object.entries(sizes || {}).forEach(([rawSize, count]) => {
                const size = normalizeSize(rawSize);
                normalizedCountsByShirtType[size] =
                    (normalizedCountsByShirtType[size] || 0) + (Number(count) || 0);
            });
        });

        const additionalSizes = Object.keys(normalizedCountsByShirtType)
            .filter((size) => !shirtSizeOrder.includes(size))
            .sort();

        const finalSortedSizes = shirtSizeOrder
            .filter((size) => normalizedCountsByShirtType[size] !== undefined)
            .concat(additionalSizes);

        const shirtTypes = Object.keys(shirtByEvent);

        const shirtByEventSeries = shirtTypes.map((shirtType) => {
            const sizeCountRaw = shirtByEvent[shirtType] || {};
            const sizeCount = Object.fromEntries(
                Object.entries(sizeCountRaw).map(([k, v]) => [
                    normalizeSize(k),
                    Number(v) || 0,
                ])
            );

            return {
                name: shirtType,
                data: finalSortedSizes.map((size) => sizeCount[normalizeSize(size)] || 0),
            };
        });

        const allSizesSet = new Set();
        const allShirtTypesSet = new Set();
        const eventTypes = Object.keys(shirtByEventType);
        const flatData = [];

        eventTypes.forEach((eventType) => {
            const shirtTypesObj = shirtByEventType[eventType] || {};
            Object.entries(shirtTypesObj).forEach(([shirtType, sizeObj]) => {
                Object.entries(sizeObj || {}).forEach(([rawSize, count]) => {
                    const size = normalizeSize(rawSize);
                    allSizesSet.add(size);
                    allShirtTypesSet.add(shirtType);
                    flatData.push({
                        eventType,
                        shirtType,
                        size,
                        count: Number(count) || 0,
                    });
                });
            });
        });

        const allSizes = [...allSizesSet].sort((a, b) => {
            const ia = shirtSizeOrder.indexOf(a);
            const ib = shirtSizeOrder.indexOf(b);
            if (ia === -1 && ib === -1) return a.localeCompare(b);
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        });

        const xCategories = [];
        const xCategoryMap = {};
        const groupLabels = [];

        eventTypes.forEach((eventType) => {
            groupLabels.push({ title: eventType, cols: allSizes.length });
            allSizes.forEach((size) => {
                xCategories.push(size);
                const key = `${eventType}__${size}`;
                xCategoryMap[key] = xCategories.length - 1;
            });
        });

        const allShirtTypes = [...allShirtTypesSet];
        const seriesMap = {};
        allShirtTypes.forEach((shirtType) => {
            seriesMap[shirtType] = new Array(xCategories.length).fill(0);
        });

        flatData.forEach(({ eventType, size, shirtType, count }) => {
            const key = `${eventType}__${size}`;
            const index = xCategoryMap[key];
            if (index !== undefined) seriesMap[shirtType][index] += count;
        });

        const series = allShirtTypes.map((shirtType) => ({
            name: shirtType,
            data: seriesMap[shirtType],
        }));

        return {
            finalSortedSizes,
            shirtByEventSeries,
            xCategories,
            groupLabels,
            series,
        };
    }, [shirtByEvent, shirtByEventType]);

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
                <Card title={<TooltipTitle text={t("back.dashboard.totalByShirtSize")} />} style={{ textAlign: "center" }}>
                    <Chart
                        options={{
                            chart: {
                                type: "bar",
                                height: 350,
                                stacked: true,
                                toolbar: { show: false },
                            },
                            plotOptions: {
                                bar: { horizontal: false, columnWidth: "55%" },
                            },
                            dataLabels: { enabled: true },
                            xaxis: { categories: finalSortedSizes },
                            legend: { position: "bottom" },
                            states: {
                                hover: { filter: { type: "darken", value: 0.9 } },
                            },
                        }}
                        series={shirtByEventSeries}
                        type="bar"
                        width="100%"
                        height={350}
                    />
                </Card>
            </Col>

            <Col xs={24} md={12}>
                <Card title={<TooltipTitle text={t("back.dashboard.totalByShirtSizeAndEventType")} />} style={{ textAlign: "center" }}>
                    <Chart
                        options={{
                            chart: {
                                type: "bar",
                                height: 350,
                                stacked: true,
                                toolbar: { show: false },
                            },
                            plotOptions: {
                                bar: { horizontal: false, columnWidth: "45%" },
                            },
                            xaxis: {
                                categories: xCategories,
                                group: {
                                    style: { fontSize: "12px", fontWeight: 700 },
                                    groups: groupLabels,
                                },
                            },
                            legend: { position: "top" },
                            states: {
                                hover: { filter: { type: "darken", value: 0.9 } },
                            },
                        }}
                        series={series}
                        type="bar"
                        width="100%"
                        height={350}
                    />
                </Card>
            </Col>
        </Row>
    );
};

export default Shirt;
