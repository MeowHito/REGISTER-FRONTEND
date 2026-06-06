import React, { useState } from "react";
import DOMPurify from "dompurify";
import { Table, Tag, Button, Modal, message, Tooltip, Typography } from "antd";
import { ReloadOutlined, SendOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { SYS_DATE_FULL_TIME_FORMAT } from "constants/helper";
import backOfficeServices from "services/backoffice.services";

const { Text } = Typography;

const statusColors = {
  PENDING: "processing",
  SENT: "success",
  FAILED: "error",
  RETRYING: "warning",
};

const EmailLogTab = React.memo(({ orderId }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [previewLog, setPreviewLog] = useState(null);

  const { data: emailLogs, isFetching, refetch } = backOfficeServices.useQueryGetEmailLogsByOrder({
    orderId,
    page,
    size: pageSize,
  });

  const resendMutation = backOfficeServices.useMutationResendEmail(
    () => {
      message.success(t("back.history.emailLog.resend.success"));
      refetch();
    },
    () => {
      message.error(t("back.history.emailLog.resend.failed"));
    }
  );

  const handleResend = (record) => {
    Modal.confirm({
      title: t("back.history.emailLog.resend.confirmTitle"),
      content: t("back.history.emailLog.resend.confirmContent", { email: record.recipientTo }),
      okText: t("back.history.emailLog.resend.ok"),
      cancelText: t("back.history.emailLog.resend.cancel"),
      onOk: () => resendMutation.mutate(record.id),
    });
  };

  const columns = [
    {
      title: t("back.history.emailLog.columns.subject"),
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
      width: 250,
    },
    {
      title: t("back.history.emailLog.columns.recipientTo"),
      dataIndex: "recipientTo",
      key: "recipientTo",
      ellipsis: true,
      width: 200,
    },
    {
      title: t("back.history.emailLog.columns.status"),
      dataIndex: "sendStatus",
      key: "sendStatus",
      width: 120,
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>
          {t(`back.history.emailLog.status.${status}`) || status}
        </Tag>
      ),
    },
    {
      title: t("back.history.emailLog.columns.retryCount"),
      dataIndex: "retryCount",
      key: "retryCount",
      width: 80,
      align: "center",
    },
    {
      title: t("back.history.emailLog.columns.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (date) => date ? dayjs(date).format(SYS_DATE_FULL_TIME_FORMAT) : "-",
    },
    {
      title: t("back.history.emailLog.columns.sentAt"),
      dataIndex: "sentAt",
      key: "sentAt",
      width: 170,
      render: (date) => date ? dayjs(date).format(SYS_DATE_FULL_TIME_FORMAT) : "-",
    },
    {
      title: t("back.history.emailLog.columns.action"),
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Tooltip title={t("back.history.emailLog.action.preview")}>
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => setPreviewLog(record)}
            />
          </Tooltip>
          {["FAILED", "SENT"].includes(record.sendStatus) && record.retryCount < 3 && (
            <Tooltip title={t("back.history.emailLog.action.resend")}>
              <Button
                icon={<SendOutlined />}
                size="small"
                type="primary"
                ghost
                loading={resendMutation.isPending}
                onClick={() => handleResend(record)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Text strong>{t("back.history.emailLog.title")}</Text>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} size="small">
          {t("back.history.emailLog.refresh")}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={emailLogs?.content || []}
        rowKey="id"
        loading={isFetching}
        size="small"
        scroll={{ x: 1000 }}
        pagination={{
          current: page + 1,
          pageSize,
          total: emailLogs?.totalElements || 0,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20],
          onChange: (p, ps) => {
            setPage(p - 1);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={previewLog?.subject}
        open={!!previewLog}
        onCancel={() => setPreviewLog(null)}
        footer={null}
        width={800}
      >
        {previewLog && (
          <div>
            <div className="mb-3">
              <Text strong>{t("back.history.emailLog.preview.to")}:</Text>{" "}
              <Text>{previewLog.recipientTo}</Text>
            </div>
            {previewLog.recipientCc && (
              <div className="mb-3">
                <Text strong>{t("back.history.emailLog.preview.cc")}:</Text>{" "}
                <Text>{previewLog.recipientCc}</Text>
              </div>
            )}
            <div className="mb-3">
              <Text strong>{t("back.history.emailLog.preview.date")}:</Text>{" "}
              <Text>{previewLog.createdAt ? dayjs(previewLog.createdAt).format(SYS_DATE_FULL_TIME_FORMAT) : "-"}</Text>
            </div>
            <div className="mb-3">
              <Tag color={statusColors[previewLog.sendStatus] || "default"}>
                {t(`back.history.emailLog.status.${previewLog.sendStatus}`) || previewLog.sendStatus}
              </Tag>
              {previewLog.errorMessage && (
                <Text type="danger" className="ml-2" style={{ fontSize: 12 }}>{previewLog.errorMessage}</Text>
              )}
            </div>
            <div
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: 8,
                padding: 16,
                minHeight: "75vh",
                overflow: "auto",
                background: "#fafafa",
              }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewLog.emailBody) }}
            />
          </div>
        )}
      </Modal>
    </>
  );
});

export default EmailLogTab;
