import React, { useMemo } from "react";
import { Row, Col, Card } from "antd";
import Chart from "react-apexcharts";
import TooltipTitle from "pages/backOffice/dashboard/components/tooltipTitle";

const AgeGroup = ({ t, dashboardData }) => {
  const ageGroupByGender = dashboardData?.ageGroupByEvent || {};
  const ageGroupByGenderAndEventType = dashboardData?.ageGroupByEventType || {};

  const ageGroupEventTypes = useMemo(
    () => Object.keys(ageGroupByGenderAndEventType),
    [ageGroupByGenderAndEventType]
  );
  const genders = ["male", "female"];

  const { ageGroups, ageGroupByGenderSeries, groupedXLabels, ageGroupByGenderAndEventTypeSeries } =
    useMemo(() => {
      const ageGroupsSet = new Set();
      ageGroupEventTypes.forEach((eventType) => {
        const ageGroupData = ageGroupByGenderAndEventType[eventType] || {};
        Object.keys(ageGroupData).forEach((ageGroup) => ageGroupsSet.add(ageGroup));
      });

      const ageGroupsArr = Array.from(ageGroupsSet).sort((a, b) => {
        const aLower = Number.parseInt(String(a).split("-")[0], 10);
        const bLower = Number.parseInt(String(b).split("-")[0], 10);
        return aLower - bLower;
      });

      const series1 = genders.map((gender) => ({
        name: gender,
        data: ageGroupsArr.map((ag) => ageGroupByGender?.[ag]?.[gender] || 0),
      }));

      const gx = ageGroupEventTypes.flatMap((eventType) => ageGroupsArr.map((ag) => `${eventType}|${ag}`));

      const series2 = genders.map((gender) => ({
        name: gender,
        data: gx.map((label) => {
          const [eventType, ag] = String(label).split("|");
          return ageGroupByGenderAndEventType?.[eventType]?.[ag]?.[gender] || 0;
        }),
      }));

      return {
        ageGroups: ageGroupsArr,
        ageGroupByGenderSeries: series1,
        groupedXLabels: gx,
        ageGroupByGenderAndEventTypeSeries: series2,
      };
    }, [ageGroupByGender, ageGroupByGenderAndEventType, ageGroupEventTypes]);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card title={<TooltipTitle text={t("back.dashboard.totalByAge")} />} style={{ textAlign: "center" }}>
          <Chart
            options={{
              chart: { type: "bar", stacked: true, height: 350, toolbar: { show: false } },
              plotOptions: { bar: { horizontal: false, columnWidth: "55%" } },
              dataLabels: { enabled: true },
              xaxis: { categories: ageGroups },
              legend: { position: "bottom" },
              states: { hover: { filter: { type: "darken", value: 0.9 } } },
            }}
            series={ageGroupByGenderSeries}
            type="bar"
            width="100%"
            height={350}
          />
        </Card>
      </Col>

      <Col xs={24} md={12}>
        <Card title={<TooltipTitle text={t("back.dashboard.totalByAgeAndEventType")} />} style={{ textAlign: "center" }}>
          <Chart
            options={{
              chart: { type: "bar", height: 350, stacked: true, toolbar: { show: false } },
              plotOptions: { bar: { horizontal: false, columnWidth: "45%" } },
              dataLabels: { enabled: true },
              xaxis: {
                categories: groupedXLabels,
                labels: {
                  formatter: (val) => {
                    const parts = String(val).split("|");
                    return parts[1] || val;
                  },
                },
                group: {
                  style: { fontSize: "12px", fontWeight: 600 },
                  groups: ageGroupEventTypes.map((eventType) => ({
                    title: eventType,
                    cols: ageGroups.length,
                  })),
                },
              },
              legend: { position: "top" },
              states: { hover: { filter: { type: "darken", value: 0.9 } } },
            }}
            series={ageGroupByGenderAndEventTypeSeries}
            type="bar"
            width="100%"
            height={350}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default AgeGroup;
