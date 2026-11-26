import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightOutlined, CheckOutlined, CloseCircleOutlined, ExclamationCircleOutlined, HomeOutlined, HourglassOutlined, MailOutlined, ReloadOutlined } from '@ant-design/icons';
import CopyButton from 'components/copyButton';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Spin, message, Result, Row } from 'antd';
import backOfficeServices from 'services/backoffice.services';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { SET_ORDER } from "store/reducers/contextSlice";

const { Text, Paragraph } = Typography;

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 10;

const SCB_PAYMENT_METHODS = new Set(["qrcode", "alipay", "wechatpay"]);

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

// Full-width buttons shared by every state, matching the success card (Stitch #15).
const PrimaryAction = ({ children, ...rest }) => (
    <button
        type="button"
        {...rest}
        className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-base shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
    >
        {children}
    </button>
);
const SecondaryAction = ({ children, loading, ...rest }) => (
    <button
        type="button"
        disabled={loading}
        {...rest}
        className="w-full py-3 px-6 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-sm border border-slate-200 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
    >
        {children}
    </button>
);

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

    // Set by the backend when mPAY sends the runner back through its "fail/cancel" URL. Only
    // changes the wording; the status itself still comes from the order and the enquiry.
    const mpayReturnedFail = useMemo(
        () => new URLSearchParams(location.search).get("mpay") === "fail",
        [location.search]
    );

    const isDirectSuccess = !payload && !invoiceNo;
    const needs2c2pVerify = !isDirectSuccess;

    // Free and test-mode orders come straight here without an invoiceNo; look them up by the
    // order kept in the store so the page can still show the order number and e-mail address.
    const orderDetail = backOfficeServices.useQuerygetHistoryDetail({ orderId: invoiceNo || order?.orderNo || null });
    const { data: paymentOptions, isLoading: isLoadingPaymentOptions } = backOfficeServices.useQueryPaymentOptions();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(needs2c2pVerify);
    const [pollCount, setPollCount] = useState(0);

    const orderResolved = !orderDetail.isLoading && !isLoadingPaymentOptions;
    const paymentMethod = orderDetail?.data?.paymentMethod || order?.paymentType || null;
    // mPAY serves every method (QR included) once it is switched on; the backend falls back to
    // "not found" for an order that never went through it.
    const isMPayOrder = paymentMethod !== "test"
        && (order?.paymentProvider === "MPAY" || paymentOptions?.provider === "MPAY");
    // SCB orders are settled by webhook and test-mode orders never touch a
    // gateway, so neither should be verified against 2C2P.
    const isScbOrder = !isMPayOrder && (SCB_PAYMENT_METHODS.has(paymentMethod) || paymentMethod === "test");

    const inquire = async ({ silent = false } = {}) => {
        if (!invoiceNo) {
            message.warning(t("back.reg.payment.missingInvoiceNo"));
            return;
        }

        if (isScbOrder) {
            if (!silent) setLoading(false);
            return;
        }

        if (!silent) setLoading(true);
        try {
            const resolved2c2pType = paymentMethod === 'ewallet' ? 'LINE_TRUEMONEY' : 'CREDIT_CARD';
            const res = await verifyPaymentMutation.mutateAsync(isMPayOrder
                ? { paymentType: 'MPAY', orderNo: invoiceNo }
                : { paymentType: resolved2c2pType, invoiceNo });
            setResult(res);
        } catch (e) {
            setResult((prev) => prev || {
                status: "PENDING",
                settled: false,
                respCode: "",
                respDesc: e?.message || "Verify failed",
                error: true,
            });
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const refresh = () => {
        orderDetail.refetch?.();
        inquire();
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

        if (!orderResolved) return;

        if (isScbOrder) {
            setLoading(false);
            return;
        }

        inquire();
    }, [invoiceNo, needs2c2pVerify, orderResolved, isScbOrder, isMPayOrder]);

    const dbStatus = String(orderDetail?.data?.status || "").toUpperCase();
    const inqStatus = String(result?.status || "").toUpperCase();
    const inqSettled = result?.settled === true;

    const isSuccess = isDirectSuccess || dbStatus === "SUCCESS" || (inqSettled && inqStatus === "SUCCESS");
    const isReview = !isSuccess && (dbStatus === "REVIEW" || inqStatus === "REVIEW");
    const isFailed = !isSuccess && !isReview && (dbStatus === "FAILED" || dbStatus === "CANCELLED");
    const isPending = !isSuccess && !isReview && !isFailed;

    const respDesc = result?.respDesc || "";

    const showSpinner = loading || (needs2c2pVerify && !orderResolved);

    useEffect(() => {
        if (!needs2c2pVerify) return;
        if (!isPending) return;
        if (pollCount >= MAX_POLLS) return;
        const id = setTimeout(() => {
            orderDetail.refetch?.();
            inquire({ silent: true });
            setPollCount((c) => c + 1);
        }, POLL_INTERVAL_MS);
        return () => clearTimeout(id);
    }, [needs2c2pVerify, isPending, pollCount]);

    const orderData = orderDetail?.data;
    const shownOrderNo = orderData?.orderNo || invoiceNo || order?.orderNo;
    const myOrderLink = orderData?.uuid ? `/historyList?order=${orderData.uuid}` : "/historyList";

    useEffect(() => {
        if (!needs2c2pVerify) return;
        const raw = orderData;
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
        // Re-run on a status change too: the first data can be a cached PENDING copy, and a stale
        // PENDING in the persisted order would send the next registration back to this order.
    }, [orderData?.orderNo, orderData?.status, dispatch, needs2c2pVerify]);

    // Layout follows the Stitch "ลงทะเบียนสำเร็จ (Redesign)" screen (tester deck #15).
    const successContent = (
        <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-emerald-100/70 animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-white shadow-[0_8px_24px_-6px_rgba(16,185,129,0.55)]">
                    <CheckOutlined className="text-[28px]" />
                </div>
            </div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight mb-1.5">
                {t("back.reg.common.registrationSuccess")}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-6">
                {t("back.reg.common.registrationCompleted")}
            </p>

            {shownOrderNo && (
                <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 mb-5">
                    <div className="text-[12px] font-medium text-slate-500 tracking-wider mb-1">
                        {t("back.reg.payment.orderNo")}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-base sm:text-lg font-bold tracking-tight text-slate-900">
                            {shownOrderNo}
                        </span>
                        <CopyButton text={shownOrderNo} />
                    </div>
                </div>
            )}

            <div className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                    <MailOutlined className="mt-0.5 text-blue-600 text-lg shrink-0" />
                    <div className="text-[13px] space-y-1.5 flex-1 min-w-0">
                        {orderData?.confirmationEmail ? (
                            <>
                                <p className="m-0 text-slate-600">{t("back.reg.common.emailSentTo")}</p>
                                <p className="m-0 font-semibold text-slate-900 break-all underline decoration-slate-300 underline-offset-2">
                                    {orderData.confirmationEmail}
                                </p>
                            </>
                        ) : (
                            <p className="m-0 text-slate-600">{t("back.reg.common.pleaseCheckEmail")}</p>
                        )}
                        <p className="m-0 text-[12px] text-slate-500 pt-1.5 border-t border-blue-100/70">
                            {t("back.reg.common.checkSpamIfNoEmail")}{" "}
                            <span className="font-medium text-slate-800">{t("back.reg.common.spam")}</span>{" "}
                            {t("back.reg.common.or")}{" "}
                            <span className="font-medium text-slate-800">{t("back.reg.common.junkMail")}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full space-y-3">
                <button
                    type="button"
                    onClick={() => navigate(myOrderLink)}
                    className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-base shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                    <span>{t("back.reg.common.viewMyRegistration")}</span>
                    <ArrowRightOutlined />
                </button>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full py-3 px-6 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-sm border border-slate-200 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                >
                    <HomeOutlined className="text-slate-400" />
                    <span>{t("back.reg.common.backToHome")}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-emerald-50/60 via-slate-50 to-slate-50">
            <div className="flex-1 flex items-center justify-center px-4 py-6">
            <div className="relative w-full max-w-[480px] overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.12)]">
                <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-50 blur-xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-amber-50 blur-lg" />
                <div className="relative">
                {showSpinner ? (
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
                                status={isMPayOrder && mpayReturnedFail ? "warning" : "info"}
                                icon={isMPayOrder && mpayReturnedFail
                                    ? <ExclamationCircleOutlined style={{ color: "#fa8c16" }} />
                                    : <HourglassOutlined style={{ color: "#5e81d8ff" }} />}
                                title={isMPayOrder && mpayReturnedFail
                                    ? t("back.reg.payment.mpayNotPaid")
                                    : t("back.reg.payment.processingPayment")}
                                subTitle={
                                    <div style={{ whiteSpace: "pre-line" }}>
                                        {isMPayOrder && (
                                            <div>
                                                {mpayReturnedFail
                                                    ? t("back.reg.payment.mpayNotPaidDesc")
                                                    : t("back.reg.payment.payAgainHint")}
                                            </div>
                                        )}
                                        <div style={{ marginTop: 8 }}>
                                            <Text type="secondary">
                                                {t("back.reg.payment.orderNo")}: <strong>{invoiceNo}</strong>
                                            </Text>
                                        </div>
                                    </div>
                                }
                                extra={
                                    <div className="mx-auto w-full max-w-sm space-y-3">
                                        {isMPayOrder && (
                                            <PrimaryAction onClick={() => navigate("/registrationPayment")}>
                                                {t("back.reg.payment.backToPayment")} <ArrowRightOutlined />
                                            </PrimaryAction>
                                        )}
                                        <SecondaryAction
                                            loading={verifyPaymentMutation.isPending || orderDetail.isFetching}
                                            onClick={refresh}
                                        >
                                            <ReloadOutlined spin={verifyPaymentMutation.isPending || orderDetail.isFetching} />
                                            {t("back.reg.payment.checkAgain")}
                                        </SecondaryAction>
                                    </div>
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
                                    <div className="mx-auto w-full max-w-sm">
                                        <SecondaryAction onClick={() => navigate("/")}>
                                            <HomeOutlined className="text-slate-400" /> {t("back.reg.common.backToHome")}
                                        </SecondaryAction>
                                    </div>
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
                                    <div className="mx-auto w-full max-w-sm">
                                        <PrimaryAction onClick={() => navigate("/registrationPayment")}>
                                            {t("back.reg.payment.backToPayment")} <ArrowRightOutlined />
                                        </PrimaryAction>
                                    </div>
                                }
                            />
                        )}
                    </>
                )}
                </div>
            </div>
            </div>
            <footer className="border-t border-slate-100 bg-white/70 py-5 text-center text-[13px] text-slate-500">
                <div>{t("back.reg.common.contactUsIfQuestions")}</div>
                <a href="mailto:action.in.th@gmail.com" className="inline-flex items-center gap-1.5 font-medium text-blue-600 underline underline-offset-2">
                    <MailOutlined /> action.in.th@gmail.com
                </a>
            </footer>
        </div>
    );
}

export default RegistrationPaymentResult;
