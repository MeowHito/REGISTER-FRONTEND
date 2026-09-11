import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Timeline,
  Button,
  Input,
  Switch,
  Checkbox,
  Modal,
  message,
  Spin,
  Alert,
  Typography,
  InputNumber,
  Radio,
  Space,
  Row,
  Col,
  theme,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { SYS_DATE_FULL_TIME_FORMAT } from "constants/helper";
import backOfficeServices from "services/backoffice.services";

const { Text } = Typography;

const reasonColors = {
  PAYMENT_METHOD_MISMATCH: "volcano",
  AMOUNT_MISMATCH: "red",
  UNKNOWN_PAYMENT_METHOD: "orange",
  UNKNOWN_STATUS: "gold",
};

const fmt = (v) => (v === null || v === undefined || v === "" ? "—" : String(v));
const money = (v) =>
  v === null || v === undefined || v === ""
    ? "—"
    : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dt = (v) => (v ? dayjs(v).format(SYS_DATE_FULL_TIME_FORMAT) : "—");

const timelineLabel = (ev) => {
  if (ev.type === "CREATE") return `สร้างออเดอร์${ev.amount != null ? ` · ${money(ev.amount)}` : ""}`;
  if (ev.type === "PAYMENT_METHOD")
    return `เลือก/เปลี่ยนวิธีจ่าย: ${ev.method || "-"}${ev.feePercent != null ? ` (${ev.feePercent}%)` : ""}${
      ev.amount != null ? ` · รวม ${money(ev.amount)}` : ""
    }`;
  const base = `Webhook ${ev.provider || ""}: จ่าย ${money(ev.amount)}${ev.method ? ` (${ev.method})` : ""}`;
  return ev.type === "ANOMALY" && ev.reasonType ? `${base} · flagged ${ev.reasonType}` : base;
};

const timelineColor = (ev) => {
  if (ev.type === "ANOMALY") return "red";
  if (ev.type === "WEBHOOK") return "green";
  if (ev.type === "PAYMENT_METHOD") return "blue";
  return "gray";
};

