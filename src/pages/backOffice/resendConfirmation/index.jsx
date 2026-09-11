import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Segmented,
  Modal,
  Input,
  message,
  Typography,
  Space,
  Spin,
  theme,
} from "antd";
import { ReloadOutlined, SendOutlined, EyeOutlined } from "@ant-design/icons";
import backOfficeServices from "services/backoffice.services";

const { Text } = Typography;

const statusMeta = {
  NEVER_SENT: { color: "warning", label: "ยังไม่ส่ง" },
  FAILED: { color: "error", label: "ส่งล้มเหลว" },
  PENDING: { color: "processing", label: "ค้างคิว" },
};

const fmt = (v) => (v === null || v === undefined || v === "" ? "—" : String(v));

const ResendConfirmation = () => {
  const { token } = theme.useToken();

  const [filter, setFilter] = useState("all");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [testEmail, setTestEmail] = useState("");

  const { data: list, isFetching, refetch } = backOfficeServices.useQueryGetPendingConfirmations();
  const { data: preview, isFetching: loadingPreview } = backOfficeServices.useQueryGetConfirmationPreview({
    orderNo: previewOrder,
  });

  const resendMut = backOfficeServices.useMutationResendConfirmation(
    (res) => {
      if (res.success) message.success(res.message || "ส่งแล้ว");
      else message.warning(res.message || "ส่งไม่สำเร็จ");
      refetch();
    },
    () => message.error("เกิดข้อผิดพลาดในการส่ง")
  );

  const bulkMut = backOfficeServices.useMutationResendConfirmationBulk(
    (results) => {
      const ok = (results || []).filter((r) => r.success).length;
      const fail = (results || []).length - ok;
      message.success(`ส่งแล้ว ${ok} รายการ${fail ? ` · ล้มเหลว ${fail}` : ""}`);
      setSelectedKeys([]);
      refetch();
    },
    () => message.error("เกิดข้อผิดพลาดในการส่งแบบกลุ่ม")
  );

  const filtered = (list || []).filter((r) => filter === "all" || r.emailStatus === filter);

  const counts = (list || []).reduce((acc, r) => {
    acc[r.emailStatus] = (acc[r.emailStatus] || 0) + 1;
    return acc;
  }, {});

  const confirmResend = (orderNo) => {
    Modal.confirm({
      title: "ส่งอีเมลยืนยันจริงหาลูกค้า?",
      content: `ออเดอร์ ${orderNo} — จะส่งอีเมลไปยังอีเมลของลูกค้าจริง`,
      okText: "ส่ง",
      cancelText: "ยกเลิก",
      onOk: () => resendMut.mutateAsync({ orderNo }),
    });
  };

  const confirmBulk = () => {
    Modal.confirm({
      title: `ส่งอีเมลยืนยันจริง ${selectedKeys.length} รายการ?`,
      content: "จะส่งอีเมลไปยังอีเมลของลูกค้าจริงทุกรายการที่เลือก",
      okText: "ส่งทั้งหมด",
      cancelText: "ยกเลิก",
      onOk: () => bulkMut.mutateAsync(selectedKeys),
    });
  };

  const columns = [
    {
      title: "ออเดอร์",
      key: "order",
      render: (_, r) => (
        <div>
          <Text style={{ fontFamily: "monospace", fontWeight: 500 }}>{r.orderNo}</Text>
          <div style={{ fontSize: 11, color: token.colorTextTertiary }}>{fmt(r.eventName)}</div>
        </div>
      ),
    },
    { title: "อีเมลลูกค้า", dataIndex: "customerEmail", key: "customerEmail", ellipsis: true, render: fmt },
    { title: "จ่ายเมื่อ", dataIndex: "paidAt", key: "paidAt", render: fmt },
    {
      title: "สถานะอีเมล",
      dataIndex: "emailStatus",
      key: "emailStatus",
      render: (v, r) => {
        const m = statusMeta[v] || { color: "default", label: v };
        return <Tag color={m.color}>{m.label}{r.failedCount > 0 ? ` ×${r.failedCount}` : ""}</Tag>;
      },
    },
    {
      title: "",
      key: "action",
      align: "right",
      width: 160,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewOrder(r.orderNo)}>
            ดูอีเมล
          </Button>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<SendOutlined />}
            onClick={() => confirmResend(r.orderNo)}
          >
            ส่งใหม่
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card size="small">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: `ทั้งหมด (${(list || []).length})`, value: "all" },
              { label: `ยังไม่ส่ง (${counts.NEVER_SENT || 0})`, value: "NEVER_SENT" },
              { label: `ค้างคิว (${counts.PENDING || 0})`, value: "PENDING" },
              { label: `ล้มเหลว (${counts.FAILED || 0})`, value: "FAILED" },
            ]}
          />
          <Space>
            <Button
              type="primary"
              icon={<SendOutlined />}
              disabled={selectedKeys.length === 0}
              loading={bulkMut.isPending}
              onClick={confirmBulk}
            >
              ส่งอีเมลที่เลือก ({selectedKeys.length})
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching} />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="orderNo"
          size="small"
          loading={isFetching}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 720 }}
          locale={{ emptyText: "ไม่มีออเดอร์ที่ค้างอีเมลยืนยัน" }}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
        />
      </Card>

      <Modal
        title={
          <span>
            พรีวิวอีเมลยืนยัน · <span style={{ fontFamily: "monospace" }}>{previewOrder}</span>
          </span>
        }
        open={!!previewOrder}
        onCancel={() => {
          setPreviewOrder(null);
          setTestEmail("");
        }}
        width={820}
        footer={null}
      >
        {loadingPreview || !preview ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">ผู้รับจริง:</Text> <Text>{fmt(preview.recipientTo)}</Text>
            </div>
            <div style={{ marginBottom: 10 }}>
              <Text type="secondary">หัวข้อ:</Text> <Text>{fmt(preview.subject)}</Text>
            </div>
            <div
              style={{
                border: `0.5px solid ${token.colorBorder}`,
                borderRadius: 8,
                background: "#ffffff",
                maxHeight: "55vh",
                overflow: "auto",
                padding: 12,
              }}
              dangerouslySetInnerHTML={{ __html: preview.html || "" }}
            />

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 14,
                alignItems: "center",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <Input
                style={{ width: 240 }}
                placeholder="ส่งทดสอบไปที่ (อีเมลของคุณ)"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button
                loading={resendMut.isPending}
                disabled={!testEmail}
                onClick={() =>
                  resendMut.mutate({ orderNo: previewOrder, testRecipient: testEmail.trim() })
                }
              >
                ส่งทดสอบ
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={resendMut.isPending}
                onClick={() => confirmResend(previewOrder)}
              >
                ส่งจริงหาลูกค้า
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResendConfirmation;
