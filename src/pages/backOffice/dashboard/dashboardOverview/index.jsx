import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Card, Statistic, Progress, DatePicker, Select, Tooltip, Spin } from "antd";
import { DollarCircleOutlined } from "@ant-design/icons";
import Chart from "react-apexcharts";
import { useTranslation } from "react-i18next";
import backOfficeServices from "services/backoffice.services";
import dayjs from "dayjs";
import { handleQueryStatus } from "utils";
import { useMediaQuery } from "react-responsive";
import { SYS_ISO_DATE_FORMAT } from "constants/helper";
import { toStartOfDay } from "utils/format";
import StatSection from "../components/statSection";
import TooltipTitle from "../components/tooltipTitle";

const { Option } = Select;
const { RangePicker } = DatePicker;

const DashboardOverview = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isTablet = useMediaQuery({ query: "(max-width: 1024px)" });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventOption, setEventOption] = useState([]);
  const [isDataReady, setIsDataReady] = useState(false);

  const { data: events, isFetching: isFetchingEvent } = backOfficeServices.useQueryGetAllEventsDashboard();
  const {
    data: dashboardData,
    isFetching: isFetchingDash,
    ...otherDashboard
  } = backOfficeServices.useQueryGetDashboardOverview({ eventId: selectedEvent });

  const isFetching = isFetchingEvent || isFetchingDash;

  useEffect(() => {
    if (!events || events.length === 0) {
      setEventOption([]);
      setSelectedEvent(null);
      return;
    }

    const options = events.map(({ id, name, eventDate, createdTime }) => ({
      value: id,
      label: name,
      eventDate,
      createdTime,
    }));

    setEventOption(options);
    setSelectedEvent((prev) =>
      options.some((o) => o.value === prev) ? prev : (options[0]?.value ?? null)
    );
  }, [events]);

  useEffect(() => {
    handleQueryStatus(
      otherDashboard,
      () => {
        if (dashboardData) {
          setIsDataReady(true);
        }
      },
      () => {
        console.error("Error fetching dashboard overview data");
      }
    );
  }, [otherDashboard.status, otherDashboard.fetchStatus]);

  useEffect(() => {
    if (selectedEvent) {
      setIsDataReady(false);
    }
  }, [selectedEvent]);

  {
    /* Pie chart - Participants */
  }
  const pieOptions = {
    chart: { type: "pie" },
    labels: dashboardData?.participantByEventType
      ? Object.keys(dashboardData.participantByEventType)
      : [],
    legend: { position: "bottom" },
    states: {
      hover: {
        filter: {
          type: "darken",
          value: 0.9,
        },
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: { width: "100%", height: 300 },
          legend: { position: "bottom" },
        },
      },
      {
        breakpoint: 480,
        options: {
          chart: { width: "100%", height: 250 },
          legend: { position: "bottom" },
        },
      },
    ],
  };

  {
    /* Progress */
  }
  const progressColor = (percent) => (percent >= 50 ? "green" : "red");

  const statusMessages = {
    REGISTRATION_CLOSED: t("back.dashboard.statusClosed"),
    REGISTRATION_OPEN: t("back.dashboard.statusOpen"),
    REGISTRATION_UNDEFINED: t("back.dashboard.statusUndefined"),
    REGISTRATION_NOT_OPEN_YET: t("back.dashboard.statusNotOpenYet"),
  };

  let message = statusMessages[dashboardData?.operationStatusCode];
  if (dashboardData?.operationStatusCode === "REGISTRATION_OPEN") {
    message = message.replace("{days}", dashboardData?.elapsedDays);
  }

  const paidCount = dashboardData?.paidByEvent ?? 0;
  const total = dashboardData?.participantByEvent || 0;
  const percentPaid = total ? Math.round((paidCount / total) * 100) : 0;

  {
    /* Line chart */
  }
  const [dateRange, setDateRange] = useState([]);
  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange([toStartOfDay(dates[0]), toStartOfDay(dates[1])]);
    } else {
      setDateRange([]);
    }
  };

  const [chartMode, setChartMode] = useState("cumulative");
  const handleChartModeChange = (value) => setChartMode(value);

  const toDailyMap = (rows = []) =>
    rows.reduce((acc, { dateTime, daily }) => {
      if (!dateTime) return acc;
      const k = dayjs(dateTime).format(SYS_ISO_DATE_FORMAT);
      acc[k] = (acc[k] ?? 0) + (Number(daily) || 0);
      return acc;
    }, {});

  const pMap = toDailyMap(dashboardData?.participantsPerDay || []);
  const paidMap = toDailyMap(dashboardData?.paidParticipantsPerDay || []);

  let dates = Array.from(
    new Set([...Object.keys(pMap), ...Object.keys(paidMap)])
  ).sort();

  if (dateRange?.[0] && dateRange?.[1]) {
    dates = dates.filter(
      (d) =>
        !dayjs(d).isBefore(dateRange[0], "day") &&
        !dayjs(d).isAfter(dateRange[1], "day")
    );
  }

  const toSeries = (map, days) => {
    const daily = days.map((d) => map[d] ?? 0);
    let acc = 0;
    const cumulative = daily.map((v) => (acc += v));
    return { daily, cumulative };
  };

  const pSeries = toSeries(pMap, dates);
  const paidSeries = toSeries(paidMap, dates);

  {
    /* Bar chart - Payment methods */
  }
  const STATUS = {
    SUCCESS: "success",
    PENDING: "pending",
    FAILED: "failed",
  };

  const UNKNOWN_KEY = "unknown";

  const normalizeMethodKey = (m) => {
    const k = (m ?? "")
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
    if (!k || k === "unknown" || k === "undefined") return UNKNOWN_KEY;
    return k;
  };

  const methodLabel = (canon) => {
    const dict = {
      creditcard: "Credit Card",
      qrcode: "QR Code",
      ewallet: "eWallet",
      alipay: "Alipay",
      wechatpay: "WeChat Pay",
    };
    return dict[canon] || canon || t("back.dashboard.unknown");
  };

  const normalizeStatus = (status) => {
    const s = (status ?? "").toString().toLowerCase().trim();
    if (["success"].includes(s)) return STATUS.SUCCESS;
    if (["pending"].includes(s))
      return STATUS.PENDING;
    if (["failed", "cancel", "cancelled", "canceled"].includes(s))
      return STATUS.FAILED;
    return s || STATUS.FAILED;
  };

  const { methods, completedPayments, pendingPayments, failedPayments } =
    useMemo(() => {
      const rows = Array.isArray(dashboardData?.paymentStatusByMethod)
        ? dashboardData.paymentStatusByMethod
        : [];

      const agg = new Map();

      for (const r of rows) {
        const key = normalizeMethodKey(r?.method);
        const st = normalizeStatus(r?.status);
        const cnt = Number(r?.count) || 0;

        if (!agg.has(key)) {
          agg.set(key, {
            [STATUS.SUCCESS]: 0,
            [STATUS.PENDING]: 0,
            [STATUS.FAILED]: 0,
          });
        }
        agg.get(key)[st] += cnt;
      }

      const methodKeys = Array.from(agg.keys()).sort((a, b) => {
        if (a === UNKNOWN_KEY && b !== UNKNOWN_KEY) return 1;
        if (b === UNKNOWN_KEY && a !== UNKNOWN_KEY) return -1;
        return a.localeCompare(b);
      });
      const methods = methodKeys.map(methodLabel);

      const completed = methodKeys.map((k) => agg.get(k)[STATUS.SUCCESS] ?? 0);
      const pending = methodKeys.map((k) => agg.get(k)[STATUS.PENDING] ?? 0);
      const failed = methodKeys.map((k) => agg.get(k)[STATUS.FAILED] ?? 0);

      return {
        methods,
        completedPayments: completed,
        pendingPayments: pending,
        failedPayments: failed,
      };
    }, [dashboardData, i18n.language]);

  {
    /* Pie chart - Failure reasons */
  }
  const showFailureReasons = true;

  const failureReasons = Array.isArray(dashboardData?.failureReasons)
    ? dashboardData.failureReasons
    : [];

  const { failureReasonsOptions, failureReasonsSeries } = useMemo(() => {
    const labels = failureReasons.map(item =>
      item?.reason === 'FAILED'
        ? t('back.dashboard.expired')
        : t('back.dashboard.cancelled')
    );
    const series = failureReasons.map((item) => Number(item?.count) || 0);

    return {
      failureReasonsOptions: {
        chart: { type: "pie" },
        labels,
        colors: ["#FF4560", "#FEB019"],
        legend: { position: "bottom" },
        states: {
          hover: {
            filter: { type: "darken", value: 0.9 },
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: { width: "100%", height: 300 },
              legend: { position: "bottom" },
            },
          },
          {
            breakpoint: 480,
            options: {
              chart: { width: "100%", height: 250 },
              legend: { position: "bottom" },
            },
          },
        ],
      },
      failureReasonsSeries: series,
    };
  }, [failureReasons, i18n.language]);

  return (
    <div>
      <div className="w-full h-auto mx-auto">
        <div className="mb-8">
          <label className="block text-xl font-semibold opacity-60 mb-2">
            {t("back.dashboard.event")}
          </label>
          <Select
            showSearch
            optionFilterProp="label"
            style={{ width: "100%" }}
            options={eventOption}
            value={selectedEvent}
            onChange={(value) => setSelectedEvent(value)}
            loading={isFetchingEvent}
          />
        </div>

        <Spin spinning={isFetching}>
          <StatSection
            t={t}
            isMobile={isMobile}
            isTablet={isTablet}
            dashboardData={dashboardData}
            eventOptions={eventOption}
            selectedEvent={selectedEvent}
          />

          {/* Pie chart - Participants */}
          <Row gutter={[16, 16]} className="mb-8 mt-8">
            <Col xs={24} md={12}>
              <Card
                title={<TooltipTitle text={t("back.dashboard.totalByEventType")} />}
                style={{
                  height: 392,
                  textAlign: "center",
                }}
                styles={{
                  body: {
                    height: "calc(100% - 56px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "18px 24px",
                  },
                }}
              >
                {isDataReady && (
                  <Chart
                    options={pieOptions}
                    series={
                      dashboardData?.participantByEventType
                        ? Object.values(
                          dashboardData.participantByEventType
                        ).map((data) =>
                          typeof data?.participant === "number"
                            ? data.participant
                            : 0
                        )
                        : [0]
                    }
                    type="pie"
                    width="100%"
                    height={300}
                  />
                )}
              </Card>
            </Col>
            {/* Progress */}
            <Col xs={24} md={12}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1, marginBottom: 4 }}>
                  <Card
                    title={<TooltipTitle text={t("back.dashboard.progressPeriod")} />}
                    style={{ textAlign: "center" }}
                  >
                    <Tooltip title={message}>
                      <Progress
                        percent={dashboardData?.progressOperation ?? 0}
                        strokeColor={
                          dashboardData?.progressOperation >= 50
                            ? "green"
                            : "red"
                        }
                        status="active"
                      />
                    </Tooltip>
                  </Card>
                </div>
                <div style={{ flex: 1, marginBottom: 4 }}>
                  <Card
                    title={<TooltipTitle text={t("back.dashboard.progressParticipant")} />}
                    style={{ textAlign: "center" }}
                  >
                    <Tooltip
                      title={`${dashboardData?.participantByEvent || 0} / ${dashboardData?.capacityByEvent || 0
                        } ${t("back.dashboard.people")}`}
                    >
                      <Progress
                        percent={dashboardData?.progressApplicants || 0}
                        strokeColor={
                          dashboardData &&
                            dashboardData.progressApplicants >= 50
                            ? "green"
                            : "red"
                        }
                        status="active"
                      />
                    </Tooltip>
                  </Card>
                </div>
                <div style={{ flex: 1 }}>
                  <Card
                    title={<TooltipTitle text={t("back.dashboard.progressPayment")} />}
                    style={{ textAlign: "center" }}
                  >
                    <Tooltip
                      title={`${paidCount} / ${total} ${t("back.dashboard.people")}`}
                    >
                      <Progress
                        percent={percentPaid}
                        strokeColor={progressColor(percentPaid)}
                        status="active"
                      />
                    </Tooltip>
                  </Card>
                </div>
              </div>
            </Col>
          </Row>
          {/* Statistic - Payment */}
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24} sm={12} md={8}>
              <Card style={{ textAlign: "center" }}>
                <Statistic
                  title={<TooltipTitle text={t("back.dashboard.registrationFee")} />}
                  value={dashboardData?.totalRegistrationFee ?? 0}
                  prefix={<DollarCircleOutlined style={{ color: "green" }} />}
                  valueStyle={{ color: "green" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card style={{ textAlign: "center" }}>
                <Statistic
                  title={<TooltipTitle text={t("back.dashboard.deliveryFee")} />}
                  value={dashboardData?.totalShippingFee ?? 0}
                  prefix={<DollarCircleOutlined style={{ color: "red" }} />}
                  valueStyle={{ color: "red" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card style={{ textAlign: "center" }}>
                <Statistic
                  title={<TooltipTitle text={t("back.dashboard.netAmount")} />}
                  value={dashboardData?.totalNetRevenue ?? 0}
                  prefix={<DollarCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
          {/* Line chart */}
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24}>
              <Card
                title={<TooltipTitle text={t("back.dashboard.statistics")} />}
                style={{ textAlign: "center" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Select
                      value={chartMode}
                      onChange={handleChartModeChange}
                      style={{
                        textAlign: "left",
                      }}
                    >
                      <Option value="cumulative">
                        {t("back.dashboard.cumulative")}
                      </Option>
                      <Option value="daily">{t("back.dashboard.daily")}</Option>
                    </Select>
                  </div>
                  <RangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    style={{ width: 228 }}
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
                      categories: dates.map((d) =>
                        dayjs(d).format(SYS_ISO_DATE_FORMAT)
                      ),
                    },
                  }}
                  series={[
                    {
                      name: t("back.dashboard.countRegistrant"),
                      data:
                        chartMode === "cumulative"
                          ? pSeries.cumulative
                          : pSeries.daily,
                    },
                    {
                      name: t("back.dashboard.paidRegistrant"),
                      data:
                        chartMode === "cumulative"
                          ? paidSeries.cumulative
                          : paidSeries.daily,
                    },
                  ]}
                  type="line"
                  width="100%"
                  height={350}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Bar chart - Payment methods */}
            <Col xs={24} md={showFailureReasons ? 12 : 24}>
              <Card
                title={<TooltipTitle text={t("back.dashboard.paymentMethods")} />}
                style={{ textAlign: "center" }}
              >
                <Chart
                  series={[
                    {
                      name: t("back.dashboard.success"),
                      data: completedPayments ?? [],
                    },
                    {
                      name: t("back.dashboard.pending"),
                      data: pendingPayments ?? [],
                    },
                    {
                      name: t("back.dashboard.failed"),
                      data: failedPayments ?? [],
                    },
                  ]}
                  options={{
                    chart: {
                      type: "bar",
                      height: 350,
                      stacked: false,
                      toolbar: {
                        show: false,
                      },
                    },
                    plotOptions: {
                      bar: { horizontal: false, columnWidth: "55%" },
                    },
                    dataLabels: { enabled: false },
                    xaxis: { categories: methods },
                    colors: ["#00E396", "#FEB019", "#FF4560"],
                    legend: { position: "bottom" },
                    states: {
                      hover: {
                        filter: {
                          type: "darken",
                          value: 0.9,
                        },
                      },
                    },
                  }}
                  type="bar"
                  width="100%"
                  height={350}
                />
              </Card>
            </Col>
            {/* Pie chart - Failure reasons */}
            {showFailureReasons && (
              <Col xs={24} md={12}>
                <Card
                  title={<TooltipTitle text={t("back.dashboard.failureReasons")} />}
                  style={{
                    height: 470,
                    textAlign: "center",
                  }}
                  styles={{
                    body: {
                      height: "calc(100% - 56px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  }}
                >
                  {isDataReady && (
                    <Chart
                      key={`failure-${i18n.language}`}
                      options={failureReasonsOptions}
                      series={failureReasonsSeries}
                      type="pie"
                      width="100%"
                      height={350}
                    />
                  )}
                </Card>
              </Col>
            )}
          </Row>
        </Spin>
      </div>
    </div>
  );
};

export default DashboardOverview;
