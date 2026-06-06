import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Statistic,
  Space,
  Alert,
  Descriptions,
  Switch,
  Spin,
  Modal,
  Select,
  Input,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { AlertSuccess, AlertError, AlertConfirm } from "components/alert";
import CommonForm from "components/commonForm";
import backofficeServices from "services/backoffice.services";
import { errorToMessage } from "hooks/functions/errorToMessage";

function JobMonitoring() {
  const { t } = useTranslation();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = CommonForm.useForm();

  const queryKey = useMemo(() => ["jobMonitoring"], []);
  const historyQueryKey = useMemo(() => ["jobExecutionHistory"], []);

  const {
    data: monitoringData,
    isLoading: isLoadingMonitoring,
    refetch: refetchMonitoring,
  } = backofficeServices.useQueryGetJobMonitoring({ queryKey });

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = backofficeServices.useQueryGetJobExecutionHistory({
    queryKey: historyQueryKey,
  });

  const JOB_TRIGGER_MAP = useMemo(() => ({
    updateOverduePaymentsJob: "update-overdue-payments",
    resendFailedEmailsJob: "resend-failed-emails",
  }), []);

  const { mutate: triggerJob, isPending: isTriggering } =
    backofficeServices.useMutationTriggerJob(
      (res) => {
        const { success, message } = res || {};
        if (success) {
          AlertSuccess({ text: message || t("general.success") });
          setTimeout(() => {
            refetchMonitoring();
            refetchHistory();
          }, 1000);
        } else {
          AlertError({ text: message || t("general.error") });
        }
      },
      (err) => {
        AlertError({
          text: errorToMessage(err?.response?.data?.message || err?.message),
        });
      }
    );

  const { mutate: updateSchedule, isPending: isUpdatingSchedule } =
    backofficeServices.useMutationUpdateJobSchedule(
      (res) => {
        const { success, message } = res || {};
        if (success) {
          AlertSuccess({ text: message || t("back.setting.jobMonitoring.scheduleUpdateSuccess") });
          setEditModalVisible(false);
          form.resetFields();
          refetchMonitoring();
        } else {
          AlertError({ text: message || t("general.error") });
        }
      },
      (err) => {
        AlertError({
          text: errorToMessage(err?.response?.data?.message || err?.message),
        });
      }
    );

  const handleRefresh = useCallback(() => {
    refetchMonitoring();
    refetchHistory();
  }, [refetchMonitoring, refetchHistory]);

  const handleTriggerJob = useCallback((jobName) => {
    const triggerPath = JOB_TRIGGER_MAP[jobName];
    if (!triggerPath) return;
    AlertConfirm({
      text: t("back.setting.jobMonitoring.confirmTrigger"),
      onOk: () => {
        triggerJob(triggerPath);
      },
    });
  }, [triggerJob, t, JOB_TRIGGER_MAP]);

  const handleEditSchedule = useCallback((job) => {
    form.setFieldsValue({
      jobName: job.jobName,
      jobGroup: job.jobGroup || "DEFAULT",
      cronExpression: job.cronExpression,
      timezone: "Asia/Bangkok",
    });
    setEditModalVisible(true);
  }, [form]);

  const handleCancelEdit = useCallback(() => {
    setEditModalVisible(false);
    form.resetFields();
  }, [form]);

  const handleSubmitSchedule = useCallback(() => {
    form.validateFields().then((values) => {
      AlertConfirm({
        text: t("back.setting.jobMonitoring.confirmScheduleUpdate"),
        onOk: () => {
          updateSchedule(values);
        },
      });
    });
  }, [form, updateSchedule, t]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        refetchMonitoring();
        refetchHistory();
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refetchMonitoring, refetchHistory]);

  const cronToHuman = (cron) => {
    if (!cron) return "N/A";
    const patterns = {
      "0 0 0 * * ?": t("back.setting.jobMonitoring.everyDayMidnight"),
      "0 0 2 * * ?": t("back.setting.jobMonitoring.everyDay2AM"),
      "0 0 */6 * * ?": t("back.setting.jobMonitoring.every6Hours"),
      "0 0 0 ? * MON": t("back.setting.jobMonitoring.everyMonday"),
      "0 30 1 1 * ?": t("back.setting.jobMonitoring.firstDayMonth"),
    };
    return patterns[cron] || cron;
  };

  const commonCronPatterns = [
    { label: t("back.setting.jobMonitoring.everyDayMidnight"), value: "0 0 0 * * ?" },
    { label: t("back.setting.jobMonitoring.everyDay2AM"), value: "0 0 2 * * ?" },
    { label: t("back.setting.jobMonitoring.every6Hours"), value: "0 0 */6 * * ?" },
    { label: t("back.setting.jobMonitoring.everyMonday"), value: "0 0 0 ? * MON" },
    { label: t("back.setting.jobMonitoring.firstDayMonth"), value: "0 30 1 1 * ?" },
  ];

  const timezones = [
    { label: "Asia/Bangkok (UTC+7)", value: "Asia/Bangkok" },
    { label: "UTC", value: "UTC" },
    { label: "America/New_York", value: "America/New_York" },
    { label: "Europe/London", value: "Europe/London" },
    { label: "Asia/Tokyo", value: "Asia/Tokyo" },
    { label: "Asia/Singapore", value: "Asia/Singapore" },
  ];

  const getStateColor = (state) => {
    const colors = {
      NORMAL: "success",
      PAUSED: "warning",
      ERROR: "error",
      BLOCKED: "warning",
      COMPLETE: "default",
      STARTED: "processing",
      COMPLETED: "success",
      FAILED: "error",
    };
    return colors[state] || "default";
  };

  const getStateIcon = (state) => {
    const icons = {
      NORMAL: <CheckCircleOutlined />,
      PAUSED: <ExclamationCircleOutlined />,
      ERROR: <ExclamationCircleOutlined />,
      BLOCKED: <ExclamationCircleOutlined />,
      COMPLETE: <CheckCircleOutlined />,
      STARTED: <ClockCircleOutlined spin />,
      COMPLETED: <CheckCircleOutlined />,
      FAILED: <ExclamationCircleOutlined />,
    };
    return icons[state] || <InfoCircleOutlined />;
  };

  const historyColumns = [
    {
      title: t("back.setting.jobMonitoring.table.jobName"),
      dataIndex: "jobName",
      key: "jobName",
      width: 200,
    },
    {
      title: t("back.setting.jobMonitoring.table.firedTime"),
      dataIndex: "firedTime",
      key: "firedTime",
      width: 180,
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: t("back.setting.jobMonitoring.table.scheduledTime"),
      dataIndex: "scheduledTime",
      key: "scheduledTime",
      width: 180,
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: t("back.setting.jobMonitoring.table.state"),
      dataIndex: "state",
      key: "state",
      width: 120,
      render: (state) => (
        <Tag color={getStateColor(state)} icon={getStateIcon(state)}>
          {state}
        </Tag>
      ),
    },
    {
      title: t("back.setting.jobMonitoring.table.priority"),
      dataIndex: "priority",
      key: "priority",
      width: 100,
      align: "center",
    },
    {
      title: t("back.setting.jobMonitoring.table.instance"),
      dataIndex: "instanceName",
      key: "instanceName",
      ellipsis: true,
    },
  ];

  const jobs = monitoringData?.jobs || [];
  const schedulerInfo = monitoringData?.schedulerInfo;
  const executions = historyData?.executions || [];
  const spinning = isLoadingMonitoring && !monitoringData;

  return (
    <Spin spinning={spinning}>
      <div style={{ padding: "0 24px" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <h2>{t("back.setting.jobMonitoring.title")}</h2>
            </Col>
            <Col>
              <Space>
                <span>{t("back.setting.jobMonitoring.autoRefresh")}</span>
                <Switch checked={autoRefresh} onChange={setAutoRefresh} />
                <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                  {t("general.refresh")}
                </Button>
              </Space>
            </Col>
          </Row>

          {schedulerInfo && (
            <Card
              title={t("back.setting.jobMonitoring.schedulerInfo")}
              size="small"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={t("back.setting.jobMonitoring.status")}
                    value={
                      schedulerInfo.started
                        ? t("back.setting.jobMonitoring.running")
                        : t("back.setting.jobMonitoring.stopped")
                    }
                    valueStyle={{
                      color: schedulerInfo.started ? "#3f8600" : "#cf1322",
                    }}
                    prefix={
                      schedulerInfo.started ? (
                        <CheckCircleOutlined />
                      ) : (
                        <ExclamationCircleOutlined />
                      )
                    }
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={t("back.setting.jobMonitoring.jobsExecuted")}
                    value={schedulerInfo.numberOfJobsExecuted}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={t("back.setting.jobMonitoring.threadPoolSize")}
                    value={schedulerInfo.threadPoolSize}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={t("back.setting.jobMonitoring.clustered")}
                    value={
                      schedulerInfo.clustered
                        ? t("general.yes")
                        : t("general.no")
                    }
                    valueStyle={{
                      color: schedulerInfo.clustered ? "#3f8600" : "#888",
                    }}
                  />
                </Col>
              </Row>
              <Descriptions
                bordered
                size="small"
                column={{ xs: 1, sm: 2, md: 2 }}
                style={{ marginTop: 16 }}
              >
                <Descriptions.Item
                  label={t("back.setting.jobMonitoring.schedulerName")}
                >
                  {schedulerInfo.schedulerName}
                </Descriptions.Item>
                <Descriptions.Item
                  label={t("back.setting.jobMonitoring.instanceId")}
                >
                  {schedulerInfo.schedulerInstanceId}
                </Descriptions.Item>
                <Descriptions.Item
                  label={t("back.setting.jobMonitoring.runningSince")}
                >
                  {schedulerInfo.runningSince
                    ? new Date(schedulerInfo.runningSince).toLocaleString()
                    : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item
                  label={t("back.setting.jobMonitoring.version")}
                >
                  {schedulerInfo.version}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Row gutter={[16, 16]}>
            {jobs.map((job) => (
              <Col xs={24} lg={12} key={job.jobName}>
                <Card
                  title={
                    <Space>
                      {getStateIcon(job.triggerState)}
                      <span>{job.jobName}</span>
                      <Tag color={getStateColor(job.triggerState)}>
                        {job.triggerState}
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Space>
                      {JOB_TRIGGER_MAP[job.jobName] && (
                        <Tooltip title={t("back.setting.jobMonitoring.triggerJob")}>
                          <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => handleTriggerJob(job.jobName)}
                            loading={isTriggering}
                            size="small"
                          />
                        </Tooltip>
                      )}
                      <Tooltip title={t("back.setting.jobMonitoring.editSchedule")}>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditSchedule(job)}
                          size="small"
                        />
                      </Tooltip>
                    </Space>
                  }
                  size="small"
                >
                  <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item
                      label={t("back.setting.jobMonitoring.description")}
                    >
                      {job.description || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t("back.setting.jobMonitoring.schedule")}
                    >
                      {cronToHuman(job.cronExpression)}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t("back.setting.jobMonitoring.cronExpression")}
                    >
                      <code>{job.cronExpression || "N/A"}</code>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t("back.setting.jobMonitoring.nextFireTime")}
                    >
                      {job.nextFireTime ? (
                        <Tag color="blue" icon={<ClockCircleOutlined />}>
                          {new Date(job.nextFireTime).toLocaleString()}
                        </Tag>
                      ) : (
                        "N/A"
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t("back.setting.jobMonitoring.previousFireTime")}
                    >
                      {job.previousFireTime
                        ? new Date(job.previousFireTime).toLocaleString()
                        : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t("back.setting.jobMonitoring.startTime")}
                    >
                      {job.startTime
                        ? new Date(job.startTime).toLocaleString()
                        : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t("back.setting.jobMonitoring.priority")}
                    >
                      {job.priority}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t("back.setting.jobMonitoring.mayFireAgain")}
                    >
                      {job.mayFireAgain ? (
                        <Tag color="success">{t("general.yes")}</Tag>
                      ) : (
                        <Tag color="default">{t("general.no")}</Tag>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            ))}
          </Row>

          {jobs.length === 0 && !isLoadingMonitoring && (
            <Alert
              message={t("back.setting.jobMonitoring.noJobs")}
              description={t("back.setting.jobMonitoring.noJobsDescription")}
              type="info"
              showIcon
            />
          )}

          <Card
            title={t("back.setting.jobMonitoring.executionHistory")}
            size="small"
          >
            <Table
              columns={historyColumns}
              dataSource={executions}
              rowKey="entryId"
              size="small"
              loading={isLoadingHistory}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) =>
                  t("back.setting.jobMonitoring.totalExecutions", { total }),
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Space>

        {/* Edit Schedule Modal */}
        <Modal
          title={t("back.setting.jobMonitoring.editScheduleTitle")}
          open={editModalVisible}
          onCancel={handleCancelEdit}
          onOk={handleSubmitSchedule}
          confirmLoading={isUpdatingSchedule}
          width={600}
          okText={t("general.save")}
          cancelText={t("general.cancel")}
        >
          <CommonForm form={form} layout="vertical">
            <CommonForm.Item
              name="jobName"
              label={t("back.setting.jobMonitoring.jobName")}
            >
              <Input disabled />
            </CommonForm.Item>

            <CommonForm.Item
              name="jobGroup"
              label={t("back.setting.jobMonitoring.jobGroup")}
              extra={t("back.setting.jobMonitoring.jobGroupHelp")}
            >
              <Input placeholder="DEFAULT" />
            </CommonForm.Item>

            <CommonForm.Item
              name="cronExpression"
              label={t("back.setting.jobMonitoring.cronExpression")}
              rules={[
                { required: true, message: t("back.setting.jobMonitoring.cronRequired") },
                {
                  pattern: /^[0-9\s*/?,A-Z-]+$/,
                  message: t("back.setting.jobMonitoring.cronInvalid"),
                },
              ]}
              extra={
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <span>{t("back.setting.jobMonitoring.cronHelp")}</span>
                  <Select
                    placeholder={t("back.setting.jobMonitoring.selectCommonPattern")}
                    style={{ width: "100%" }}
                    onChange={(value) => form.setFieldsValue({ cronExpression: value })}
                    options={commonCronPatterns}
                    allowClear
                  />
                </Space>
              }
            >
              <Input placeholder="0 0 0 * * ?" />
            </CommonForm.Item>

            <CommonForm.Item
              name="timezone"
              label={t("back.setting.jobMonitoring.timezone")}
              extra={t("back.setting.jobMonitoring.timezoneHelp")}
            >
              <Select
                placeholder={t("back.setting.jobMonitoring.selectTimezone")}
                options={timezones}
                showSearch
                allowClear
              />
            </CommonForm.Item>
          </CommonForm>
        </Modal>
      </div>
    </Spin>
  );
}

export default JobMonitoring;
