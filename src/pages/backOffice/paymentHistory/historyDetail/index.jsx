import React, { useEffect, useState } from "react";
import {
  Typography, Tag, Button, Alert, message, Spin, Result, Tabs,
  Card, Collapse, Avatar, Divider,
  Space, Modal, Form, Input,
} from "antd";
import { QuestionCircleOutlined, PaperClipOutlined, LeftOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import backOfficeServices from "services/backoffice.services";
import { handleQueryStatus } from "utils/index";
import { useTranslation } from "react-i18next";
import { SYS_DATE_FORMAT, SYS_DATE_TIME_FORMAT } from "constants/helper";
import { buildAgeGroupLabel, buildAgeLabelFromAge } from "utils/ageGroup";
import { onUploadFile } from "hooks/onUploadFile";
import EmailLogTab from "./EmailLogTab";
import useMe from "hooks/useMe";
import { COLOR } from "constants/color";
import { getPublicUrl } from "utils/fileUtils";
import useUploadFileHook from "hooks/useUploadFileHook";
import SingleFileUploadField from "components/singleFileUploadField";

const { Title, Text } = Typography;

/** Reusable field cell: label on top, value below */
const Field = ({ label, children, span = 1 }) => (
  <div className={span === 2 ? "col-span-2 sm:col-span-2" : ""}>
    <Text type="secondary" className="text-xs! block mb-0.5">{label}</Text>
    <div className="text-sm">{children || "-"}</div>
  </div>
);

/** Section header inside the applicant detail */
const SectionLabel = ({ children }) => (
  <div className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3 mt-1">
    {children}
  </div>
);

const ApplicantDetail = ({ applicant: a }) => {
  const { t } = useTranslation();
  const subtotal = a.subtotal ?? 0;
  const homeAddr = [a.address, a.district, a.amphoe, a.province, a.zipcode]
    .filter(Boolean).join(", ");
  const shippingAddr = [
    a.shippingAddress, a.shippingDistrict, a.shippingAmphoe, a.shippingProvince, a.shippingZipcode,
  ].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* ข้อมูลส่วนตัว */}
      <div>
        <SectionLabel>{t("back.history.historyDetail.section.personal")}</SectionLabel>
        <div className="flex gap-4">
          {a.pictureUrl && (
            <Avatar
              src={`${a.prefixPath}${a.pictureUrl}`}
              size={72}
              shape="square"
              className="shrink-0 rounded-lg"
            />
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 flex-1">
            <Field label={t("back.history.historyDetail.field.nameTh")}>
              {a.firstName} {a.lastName}
            </Field>
            {(a.firstNameEn || a.lastNameEn) && (
              <Field label={t("back.history.historyDetail.field.nameEn")}>
                {a.firstNameEn} {a.lastNameEn}
              </Field>
            )}
            {a.gender && (
              <Field label={t("back.history.historyDetail.field.gender")}>
                {a.gender === "male" ? t("general.male") : a.gender === "female" ? t("general.female") : a.gender}
              </Field>
            )}
            {a.birthDate && (
              <Field label={t("back.history.historyDetail.field.birthDate")}>
                {dayjs(a.birthDate).format(SYS_DATE_FORMAT)}
              </Field>
            )}
            {a.age != null && (
              <Field label={t("back.history.historyDetail.field.age")}>
                {buildAgeLabelFromAge(a.age, t)}
              </Field>
            )}
            {a.nationality && (
              <Field label={t("back.history.historyDetail.field.nationality")}>
                {a.nationality}
              </Field>
            )}
            {a.idNo && (
              <Field label={t("back.history.historyDetail.field.idNo")}>
                {a.idNo}
              </Field>
            )}
          </div>
        </div>
      </div>

      {/* ข้อมูลติดต่อ */}
      {(a.email || a.phone || homeAddr) && (
        <div>
          <SectionLabel>{t("back.history.historyDetail.section.contact")}</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            {a.email && (
              <Field label={t("back.history.historyDetail.field.email")}>{a.email}</Field>
            )}
            {a.phone && (
              <Field label={t("back.history.historyDetail.field.phone")}>{a.phone}</Field>
            )}
            {homeAddr && (
              <Field label={t("back.history.historyDetail.field.address")} span={2}>{homeAddr}</Field>
            )}
          </div>
        </div>
      )}

      {/* สุขภาพและผู้ติดต่อฉุกเฉิน */}
      {(a.bloodType || a.healthIssues || a.emergencyContact) && (
        <div>
          <SectionLabel>{t("back.history.historyDetail.section.health")}</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            {a.bloodType && (
              <Field label={t("back.history.historyDetail.field.bloodType")}>
                <Tag className="m-0!">{a.bloodType}</Tag>
              </Field>
            )}
            {a.healthIssues && (
              <Field label={t("back.history.historyDetail.field.healthIssues")} span={2}>{a.healthIssues}</Field>
            )}
            {a.emergencyContact && (
              <Field label={t("back.history.historyDetail.field.emergencyContact")}>{a.emergencyContact}</Field>
            )}
            {a.emergencyRelation && (
              <Field label={t("back.history.historyDetail.field.emergencyRelation")}>{a.emergencyRelation}</Field>
            )}
            {a.emergencyPhone && (
              <Field label={t("back.history.historyDetail.field.emergencyPhone")}>{a.emergencyPhone}</Field>
            )}
          </div>
        </div>
      )}

      {/* ข้อมูลการแข่งขัน */}
      <div>
        <SectionLabel>{t("back.history.historyDetail.section.event")}</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
          <Field label={t("back.history.historyDetail.breakdown.field.type")}>{a.eventTypeName}</Field>
          <Field label={t("back.history.historyDetail.breakdown.field.ageGroup")}>
            {a.ageGroupName ? buildAgeGroupLabel(a.ageGroupName, t) : "-"}
          </Field>
          <Field label={t("back.history.historyDetail.breakdown.field.bibNo")}>{a.bibNo || "-"}</Field>
          <Field label={t("back.history.historyDetail.breakdown.field.teamClub")}>{a.teamClub || "-"}</Field>
        </div>
      </div>

      {/* คำถามเพิ่มเติม (Dynamic Q&A) */}
      {Array.isArray(a.selectionAnswers) && a.selectionAnswers.length > 0 && (
        <div>
          <SectionLabel>{t("back.history.historyDetail.section.selectionAnswers")}</SectionLabel>
          <div className="flex flex-col gap-3">
            {a.selectionAnswers.map((entry, idx) => {
              const question = entry.question?.value || entry.question?.valueEn || "-";
              let answer;
              if (Array.isArray(entry.value)) {
                answer = (
                  <div className="flex flex-wrap gap-1">
                    {entry.value.map((v, vi) => {
                      const label = v.value || v.valueEn || "-";
                      return (
                        <span key={vi} className="flex items-center gap-1">
                          <Tag className="m-0!">{label}</Tag>
                          {v.freeTextValue && (
                            <Text className="text-gray-500! text-sm!">{v.freeTextValue}</Text>
                          )}
                        </span>
                      );
                    })}
                  </div>
                );
              } else if (entry.value) {
                const label = entry.value.value || entry.value.valueEn || "-";
                answer = (
                  <span className="flex items-center gap-1">
                    <Tag className="m-0!">{label}</Tag>
                    {entry.value.freeTextValue && (
                      <Text className="text-gray-500! text-sm!">{entry.value.freeTextValue}</Text>
                    )}
                  </span>
                );
              } else {
                answer = "-";
              }
              return (
                <Field key={idx} label={question}>{answer}</Field>
              );
            })}
          </div>
        </div>
      )}

      {/* เสื้อและการจัดส่ง */}
      <div>
        <SectionLabel>{t("back.history.historyDetail.section.shirt")}</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
          <Field label={t("back.history.historyDetail.breakdown.field.shirt")}>
            {a.noShirt
              ? t("back.history.historyDetail.breakdown.shirtNone")
              : `${a.shirtTypeName} / ${a.shirtSizeName}`}
          </Field>
          <Field label={t("back.history.historyDetail.breakdown.field.delivery")}>
            <Tag color={a.deliveryMethod === "post" ? "blue" : "green"} className="m-0!">
              {t(a.deliveryMethod === "post"
                ? "back.history.historyDetail.breakdown.delivery.post"
                : "back.history.historyDetail.breakdown.delivery.onsite")}
            </Tag>
          </Field>
          {a.deliveryMethod === "post" && shippingAddr && (
            <Field label={t("back.history.historyDetail.field.shippingAddress")} span={2}>{shippingAddr}</Field>
          )}
        </div>
      </div>

      {/* สรุปค่าใช้จ่าย */}
      <div>
        <SectionLabel>{t("back.history.historyDetail.section.pricing")}</SectionLabel>
        <div className="flex justify-end">
          <div className="w-72 bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex justify-between py-1">
              <Text type="secondary">{t("back.history.historyDetail.breakdown.fee.registration")}</Text>
              <Text>{(a.price ?? 0).toLocaleString("th-TH")} {t("general.unitBaht")}</Text>
            </div>
            {(a.discount ?? 0) > 0 && (
              <div className="flex justify-between py-1">
                <Text type="secondary">{t("back.history.historyDetail.breakdown.fee.discount")}</Text>
                <Text type="success">-{(a.discount ?? 0).toLocaleString("th-TH")} {t("general.unitBaht")}</Text>
              </div>
            )}
            {a.deliveryMethod === "post" && (
              <div className="flex justify-between py-1">
                <Text type="secondary">{t("back.history.historyDetail.breakdown.fee.shipping")}</Text>
                <Text>{(a.shippingFee ?? 0).toLocaleString("th-TH")} {t("general.unitBaht")}</Text>
              </div>
            )}
            <Divider className="my-1.5!" />
            <div className="flex justify-between py-1">
              <Text strong>{t("back.history.historyDetail.breakdown.fee.total")}</Text>
              <Text strong className="text-base!" style={{ color: COLOR.primary }}>
                {subtotal.toLocaleString("th-TH")} {t("general.unitBaht")}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicantCollapseHeader = ({ applicant: a, index }) => {
  const { t } = useTranslation();
  const subtotal = a.subtotal ?? 0;
  return (
    <div className="flex items-center gap-3 w-full flex-wrap">
      <Avatar
        src={a.pictureUrl ? `${a.prefixPath}${a.pictureUrl}` : undefined}
        icon={a.pictureUrl ? undefined : <UserOutlined />}
        size={40}
      />
      <div className="flex-1 min-w-0">
        <Text strong>
          {t("back.history.historyDetail.applicantNo", { number: index + 1 })}: {a.firstName} {a.lastName}
        </Text>
        {a.isSelf === false && (
          <Tag color="blue" className="ml-2">{t("back.history.historyDetail.friend")}</Tag>
        )}
      </div>
      <Text className="text-gray-500">BIB: {a.bibNo || "-"}</Text>
      <Tag>{a.eventTypeName}</Tag>
      <Text strong>{subtotal.toLocaleString("th-TH")} {t("general.unitBaht")}</Text>
    </div>
  );
};

const statusColors = {
  PENDING: { color: "#faad14", label: "รอดำเนินการ" },
  CANCELLED: { color: "#ff4d4f", label: "ยกเลิกโดยผู้ใช้" },
  FAILED: { color: "#ff4d4f", label: "ล้มเหลว" },
  SUCCESS: { color: "#52c41a", label: "ดำเนินการสำเร็จ" },
  REVIEW: { color: "#fa8c16", label: "รอตรวจสอบ" },
};

const helpStatusColor = (status) => {
  const map = { NEW: "blue", PENDING: "orange", SOLVED: "green", CANCELLED: "red" };
  return map[status] || "default";
};

const HistoryDetail = ({ paymentId, setMode }) => {
  const { t } = useTranslation();
  const [order, setOrder] = useState(null);
  const [remainingTime, setRemainingTime] = useState("");
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpForm] = Form.useForm();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const isAdmin = me?.role?.roleType === "admin";
  const isUser = me?.role?.roleType === "guest";
  const { data: paymentDetail, isFetching, ...other } = backOfficeServices.useQuerygetHistoryDetail({
    orderId: paymentId
  });

  const [paymentLink, setPaymentLink] = useState("");

  useEffect(() => {
    handleQueryStatus(other, () => {
      const data = paymentDetail?.data || paymentDetail;

      const createdTime = dayjs(data.createdTime);
      const formattedDate = createdTime.format(SYS_DATE_TIME_FORMAT);

      const total =
        data.details?.reduce(
          (sum, item) => sum + ((item.qty || 1) * (item.netPrice || 0)),
          0
        ) || 0;

      const token = data?.paymentToken || "";
      setPaymentLink(
        token ? `${globalThis.location.origin}/registrationLink?token=${token}` : ""
      );

      setOrder({
        orderNo: data.orderNo,
        date: formattedDate,
        status: data.status,
        due: data.paymentDueDatetime
          ? dayjs(data.paymentDueDatetime).toISOString()
          : createdTime.add(3, "day").toISOString(),
        total: total.toLocaleString(),
        eventId: data.eventId,
        eventLink: data.eventLink,
        eventName: data.eventName,
        eventDate: data.eventDate,
        ownerUuid: data.ownerUuid || null,
        uuid: data.uuid || null,
        reviewReason: data.reviewReason || null,
        applicants: (data.details || []).map((d, idx) => ({
          key: d.id || idx,
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          firstNameEn: d.firstNameEn || "",
          lastNameEn: d.lastNameEn || "",
          gender: d.gender || "",
          birthDate: d.birthDate || "",
          pictureUrl: d.pictureUrl || "",
          prefixPath: d.prefixPath || "",
          nationality: d.nationality || "",
          idNo: d.idNo || "",
          age: d.age ?? null,
          isSelf: d.isSelf ?? true,
          email: d.email || "",
          phone: d.phone || "",
          address: d.address || "",
          province: d.province || "",
          amphoe: d.amphoe || "",
          district: d.district || "",
          zipcode: d.zipcode || "",
          bloodType: d.bloodType || "",
          healthIssues: d.healthIssues || "",
          emergencyContact: d.emergencyContact || "",
          emergencyRelation: d.emergencyRelation || "",
          emergencyPhone: d.emergencyPhone || "",
          eventTypeName: d.eventTypeName || d.pricingName || "-",
          ageGroupName: d.ageGroupName || "",
          bibNo: d.bibNo || "",
          teamClub: d.teamClub || "",
          noShirt: d.receiveShirt === false,
          shirtTypeName: d.shirtTypeName || "-",
          shirtSizeName: d.shirtSizeName || "-",
          deliveryMethod: d.deliveryMethod || "onsite",
          shippingAddress: d.shippingAddress || "",
          shippingProvince: d.shippingProvince || "",
          shippingAmphoe: d.shippingAmphoe || "",
          shippingDistrict: d.shippingDistrict || "",
          shippingZipcode: d.shippingZipcode || "",
          selectionAnswers: d.selectionAnswers || [],
          price: d.price ?? 0,
          discount: (d.couponDiscount ?? 0) + (d.discountShirt ?? 0),
          shippingFee: d.shippingFee ?? 0,
          subtotal:
            (d.price ?? 0) -
            ((d.couponDiscount ?? 0) + (d.discountShirt ?? 0)) +
            (d.deliveryMethod === "post" ? (d.shippingFee ?? 0) : 0),
        })),
      });
    });
  }, [other.fetchStatus]);


  useEffect(() => {
    if (!order) return;
    const interval = setInterval(() => {
      const now = dayjs();
      const dueTime = dayjs(order.due);
      const diff = dueTime.diff(now);

      if (diff <= 0) {
        setRemainingTime({ expired: true });
        clearInterval(interval);
      } else {
        const hours = dueTime.diff(now, "hour");
        const minutes = dueTime.subtract(hours, "hour").diff(now, "minute");
        setRemainingTime({ hours, minutes, expired: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);


  const cancelOrderMutation = backOfficeServices.useMutationCancelOrder();
  const helpMutation = backOfficeServices.useMutationCreateHelpRequest();
  const { data: existingHelps } = backOfficeServices.useQueryGetHelpRequestsByOrder({
    orderUuid: order?.uuid || paymentId,
    enabled: helpModalOpen,
  });
  const {
    fileList: helpFileList,
    setFileList: setHelpFileList,
    handlePreview: handleHelpPreview,
    handleChange: handleHelpChange,
  } = useUploadFileHook();
  const [helpSubmitting, setHelpSubmitting] = useState(false);

  const onCancelOrder = () => {
    cancelOrderMutation.mutate(
      { orderId: paymentId, cancelledBy: "USER" },
      {
        onSuccess: () => {
          message.success(t("back.history.historyDetail.cancel.success"));
          setOrder((prev) => ({ ...prev, status: "CANCELLED" }));
          navigate("/backoffice/historyList");
        },
        onError: () => {
          message.error(t("back.history.historyDetail.cancel.failed"));
        }
      }
    );
  };

  const normalized = order?.status?.toUpperCase();
  const { color } = statusColors[normalized] || { color: "blue" };
  const label = t(`back.history.historyDetail.status.${normalized}`) || order?.status;
  const isPending = normalized === "PENDING";
  const isReview = normalized === "REVIEW";

  const totals = (order?.applicants || []).reduce(
    (acc, a) => {
      acc.registration += a.price ?? 0;
      acc.discount += a.discount ?? 0;
      acc.shipping += a.deliveryMethod === "post" ? (a.shippingFee ?? 0) : 0;
      return acc;
    },
    { registration: 0, discount: 0, shipping: 0 }
  );
  const grandTotal = totals.registration - totals.discount + totals.shipping;

  return (
    <Spin className="block mt-24" spinning={isFetching}>
      {order ? (
        <>
          {/* Back Button */}
          <div className="mb-4">
            <Button type="link" className="p-0!" onClick={() => { setMode("list") }}>
              <LeftOutlined className="me-2" />
              {t("general.back")}
            </Button>
          </div>

          {/* Page Header Card */}
          <Card className="mb-4!" styles={{ body: { padding: "16px 24px" } }}>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <Title level={4} className="mb-1!">{t("back.history.historyDetail.title")}</Title>
                <Space size="small">
                  <Text type="secondary">{t("back.history.historyDetail.orderNo")}: <Text strong>{order.orderNo}</Text></Text>
                  <Text type="secondary">|</Text>
                  <Text type="secondary">{t("back.history.historyDetail.date")}: {order.date}</Text>
                </Space>
              </div>
              <Tag
                color={color}
                className="text-sm! font-semibold! px-4! py-1! rounded-full! m-0!"
              >
                {label}
              </Tag>
              {isUser && (
                <Button
                  icon={<QuestionCircleOutlined />}
                  onClick={() => setHelpModalOpen(true)}
                >
                  {t("back.history.historyDetail.help.button")}
                </Button>
              )}
            </div>
          </Card>

          {/* Payment Deadline Alert */}
          {isPending && (
            <Alert
              className="mb-4"
              type="warning"
              showIcon
              banner
              message={
                <div className="flex items-center gap-3 flex-wrap">
                  <Text strong>{t("back.history.historyDetail.payBefore")}</Text>
                  <Text strong className="text-red-600! text-base!">
                    {dayjs(order.due).format(SYS_DATE_TIME_FORMAT)}
                  </Text>
                  <Tag color="orange">
                    {remainingTime?.expired
                      ? t("back.history.historyDetail.remain.expired")
                      : t("back.history.historyDetail.remain.time", {
                        hours: remainingTime.hours,
                        minutes: remainingTime.minutes,
                      })}
                  </Tag>
                </div>
              }
            />
          )}

          {/* Review Status Alert */}
          {isReview && (
            <Alert
              className="mb-4"
              type="warning"
              showIcon
              banner
              message={
                <div>
                  <Text strong>{t("back.history.historyDetail.reviewReason.title")}</Text>
                  {order.reviewReason && (
                    <Text className="ml-2">
                      {t(`back.history.historyDetail.reviewReason.${order.reviewReason}`)}
                    </Text>
                  )}
                  <div className="mt-1">
                    <Text type="secondary">{t("back.history.historyDetail.reviewReason.description")}</Text>
                  </div>
                </div>
              }
            />
          )}

          {/* Order Info Card */}
          <Card className="mb-4!" title={t("back.history.historyDetail.orderInfoTitle") || t("back.history.historyDetail.title")}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
              <Field label={t("back.history.historyDetail.orderNo")}>
                <Text strong>{order.orderNo}</Text>
              </Field>
              <Field label={t("back.history.historyDetail.status.title")}>
                <Tag color={color} className="rounded-full! font-semibold! m-0!">{label}</Tag>
              </Field>
              <Field label={t("back.history.historyDetail.eventName")}>
                <Link to={`${globalThis.location.protocol}//${globalThis.location.host}/eventDetail/${order.eventLink || order.eventId}`}>
                  <Text className="text-blue-600! hover:text-blue-400!">{order.eventName}</Text>
                </Link>
              </Field>
              <Field label={t("back.history.historyDetail.eventDate")}>
                {order.eventDate ? dayjs(order.eventDate).format(SYS_DATE_FORMAT) : "-"}
              </Field>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs
            defaultActiveKey="order"
            items={[
              {
                key: "order",
                label: t("back.history.emailLog.tabs.orderInfo"),
                children: (
                  <>
                    {/* Applicant Collapse */}
                    <Collapse
                      className="mb-4"
                      defaultActiveKey={["0"]}
                      items={order.applicants.map((a, idx) => ({
                        key: String(idx),
                        label: <ApplicantCollapseHeader applicant={a} index={idx} />,
                        children: <ApplicantDetail applicant={a} />,
                      }))}
                    />

                    {/* Order Summary Card */}
                    <Card className="mb-4!">
                      <div className="flex justify-end">
                        <div className="w-80 bg-gray-50 rounded-lg px-5 py-4">
                          <div className="flex justify-between py-1.5">
                            <Text type="secondary">{t("back.history.historyDetail.summary.count")}</Text>
                            <Text>{order.applicants.length} {t("general.unitPerson") || "คน"}</Text>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <Text type="secondary">{t("back.history.historyDetail.breakdown.fee.registration")}</Text>
                            <Text>{totals.registration.toLocaleString("th-TH")} {t("general.unitBaht")}</Text>
                          </div>
                          {totals.discount > 0 && (
                            <div className="flex justify-between py-1.5">
                              <Text type="secondary">{t("back.history.historyDetail.breakdown.fee.discount")}</Text>
                              <Text type="success">-{totals.discount.toLocaleString("th-TH")} {t("general.unitBaht")}</Text>
                            </div>
                          )}
                          {totals.shipping > 0 && (
                            <div className="flex justify-between py-1.5">
                              <Text type="secondary">{t("back.history.historyDetail.breakdown.fee.shipping")}</Text>
                              <Text>{totals.shipping.toLocaleString("th-TH")} {t("general.unitBaht")}</Text>
                            </div>
                          )}
                          <Divider className="my-2!" />
                          <div className="flex justify-between py-1.5">
                            <Text strong className="text-base!">{t("back.history.historyDetail.summary.grandTotal")}</Text>
                            <Text strong className="text-lg!" style={{ color: COLOR.primary }}>
                              {grandTotal.toLocaleString("th-TH")} {t("general.unitBaht")}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Action Bar */}
                    {isPending && me?.id === order.ownerUuid && (
                      <div className="flex justify-end gap-3 mb-8">
                        <Button
                          size="large"
                          danger
                          onClick={onCancelOrder}
                          loading={cancelOrderMutation.isPending}
                        >
                          {t("back.history.historyDetail.actions.cancel")}
                        </Button>
                        <Link to={paymentLink}>
                          <Button
                            type="primary"
                            size="large"
                            loading={cancelOrderMutation.isPending}
                          >
                            {t("back.history.historyDetail.payment")} →
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                ),
              },
              ...(isAdmin ? [{
                key: "emailLog",
                label: t("back.history.emailLog.tabs.emailLog"),
                children: <EmailLogTab orderId={paymentId} />,
              }] : []),
            ]}
          />
        </>
      ) : (
        !isFetching && (
          <Result
            status="404"
            title={t("back.history.historyDetail.empty.title")}
            subTitle={t("back.history.historyDetail.empty.subTitle")}
            extra={
              <Button type="primary" onClick={() => { setMode("list") }}>{t("back.history.historyDetail.empty.backBtn")}</Button>
            }
          />
        )
      )}

      {/* Help Request Modal */}
      <Modal
        open={helpModalOpen}
        title={
          <Space>
            <QuestionCircleOutlined />
            {t("back.history.historyDetail.help.modalTitle")}
          </Space>
        }
        onCancel={() => { setHelpModalOpen(false); helpForm.resetFields(); setHelpFileList([]); }}
        footer={null}
        destroyOnHidden
        width={560}
      >
        {/* Existing help requests */}
        {Array.isArray(existingHelps) && existingHelps.length > 0 && (
          <div className="mb-4">
            <div className="font-semibold mb-2">{t("back.history.historyDetail.help.previousRequests")}</div>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {existingHelps.map((h) => (
                <Card key={h.uuid} size="small" className="bg-gray-50!">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div className="flex-1 text-sm text-gray-600">{h.message}</div>
                    <Tag color={helpStatusColor(h.status)}>{t(`back.history.historyDetail.help.status.${h.status}`) || h.status}</Tag>
                  </div>
                  {h.attachmentUrl && (
                    <div className="mt-1">
                      <a
                        className="text-xs text-blue-500 flex items-center gap-1 cursor-pointer"
                        onClick={async () => {
                          try {
                            const url = await getPublicUrl({ key: h.attachmentUrl, prefix: "help-request" });
                            if (url) window.open(url, "_blank", "noopener,noreferrer");
                          } catch {
                            message.error(t("general.error"));
                          }
                        }}
                      >
                        <PaperClipOutlined /> {t("back.history.historyDetail.help.viewAttachment")}
                      </a>
                    </div>
                  )}
                  {h.adminNote && (
                    <div className="mt-1 text-xs text-gray-500">
                      {t("back.history.historyDetail.help.adminNote")}: {h.adminNote}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-gray-400">
                    {h.createdTime ? dayjs(h.createdTime).format(SYS_DATE_TIME_FORMAT) : ""}
                  </div>
                </Card>
              ))}
            </div>
            <Divider />
          </div>
        )}

        <Form
          form={helpForm}
          layout="vertical"
          onFinish={async (values) => {
            setHelpSubmitting(true);
            try {
              let attachmentUrl = null;
              if (helpFileList.length > 0) {
                attachmentUrl = await onUploadFile({
                  prefix: "help-request",
                  fileList: helpFileList,
                  showProgress: true,
                });
                if (!attachmentUrl) {
                  setHelpSubmitting(false);
                  return;
                }
              }
              helpMutation.mutate(
                { orderUuid: order?.uuid || paymentId, message: values.message, attachmentUrl },
                {
                  onSuccess: () => {
                    message.success(t("back.history.historyDetail.help.success"));
                    setHelpModalOpen(false);
                    helpForm.resetFields();
                    setHelpFileList([]);
                    setHelpSubmitting(false);
                  },
                  onError: () => {
                    message.error(t("back.history.historyDetail.help.error"));
                    setHelpSubmitting(false);
                  },
                }
              );
            } catch {
              setHelpSubmitting(false);
            }
          }}
        >
          <Form.Item
            name="message"
            label={t("back.history.historyDetail.help.messageLabel")}
            rules={[{ required: true, message: t("back.history.historyDetail.help.messageRequired") }]}
          >
            <Input.TextArea
              rows={4}
              placeholder={t("back.history.historyDetail.help.messagePlaceholder")}
              maxLength={1000}
              showCount
            />
          </Form.Item>
          <Form.Item
            label={t("back.history.historyDetail.help.attachmentLabel")}
          >
            <SingleFileUploadField
              fileList={helpFileList}
              handlePreview={handleHelpPreview}
              handleChange={handleHelpChange}
              onDelete={() => setHelpFileList([])}
              label={t("back.history.historyDetail.help.attachFile")}
            />
            <div className="text-xs text-gray-400 mt-1">
              {t("back.history.historyDetail.help.attachHint")}
            </div>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setHelpModalOpen(false); helpForm.resetFields(); setHelpFileList([]); }}>
              {t("general.cancel")}
            </Button>
            <Button type="primary" htmlType="submit" loading={helpSubmitting || helpMutation.isPending}>
              {t("back.history.historyDetail.help.submit")}
            </Button>
          </div>
        </Form>
      </Modal>
    </Spin>
  );
};

export default HistoryDetail;
