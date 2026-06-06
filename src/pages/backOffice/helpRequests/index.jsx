import React, { useState } from "react";
import {
  Table, Tag, Button, Space, Select, Modal, Form,
  Input, Typography, message, Descriptions,
} from "antd";
import { PaperClipOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import backOfficeServices from "services/backoffice.services";
import { SYS_DATE_TIME_FORMAT } from "constants/helper";
import { getPublicUrl } from "utils/fileUtils";

const { Text, Paragraph } = Typography;
const { Option } = Select;

const HELP_STATUSES = ["NEW", "PENDING", "SOLVED", "CANCELLED"];

const statusColor = (status) => {
  const map = { NEW: "blue", PENDING: "orange", SOLVED: "green", CANCELLED: "red" };
  return map[status] || "default";
};

const HelpRequestList = () => {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState(undefined);
  const [page, setPage] = useState(0);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [form] = Form.useForm();

  const handleViewAttachment = async (key) => {
    try {
      const url = await getPublicUrl({ key, prefix: "help-request" });
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      message.error(t("general.error"));
    }
  };

  const { data, isLoading, refetch } = backOfficeServices.useQueryGetAllHelpRequests({
    status: filterStatus,
    page,
    size: 20,
  });

  const updateMutation = backOfficeServices.useMutationUpdateHelpStatus(
    () => {
      message.success(t("back.helpRequests.updateSuccess"));
      setEditModal(null);
      form.resetFields();
      refetch();
    },
    () => message.error(t("back.helpRequests.updateError"))
  );

  const openEdit = (record) => {
    setEditModal(record);
    form.setFieldsValue({ status: record.status, adminNote: record.adminNote || "" });
  };

  const columns = [
    {
      title: t("back.helpRequests.col.orderNo"),
      dataIndex: "orderNo",
      key: "orderNo",
      width: 140,
      render: (v) => <Text strong>{v || "-"}</Text>,
    },
    {
      title: t("back.helpRequests.col.requester"),
      key: "requester",
      width: 180,
      render: (_, r) => (
        <div>
          <div className="font-medium">{r.requesterName || "-"}</div>
          <div className="text-xs text-gray-400">{r.requesterEmail || ""}</div>
        </div>
      ),
    },
    {
      title: t("back.helpRequests.col.message"),
      dataIndex: "message",
      key: "message",
      render: (msg, record) => (
        <div className="max-w-xs">
          <Paragraph ellipsis={{ rows: 2 }} className="mb-0">{msg}</Paragraph>
          {record.attachmentUrl && (
            <span className="text-xs text-blue-500 flex items-center gap-1 mt-1">
              <PaperClipOutlined /> {t("back.helpRequests.col.attachment")}
            </span>
          )}
        </div>
      ),
    },
    {
      title: t("back.helpRequests.col.status"),
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s) => (
        <Tag color={statusColor(s)}>
          {t(`back.helpRequests.status.${s}`) || s}
        </Tag>
      ),
    },
    {
      title: t("back.helpRequests.col.adminNote"),
      dataIndex: "adminNote",
      key: "adminNote",
      render: (v) => v ? <Paragraph ellipsis={{ rows: 2 }} className="mb-0 max-w-xs">{v}</Paragraph> : <Text type="secondary">-</Text>,
    },
    {
      title: t("back.helpRequests.col.createdTime"),
      dataIndex: "createdTime",
      key: "createdTime",
      width: 140,
      render: (v) => v ? dayjs(v).format(SYS_DATE_TIME_FORMAT) : "-",
    },
    {
      title: t("back.helpRequests.col.action"),
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewModal(record)}
          />
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            {t("back.helpRequests.updateBtn")}
          </Button>
        </Space>
      ),
    },
  ];

  const tableData = data?.content || [];
  const total = data?.totalElements || 0;

  return (
    <div className="p-4">
      <div className="w-full pb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="text-xl font-semibold opacity-60">
          {t("back.helpRequests.title")} {total ? `(${total})` : ""}
        </div>
        <Select
          allowClear
          placeholder={t("back.helpRequests.filterStatus")}
          style={{ width: 180 }}
          value={filterStatus}
          onChange={(v) => { setFilterStatus(v); setPage(0); }}
        >
          {HELP_STATUSES.map((s) => (
            <Option key={s} value={s}>
              <Tag color={statusColor(s)} style={{ margin: 0 }}>
                {t(`back.helpRequests.status.${s}`) || s}
              </Tag>
            </Option>
          ))}
        </Select>
      </div>
      <Table
        rowKey="uuid"
        columns={columns}
        dataSource={tableData}
        loading={isLoading}
        bordered
        className="[&_.ant-table-thead_th]:whitespace-nowrap"
        pagination={{
          current: page + 1,
          pageSize: 20,
          total,
          onChange: (p) => setPage(p - 1),
          showSizeChanger: false,
        }}
        scroll={{ x: true }}
      />

      {/* View Detail Modal */}
      <Modal
        open={!!viewModal}
        title={t("back.helpRequests.viewModal.title")}
        onCancel={() => setViewModal(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setViewModal(null)}>{t("general.cancel")}</Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => { openEdit(viewModal); setViewModal(null); }}
            >
              {t("back.helpRequests.updateBtn")}
            </Button>
          </div>
        }
        width={580}
        destroyOnClose
      >
        {viewModal && (
          <Descriptions column={1} bordered size="small" className="mt-3">
            <Descriptions.Item label={t("back.helpRequests.col.orderNo")}>
              <Text strong>{viewModal.orderNo || "-"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t("back.helpRequests.col.requester")}>
              <div>{viewModal.requesterName || "-"}</div>
              <div className="text-xs text-gray-400">{viewModal.requesterEmail || ""}</div>
            </Descriptions.Item>
            <Descriptions.Item label={t("back.helpRequests.col.message")}>
              <Paragraph className="mb-0 whitespace-pre-wrap">{viewModal.message}</Paragraph>
              {viewModal.attachmentUrl && (
                <Button
                  type="link"
                  size="small"
                  icon={<PaperClipOutlined />}
                  className="p-0 h-auto mt-2"
                  onClick={() => handleViewAttachment(viewModal.attachmentUrl)}
                >
                  {t("back.helpRequests.viewFile")}
                </Button>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("back.helpRequests.col.status")}>
              <Tag color={statusColor(viewModal.status)}>
                {t(`back.helpRequests.status.${viewModal.status}`) || viewModal.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t("back.helpRequests.col.adminNote")}>
              {viewModal.adminNote || <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label={t("back.helpRequests.col.createdTime")}>
              {viewModal.createdTime ? dayjs(viewModal.createdTime).format(SYS_DATE_TIME_FORMAT) : "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        open={!!editModal}
        title={t("back.helpRequests.modal.title")}
        onCancel={() => { setEditModal(null); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        {editModal && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
            <div>
              <Text type="secondary">{t("back.helpRequests.col.orderNo")}: </Text>
              <Text strong>{editModal.orderNo}</Text>
            </div>
            <div>
              <Text type="secondary">{t("back.helpRequests.col.requester")}: </Text>
              <Text>{editModal.requesterName}</Text>
            </div>
            <div>
              <Text type="secondary">{t("back.helpRequests.col.message")}: </Text>
              <Text>{editModal.message}</Text>
            </div>
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            updateMutation.mutate({
              uuid: editModal.uuid,
              status: values.status,
              adminNote: values.adminNote,
            });
          }}
        >
          <Form.Item
            name="status"
            label={t("back.helpRequests.modal.status")}
            rules={[{ required: true }]}
          >
            <Select>
              {HELP_STATUSES.map((s) => (
                <Option key={s} value={s}>
                  <Tag color={statusColor(s)} style={{ margin: 0 }}>
                    {t(`back.helpRequests.status.${s}`) || s}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="adminNote"
            label={t("back.helpRequests.modal.adminNote")}
          >
            <Input.TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setEditModal(null); form.resetFields(); }}>
              {t("general.cancel")}
            </Button>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              {t("general.save")}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default HelpRequestList;
