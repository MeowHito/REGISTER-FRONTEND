import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, HourglassOutlined, ReloadOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Spin, message, Result, Row, Divider } from 'antd';
import backOfficeServices from 'services/backoffice.services';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { SET_ORDER } from "store/reducers/contextSlice";

const { Text, Paragraph } = Typography;

function decode2c2pPayload(payload) {
    if (!payload) return null;

    if (payload.includes(".")) {
        try {
            const part = payload.split(".")[1];
            const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
            const pad = "=".repeat((4 - (b64.length % 4)) % 4);
            return JSON.parse(atob(b64 + pad));
        } catch {
            return null;
        }
    }

    try {
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

const RegistrationPaymentResult = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const verifyPaymentMutation = backOfficeServices.useMutationVerifyPayment();
    const order = useSelector(state => state.context.order) || {};

    const payload = useMemo(() => {
        const qs = new URLSearchParams(location.search);
        return qs.get("payload");
    }, [location.search]);

    const invoiceNo = useMemo(() => {
        const decoded = decode2c2pPayload(payload);
        if (decoded?.invoiceNo) return decoded.invoiceNo;
        const qs = new URLSearchParams(location.search);
        return qs.get("invoiceNo") ?? null;
    }, [payload, location.search]);

    const isDirectSuccess = !payload && !invoiceNo;
    const needs2c2pVerify = !isDirectSuccess;

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(needs2c2pVerify);

    const inquire = async () => {
        if (!invoiceNo) {
            message.warning(t("back.reg.payment.missingInvoiceNo"));
            return;
        }

        setLoading(true);
        try {
            const resolved2c2pType = order?.paymentType === 'ewallet' ? 'LINE_TRUEMONEY' : 'CREDIT_CARD';
            const res = await verifyPaymentMutation.mutateAsync({
                paymentType: resolved2c2pType,
                invoiceNo,
            });
            setResult(res);
        } catch (e) {
            setResult({
                status: "PENDING",
                settled: false,
                respCode: "",
                respDesc: e?.message || "Verify failed",
                error: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!needs2c2pVerify) return;

        if (!invoiceNo) {
            setResult({
                status: "PENDING",
                settled: false,
                respDesc: t("back.reg.payment.missingInvoiceNo"),
            });
            setLoading(false);
            return;
        }
        inquire();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceNo, needs2c2pVerify]);

    const status = String(result?.status || "").toUpperCase();
    const settled = result?.settled === true;

    const isSuccess = isDirectSuccess || (settled && status === "SUCCESS");
    const isPending = !isDirectSuccess && !settled && status === "PENDING";
    const isReview = !isSuccess && !isPending && status === "REVIEW";
    const isFailed = !isSuccess && !isPending && !isReview;

    const respDesc = result?.respDesc || "";

    const orderDetail = backOfficeServices.useQuerygetHistoryDetail({
        orderId: invoiceNo,
        enabled: needs2c2pVerify && !!invoiceNo,
    });

    useEffect(() => {
        if (!needs2c2pVerify) return;
        const raw = orderDetail?.data;
        if (!raw?.orderNo) return;

        const toNumber = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        };

        const applicants = (Array.isArray(raw.details) ? raw.details : []).map((d) => ({
            idNo: String(d?.idNo ?? "").trim(),
            deliveryMethod: d?.deliveryMethod || "pickup",
            price: toNumber(d?.price),
            discountNoShirt: toNumber(d?.discountShirt),
            shippingFee: toNumber(d?.shippingFee),
            couponApplied: !!d?.couponDiscount,
            personalCouponDiscount: toNumber(d?.couponDiscount),
        }));

        dispatch(
            SET_ORDER({
                orderNo: raw.orderNo,
                orderId: raw.uuid,
                eventId: raw.eventId,
                paymentDueDatetime: raw.paymentDueDatetime,
                paymentStatus: raw.status,
                paymentType: raw.paymentMethod,
                applicants,
            })
        );
    }, [orderDetail?.data?.orderNo, dispatch, needs2c2pVerify]);

    const successContent = (
        <Result
            status="success"
            icon={<CheckCircleOutlined />}
            title={t("back.reg.common.registrationSuccess")}
            subTitle={
                <div>
                    <div>{t("back.reg.common.registrationCompleted")}</div>
                    <div>{t("back.reg.common.pleaseCheckEmail")}</div>
                    <div>{t("back.reg.common.checkSpamIfNoEmail")}</div>
                    <div>
                        <span className="font-bold">{t("back.reg.common.spam")}</span>{" "}
                        {t("back.reg.common.or")}{" "}
                        <span className="font-bold">{t("back.reg.common.junkMail")}</span>
                    </div>
                </div>
            }
            extra={
                <>
                    <Button
                        type="primary"
                        size="large"
                        style={{ backgroundColor: "#FFB946", borderColor: "#FFB946" }}
                        onClick={() => navigate("/")}
                    >
                        {t("back.reg.common.backToHome")}
                    </Button>

                    <Divider />

                    <Text type="secondary" style={{ fontFamily: "inherit" }}>
                        {t("back.reg.common.contactUsIfQuestions")}{" "}
                        <a href="mailto:action.in.th@gmail.com">action.in.th@gmail.com</a>
                    </Text>
                </>
            }
        />
    );

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                padding: 16,
            }}
        >
            <Card
                style={{
                    width: "100%",
                    maxWidth: 600,
                    border: "1px solid #f0f0f0",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
            >
                {loading ? (
                    <Row justify="center" style={{ marginBottom: 24 }}>
                        <Spin size="large" />
                        <div style={{ width: "100%", textAlign: "center", marginTop: 12 }}>
                            <Paragraph style={{ margin: 0, color: "#555" }}>
                                {t("back.reg.payment.checkingPaymentStatus")}
                            </Paragraph>
                        </div>
                    </Row>
                ) : (
                    <>
                        {isSuccess && successContent}

                        {isPending && (
                            <Result
                                status="info"
                                icon={<HourglassOutlined style={{ color: "#5e81d8ff" }} />}
                                title={t("back.reg.payment.processingPayment")}
                                subTitle={
                                    <div style={{ whiteSpace: "pre-line" }}>
                                        <div style={{ marginTop: 8 }}>
                                            <Text type="secondary">
                                                {t("back.reg.payment.orderNo")}: <strong>{invoiceNo}</strong>
                                            </Text>
                                        </div>
                                        {!!respDesc && (
                                            <div style={{ marginTop: 8 }}>
                                                <Text type="secondary">
                                                    ({respDesc})
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                }
                                extra={
                                    <Button
                                        icon={<ReloadOutlined />}
                                        size="large"
                                        onClick={inquire}
                                    >
                                        {t("back.reg.payment.checkAgain")}
                                    </Button>
                                }
                            />
                        )}

                        {isReview && (
                            <Result
                                status="warning"
                                icon={<ExclamationCircleOutlined style={{ color: "#fa8c16" }} />}
                                title={t("back.reg.payment.orderUnderReview")}
                                subTitle={
                                    <div style={{ whiteSpace: "pre-line" }}>
                                        <div>{t("back.reg.payment.orderUnderReviewDesc")}</div>
                                        <div style={{ marginTop: 8 }}>
                                            <Text type="secondary">
                                                {t("back.reg.payment.orderNo")}: <strong>{invoiceNo}</strong>
                                            </Text>
                                        </div>
                                    </div>
                                }
                                extra={
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => navigate("/")}
                                    >
                                        {t("back.reg.common.backToHome")}
                                    </Button>
                                }
                            />
                        )}

                        {isFailed && (
                            <Result
                                status="warning"
                                icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                                title={t("back.reg.payment.paymentNotFoundOrFailed")}
                                subTitle={
                                    <div style={{ whiteSpace: "pre-line" }}>
                                        <div style={{ marginTop: 8 }}>
                                            <Text type="secondary" style={{ fontFamily: "inherit" }}>
                                                {t("back.reg.payment.orderNo")}: <strong>{invoiceNo}</strong>
                                            </Text>
                                        </div>
                                        {!!respDesc && (
                                            <div style={{ marginTop: 8 }}>
                                                <Text type="secondary">
                                                    ({respDesc})
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                }
                                extra={
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => navigate("/registrationPayment")}
                                    >
                                        {t("back.reg.payment.backToPayment")}
                                    </Button>
                                }
                            />
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}

export default RegistrationPaymentResult;