const PaymentMismatch = () => {
  const { token } = theme.useToken();

  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [confirmDoublePay, setConfirmDoublePay] = useState(false);
  const [overrideMethod, setOverrideMethod] = useState("");
  const [overrideAmount, setOverrideAmount] = useState(null);
  const [txnId, setTxnId] = useState(null);
  const [patchOpen, setPatchOpen] = useState(false);

  const {
    data: reviews,
    isFetching: loadingList,
    refetch: refetchList,
  } = backOfficeServices.useQueryGetPaymentReviews();

  const {
    data: ctx,
    isFetching: loadingCtx,
    refetch: refetchCtx,
  } = backOfficeServices.useQueryGetPaymentReviewContext({ orderNo: selected });

  const resolveMut = backOfficeServices.useMutationResolvePaymentReview(
    (res) => {
      if (res.success) {
        message.success(res.message || "Patch สำเร็จ");
        setPatchOpen(false);
        setSelected(null);
        refetchList();
      } else {
        message.warning(res.message || "ไม่สามารถ patch ได้");
      }
    },
    () => message.error("เกิดข้อผิดพลาดในการ patch")
  );

  useEffect(() => {
    setReason("");
    setSendEmail(false);
    setConfirmDoublePay(false);
    setOverrideMethod("");
    setOverrideAmount(null);
    setTxnId(ctx?.suggestion?.transactionId ?? null);
  }, [selected, ctx?.suggestion?.transactionId]);

  const doublePay = !!ctx?.multipleSuccessfulPayments;
  const noMatch = !!ctx?.noMatch;
  const overrideProvided = !!overrideMethod || overrideAmount != null;
  const canPatch = (!!txnId || overrideProvided) && (!doublePay || confirmDoublePay);
  const showDiff = ctx?.expectedChanges?.length && txnId === ctx?.suggestion?.transactionId && !overrideProvided;

  const settleMethod = overrideMethod || ctx?.suggestion?.combo?.paymentMethod || "-";
  const settleAmount = overrideAmount != null ? overrideAmount : ctx?.suggestion?.combo?.totalAmountWithFee;

  const handlePatch = () => {
    resolveMut.mutate({
      orderNo: selected,
      payload: {
        transactionId: txnId || undefined,
        overrideMethod: overrideMethod || undefined,
        overrideAmount: overrideAmount ?? undefined,
        sendEmail,
        reason: reason || undefined,
        confirmDoublePay,
      },
    });
  };

  const listColumns = [
    {
      title: "เลขที่ออเดอร์",
      dataIndex: "orderNo",
      key: "orderNo",
      render: (v) => <Text style={{ fontFamily: "monospace", fontWeight: 500 }}>{v}</Text>,
    },
    { title: "อีเวนต์", dataIndex: "eventName", key: "eventName", ellipsis: true, render: fmt },
    {
      title: "เหตุผล",
      dataIndex: "reviewReason",
      key: "reviewReason",
      render: (v) => <Tag color={reasonColors[v] || "default"}>{v}</Tag>,
    },
    { title: "ยอด", dataIndex: "totalAmountWithFee", key: "totalAmountWithFee", align: "right", render: money },
    {
      title: "",
      key: "action",
      align: "right",
      width: 90,
      render: (_, r) => (
        <Button size="small" type="primary" ghost icon={<EyeOutlined />} onClick={() => setSelected(r.orderNo)}>
          ตรวจ
        </Button>
      ),
    },
  ];

  const receivedColumns = [
    {
      title: "",
      key: "select",
      width: 36,
      render: (_, r) => (
        <Radio checked={txnId === r.transactionId} disabled={!r.transactionId} onChange={() => setTxnId(r.transactionId)} />
      ),
    },
    { title: "Provider", dataIndex: "provider", key: "provider", width: 78 },
    {
      title: "วิธีจ่าย",
      dataIndex: "resolvedMethod",
      key: "resolvedMethod",
      render: (v) => (v ? <Tag color="cyan">{v}</Tag> : <Tag>unknown</Tag>),
    },
    { title: "ยอด", dataIndex: "amount", key: "amount", align: "right", render: money },
    { title: "ผู้จ่าย", dataIndex: "payerName", key: "payerName", render: fmt },
    { title: "เวลา", dataIndex: "receivedDateTime", key: "receivedDateTime", render: dt },
    {
      title: "สำเร็จ",
      dataIndex: "successful",
      key: "successful",
      render: (v) => (v ? <Tag color="success">ได้เงินแล้ว</Tag> : <Tag>ไม่สำเร็จ</Tag>),
    },
  ];

  const changeColumns = [
    {
      title: "field",
      dataIndex: "field",
      key: "field",
      render: (v) => <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</Text>,
    },
    { title: "ปัจจุบัน", dataIndex: "current", key: "current", render: (v) => <Text type="secondary">{fmt(v)}</Text> },
    { title: "", key: "arrow", width: 22, render: () => <ArrowRightOutlined style={{ color: token.colorTextQuaternary }} /> },
    {
      title: "หลัง",
      dataIndex: "after",
      key: "after",
      render: (v, r) => (
        <Text style={{ color: r.changed ? token.colorPrimary : undefined, fontWeight: r.changed ? 500 : 400 }}>
          {fmt(v)}
        </Text>
      ),
    },
  ];

  const step = (n, title) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px" }}>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: token.colorFillTertiary,
          color: token.colorTextSecondary,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
        }}
      >
        {n}
      </span>
      <Text type="secondary">{title}</Text>
    </div>
  );

  if (selected) {
    const cur = ctx?.currentState || {};
    return (
      <div className="p-4">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => setSelected(null)} style={{ paddingLeft: 0 }}>
            กลับไปรายการ
          </Button>
          <Button size="small" icon={<ReloadOutlined />} onClick={() => refetchCtx()} loading={loadingCtx}>
            รีเฟรช
          </Button>
        </div>

        {loadingCtx || !ctx ? (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Space wrap style={{ margin: "6px 0 14px" }}>
              <Text strong style={{ fontFamily: "monospace", fontSize: 16 }}>
                {ctx.orderNo}
              </Text>
              <Tag color="warning">{cur.paymentStatus}</Tag>
              <Tag color={reasonColors[cur.reviewReason] || "default"}>{cur.reviewReason}</Tag>
            </Space>

            {doublePay && (
              <Alert
                type="error"
                showIcon
                className="mb-3"
                message="อาจมีการจ่ายซ้ำ"
                description="พบรายการชำระที่สำเร็จมากกว่า 1 รายการ — ตรวจการคืนเงินก่อน เลือกรายการที่จะ settle แล้วติ๊กยืนยัน"
              />
            )}
            {noMatch && (
              <Alert
                type="warning"
                showIcon
                className="mb-3"
                message="ไม่พบ combo ที่ตรงกับยอดที่จ่าย"
                description="ระบุ override (วิธีจ่าย + ยอด) ทางขวาเพื่อ settle ด้วยตนเอง"
              />
            )}

            <Row gutter={16}>
              <Col xs={24} lg={13}>
                <Card size="small" title={step(1, "เกิดอะไรขึ้น")} className="mb-3">
                  <Timeline
                    items={(ctx.timeline || []).map((ev, i) => ({
                      key: i,
                      color: timelineColor(ev),
                      children: (
                        <div>
                          <div style={{ fontSize: 12, color: token.colorTextTertiary }}>{dt(ev.time)}</div>
                          <div style={{ fontSize: 13 }}>{timelineLabel(ev)}</div>
                        </div>
                      ),
                    }))}
                  />
                </Card>

                <Card size="small" title={step(2, "จ่ายจริงเท่าไหร่ (เลือกรายการที่จะ settle)")}>
                  <Table
                    columns={receivedColumns}
                    dataSource={ctx.receivedPayments || []}
                    rowKey={(r) => r.transactionId || `${r.provider}-${r.receivedDateTime}`}
                    size="small"
                    pagination={false}
                    scroll={{ x: 640 }}
                    locale={{ emptyText: "ไม่มี webhook" }}
                    rowClassName={(r) => (txnId === r.transactionId ? "ant-table-row-selected" : "")}
                  />
                </Card>
              </Col>

              <Col xs={24} lg={11}>
                <Card size="small" title={step(3, "จะแก้เป็นอะไร")} className="mb-3">
                  {showDiff ? (
                    <div style={{ border: `2px solid ${token.colorPrimary}`, background: token.colorPrimaryBg, borderRadius: 12, padding: "2px 12px" }}>
                      <Table columns={changeColumns} dataSource={ctx.expectedChanges} rowKey="field" size="small" pagination={false} showHeader={false} />
                    </div>
                  ) : noMatch ? (
                    <Row gutter={8}>
                      <Col span={12}>
                        <Input addonBefore="method" value={overrideMethod} onChange={(e) => setOverrideMethod(e.target.value)} placeholder="qrcode / creditcard" />
                      </Col>
                      <Col span={12}>
                        <InputNumber addonBefore="amount" style={{ width: "100%" }} value={overrideAmount} onChange={setOverrideAmount} placeholder="ยอดที่จ่ายจริง" />
                      </Col>
                    </Row>
                  ) : (
                    <Text type="secondary">
                      จะ settle เป็น <b>{settleMethod}</b> / <b>{money(settleAmount)}</b> (ระบบจะ match ยอดที่เลือกให้)
                    </Text>
                  )}
                </Card>

                <Card size="small" title={step(4, "ยืนยัน")}>
                  <Input.TextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เหตุผล / อ้างอิง (เก็บใน audit)" style={{ marginBottom: 12 }} />
                  <div style={{ marginBottom: 12 }}>
                    <Switch checked={sendEmail} onChange={setSendEmail} size="small" />{" "}
                    <Text style={{ fontSize: 13 }}>ส่งอีเมล payment success</Text>{" "}
                    <Text type="secondary" style={{ fontSize: 12 }}>(ปิดไว้ — เปิดเองถ้าตั้งใจ)</Text>
                  </div>
                  {doublePay && (
                    <div style={{ marginBottom: 12 }}>
                      <Checkbox checked={confirmDoublePay} onChange={(e) => setConfirmDoublePay(e.target.checked)}>
                        <Text type="danger">ยืนยันว่าตรวจเรื่องจ่ายซ้ำแล้ว</Text>
                      </Checkbox>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      จะ settle เป็น <b style={{ color: token.colorText }}>{settleMethod} / {money(settleAmount)}</b>
                    </Text>
                    <Button type="primary" icon={<CheckCircleOutlined />} disabled={!canPatch} onClick={() => setPatchOpen(true)}>
                      Mark as success
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )}

        <Modal
          title="ยืนยันการ patch"
          open={patchOpen}
          onCancel={() => setPatchOpen(false)}
          onOk={handlePatch}
          okText="ยืนยัน patch"
          cancelText="ยกเลิก"
          confirmLoading={resolveMut.isPending}
          okButtonProps={{ disabled: !canPatch }}
        >
          <p>
            ออเดอร์ <b style={{ fontFamily: "monospace" }}>{selected}</b> จะถูก settle เป็น <b>{settleMethod}</b> /{" "}
            <b>{money(settleAmount)}</b> และตั้งสถานะเป็น <Tag color="success">SUCCESS</Tag>
          </p>
          <p style={{ color: sendEmail ? token.colorWarning : token.colorTextTertiary }}>
            {sendEmail ? "⚠ จะส่งอีเมล payment success ให้ลูกค้าจริง" : "จะไม่ส่งอีเมล"}
          </p>
        </Modal>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card
        size="small"
        title="ออเดอร์ที่ต้องตรวจ (REVIEW)"
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => refetchList()} loading={loadingList} />}
      >
        <Table
          columns={listColumns}
          dataSource={reviews || []}
          rowKey="orderNo"
          size="small"
          loading={loadingList}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 720 }}
          locale={{ emptyText: "ไม่มีออเดอร์ค้าง REVIEW" }}
          onRow={(r) => ({ onClick: () => setSelected(r.orderNo), style: { cursor: "pointer" } })}
        />
      </Card>
    </div>
  );
};

export default PaymentMismatch;
