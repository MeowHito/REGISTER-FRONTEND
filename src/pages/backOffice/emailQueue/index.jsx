import React, { useState, useCallback, useEffect } from "react";
import {
  Table,
  Button,
  Row,
  Col,
  Tag,
  Card,
  Statistic,
  Select,
  Modal,
  message,
  Space,
  Progress,
  Typography,
  InputNumber,
  Divider,
} from "antd";
import {
  MailOutlined,
  SendOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import backOfficeServices from "services/backoffice.services";
import dayjs from "dayjs";
import { SYS_DATE_FULL_TIME_FORMAT } from "constants/helper";
import { useTranslation } from "react-i18next";

const statusColors = {
  PENDING: { color: "blue", icon: <ClockCircleOutlined /> },
  PROCESSING: { color: "orange", icon: <ReloadOutlined spin /> },
  SENT: { color: "green", icon: <CheckCircleOutlined /> },
  FAILED: { color: "red", icon: <CloseCircleOutlined /> },
};

const typeColors = {
  CORRECTION: "volcano",
  NOTIFICATION: "blue",
  CONFIRMATION: "green",
  RETRY: "purple",
  OUTBOUND: "cyan",
};

const EmailQueue = () => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);

  const { data: dashboard, refetch: refetchDashboard } =
    backOfficeServices.useQueryGetEmailQueueDashboard();

  const { data: emailConfig } = backOfficeServices.useQueryGetEmailQueueConfig();
  const [configGlobal, setConfigGlobal] = useState(null);
  const [configQueue, setConfigQueue] = useState(null);

  useEffect(() => {
    if (emailConfig) {
      setConfigGlobal(emailConfig.globalDailyLimit);
      setConfigQueue(emailConfig.queueDailyLimit);
    }
  }, [emailConfig]);

  const { mutate: saveConfig, isLoading: isSavingConfig } =
    backOfficeServices.useMutationUpdateEmailQueueConfig(
      (res) => {
        if (res.success) {
          message.success(t("back.emailQueue.config.saveSuccess"));
          refetchDashboard();
        } else {
          message.warning(res.message);
        }
      },
      () => message.error(t("back.emailQueue.config.saveFailed"))
    );

  const {
    data: queueData,
    isFetching: isLoadingQueue,
    refetch: refetchQueue,
  } = backOfficeServices.useQueryGetEmailQueue({
    page: page - 1,
    size: pageSize,
    type: typeFilter,
    status: statusFilter,
  });

  const { data: events } = backOfficeServices.useQueryGetAllEventsDashboard();

  const { mutate: enqueueByEvent, isLoading: isEnqueuing } =
    backOfficeServices.useMutationEnqueueCorrectionByEvent(
      (res) => {
        if (res.success) {
          message.success(res.message);
          refetchAll();
        } else {
          message.warning(res.message);
        }
      },
      (_err) => message.error(t("back.emailQueue.error.enqueueFailed"))
    );

  const { mutate: processQueue, isLoading: isProcessing } =
    backOfficeServices.useMutationProcessEmailQueue(
      (res) => {
        if (res.success) {
          message.success(res.message);
          refetchAll();
        } else {
          message.warning(res.message);
        }
      },
      (_err) => message.error(t("back.emailQueue.error.processFailed"))
    );

  const refetchAll = useCallback(() => {
    refetchDashboard();
    refetchQueue();
  }, [refetchDashboard, refetchQueue]);

  const handleEnqueueByEvent = (eventUuid) => {
    Modal.confirm({
      title: t("back.emailQueue.confirm.enqueueTitle"),
      icon: <ExclamationCircleOutlined />,
      content: t("back.emailQueue.confirm.enqueueContent"),
      okText: t("back.emailQueue.confirm.ok"),
      cancelText: t("back.emailQueue.confirm.cancel"),
      onOk: () => enqueueByEvent(eventUuid),
    });
  };

  const handleProcessQueue = () => {
    Modal.confirm({
      title: t("back.emailQueue.confirm.processTitle"),
      icon: <SendOutlined />,
      content: t("back.emailQueue.confirm.processContent"),
      okText: t("back.emailQueue.confirm.ok"),
      cancelText: t("back.emailQueue.confirm.cancel"),
      onOk: () => processQueue(),
    });
  };

  const columns = [
    {
      title: t("back.emailQueue.columns.type"),
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => (
        <Tag color={typeColors[type] || "default"}>{type}</Tag>
      ),
    },
    {
      title: t("back.emailQueue.columns.subject"),
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
    },
    {
      title: t("back.emailQueue.columns.recipientEmail"),
      dataIndex: "recipientEmail",
      key: "recipientEmail",
      ellipsis: true,
    },
    {
      title: t("back.emailQueue.columns.orderNo"),
      dataIndex: "orderNo",
      key: "orderNo",
      width: 150,
      render: (val) => val || "-",
    },
    {
      title: t("back.emailQueue.columns.status"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const config = statusColors[status] || { color: "default" };
        return (
          <Tag color={config.color} icon={config.icon}>
            {t(`back.emailQueue.status.${status}`)}
          </Tag>
        );
      },
    },
    {
      title: t("back.emailQueue.columns.retryCount"),
      dataIndex: "retryCount",
      key: "retryCount",
      width: 80,
      align: "center",
    },
    {
      title: t("back.emailQueue.columns.createdTime"),
      dataIndex: "createdTime",
      key: "createdTime",
      width: 180,
      render: (date) =>
        date ? dayjs(date).format(SYS_DATE_FULL_TIME_FORMAT) : "-",
    },
    {
      title: t("back.emailQueue.columns.processedAt"),
      dataIndex: "processedAt",
      key: "processedAt",
      width: 180,
      render: (date) =>
        date ? dayjs(date).format(SYS_DATE_FULL_TIME_FORMAT) : "-",
    },
    {
      title: t("back.emailQueue.columns.errorMessage"),
      dataIndex: "errorMessage",
      key: "errorMessage",
      width: 200,
      ellipsis: true,
      render: (msg) =>
        msg ? <Typography.Text type="danger">{msg}</Typography.Text> : "-",
    },
  ];

  const dailyUsagePercent = dashboard
    ? Math.round((dashboard.globalSentToday / dashboard.globalDailyLimit) * 100)
    : 0;

  const queueUsagePercent = dashboard
    ? Math.round((dashboard.queueSentToday / dashboard.queueDailyLimit) * 100)
    : 0;

  return (
    <div className="p-4">
      <Typography.Title level={4}>
        <MailOutlined className="mr-2" />
        {t("back.emailQueue.title")}
      </Typography.Title>

      {/* Dashboard Stats */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={t("back.emailQueue.dashboard.totalQueued")}
              value={dashboard?.totalQueued || 0}
              prefix={<MailOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={t("back.emailQueue.dashboard.pending")}
              value={dashboard?.pendingCount || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={t("back.emailQueue.dashboard.sent")}
              value={dashboard?.sentCount || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={t("back.emailQueue.dashboard.failed")}
              value={dashboard?.failedCount || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Daily Limit Progress */}
      <Card size="small" className="mb-4">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Row align="middle" gutter={8}>
              <Col flex="auto">
                <Typography.Text strong>
                  {t("back.emailQueue.dashboard.globalDailyUsage")}
                </Typography.Text>
                <Progress
                  percent={dailyUsagePercent}
                  format={() =>
                    `${dashboard?.globalSentToday || 0} / ${dashboard?.globalDailyLimit || 500}`
                  }
                  status={dailyUsagePercent >= 100 ? "exception" : "active"}
                />
              </Col>
              <Col>
                <Typography.Text type="secondary">
                  {t("back.emailQueue.dashboard.globalRemaining", {
                    count: dashboard?.globalRemainingToday || 0,
                  })}
                </Typography.Text>
              </Col>
            </Row>
          </Col>
          <Col xs={24} md={12}>
            <Row align="middle" gutter={8}>
              <Col flex="auto">
                <Typography.Text strong>
                  {t("back.emailQueue.dashboard.queueDailyUsage")}
                </Typography.Text>
                <Progress
                  percent={queueUsagePercent}
                  format={() =>
                    `${dashboard?.queueSentToday || 0} / ${dashboard?.queueDailyLimit || 50}`
                  }
                  status={queueUsagePercent >= 100 ? "exception" : "active"}
                  strokeColor="#52c41a"
                />
              </Col>
              <Col>
                <Typography.Text type="secondary">
                  {t("back.emailQueue.dashboard.queueRemaining", {
                    count: dashboard?.queueRemainingToday || 0,
                  })}
                </Typography.Text>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Email Limit Config */}
      <Card
        size="small"
        className="mb-4"
        title={
          <Space>
            <SettingOutlined />
            {t("back.emailQueue.config.title")}
          </Space>
        }
      >
        <Row gutter={[24, 8]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Typography.Text>{t("back.emailQueue.config.globalDailyLimit")}</Typography.Text>
            <br />
            <InputNumber
              min={1}
              max={100000}
              value={configGlobal}
              onChange={setConfigGlobal}
              style={{ width: "100%", marginTop: 4 }}
              addonAfter="/ day"
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Typography.Text>{t("back.emailQueue.config.queueDailyLimit")}</Typography.Text>
            <br />
            <InputNumber
              min={1}
              max={100000}
              value={configQueue}
              onChange={setConfigQueue}
              style={{ width: "100%", marginTop: 4 }}
              addonAfter="/ day"
            />
          </Col>
          <Col xs={24} md={8}>
            <div style={{ marginTop: 24 }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={isSavingConfig}
                disabled={!configGlobal || !configQueue}
                onClick={() =>
                  saveConfig({ globalDailyLimit: configGlobal, queueDailyLimit: configQueue })
                }
              >
                {t("back.emailQueue.config.save")}
              </Button>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("back.emailQueue.config.hint")}
            </Typography.Text>
          </Col>
        </Row>
      </Card>

      {/* Actions */}
      <Card size="small" className="mb-4">
        <Row gutter={[16, 8]} align="middle">
          <Col xs={24} md={12}>
            <Space wrap>
              <Select
                placeholder={t("back.emailQueue.enqueueCorrection")}
                style={{ minWidth: 300 }}
                showSearch
                optionFilterProp="label"
                options={(events || []).map((e) => ({
                  value: e.id,
                  label: e.name,
                }))}
                onSelect={(eventUuid) => handleEnqueueByEvent(eventUuid)}
                loading={isEnqueuing}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleProcessQueue}
                loading={isProcessing}
                disabled={!dashboard?.pendingCount}
              >
                {t("back.emailQueue.processQueue")}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={refetchAll}>
                {t("back.emailQueue.refresh")}
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={12} className="text-right">
            <Space>
              <Select
                placeholder={t("back.emailQueue.filterType")}
                style={{ width: 160 }}
                allowClear
                value={typeFilter}
                onChange={(val) => {
                  setTypeFilter(val);
                  setPage(1);
                }}
                options={[
                  { value: "CORRECTION", label: "CORRECTION" },
                  { value: "RETRY", label: "RETRY" },
                  { value: "OUTBOUND", label: "OUTBOUND" },
                  { value: "NOTIFICATION", label: "NOTIFICATION" },
                  { value: "CONFIRMATION", label: "CONFIRMATION" },
                ]}
              />
              <Select
                placeholder={t("back.emailQueue.filterStatus")}
                style={{ width: 160 }}
                allowClear
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
                options={[
                  { value: "PENDING", label: t("back.emailQueue.status.PENDING") },
                  { value: "PROCESSING", label: t("back.emailQueue.status.PROCESSING") },
                  { value: "SENT", label: t("back.emailQueue.status.SENT") },
                  { value: "FAILED", label: t("back.emailQueue.status.FAILED") },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Queue Table */}
      <Table
        columns={columns}
        dataSource={queueData?.content || []}
        loading={isLoadingQueue}
        rowKey="uuid"
        scroll={{ x: 1400 }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: queueData?.totalElements || 0,
          showSizeChanger: true,
          showTotal: (total) =>
            t("back.emailQueue.totalItems", { total }),
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
          },
        }}
      />
    </div>
  );
};

export default EmailQueue;
