import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, message, Upload, Spin } from 'antd';
import { CheckCircleOutlined, CheckOutlined, DownloadOutlined, ExportOutlined, LoadingOutlined, SafetyCertificateOutlined, SwapOutlined, UploadOutlined } from '@ant-design/icons';
import CopyButton from 'components/copyButton';
import FrontLayout from 'components/frontLayout';
import { Link, useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import backOfficeServices from 'services/backoffice.services';
import { useDispatch, useSelector } from 'react-redux';
import { SET_ORDER } from 'store/reducers/contextSlice';
import { handleQueryStatus } from 'utils';
import { QRCode } from 'react-qrcode-logo';
import { AlipayIconComponent, WechatIconComponent } from 'components/CustomIcons';
import { useTranslation } from 'react-i18next';

function parseTLV(str) {
    const out = [];
    let i = 0;

    while (i + 4 <= str.length) {
        const id = str.slice(i, i + 2);
        const len = Number.parseInt(str.slice(i + 2, i + 4), 10);
        if (Number.isNaN(len) || i + 4 + len > str.length) break;

        const value = str.slice(i + 4, i + 4 + len);
        out.push({ id, len, value });
        i += 4 + len;
    }
    return out;
}

function extractMiniQR(miniQr) {
    if (!miniQr || miniQr.length < 8) return null;

    const outer = parseTLV(miniQr);
    const payloadTag = outer.find((x) => x.id === "00");

    if (!payloadTag?.value) {
        return {
            sendingBank: null,
            transRef: null,
        };
    }

    const sub = parseTLV(payloadTag.value);
    const sendingBank = sub.find((x) => x.id === "01")?.value ?? null;
    const transRef = sub.find((x) => x.id === "02")?.value ?? null;

    return {
        sendingBank,
        transRef,
    };
}

function normalizeAlipayCodeUrl(codeUrl) {
    if (!codeUrl || typeof codeUrl !== "string") return { mode: "none", value: "" };

    if (codeUrl.startsWith("000201")) return { mode: "raw", value: codeUrl };

    try {
        const u = new URL(codeUrl);

        const data = u.searchParams.get("data");
        if (data?.startsWith("000201")) return { mode: "raw", value: data };

        return { mode: "url", value: codeUrl };
    } catch {
        return { mode: "text", value: codeUrl };
    }
}

const PAYMENT_TYPE = Object.freeze({
    QR_CODE: 'qrcode',
    ALIPAY: 'alipay',
    WECHAT_PAY: 'wechatpay',
});

const PAYMENT_COUNTDOWN_SECONDS = Object.freeze({
    [PAYMENT_TYPE.QR_CODE]: 10 * 60,
    [PAYMENT_TYPE.ALIPAY]: 3 * 60,
    [PAYMENT_TYPE.WECHAT_PAY]: 2 * 60 * 60,
});

function getCountdownByType(type, expireAt) {
    // mPAY says when its QR dies; count down to that instead of the fixed SCB window.
    if (expireAt) {
        const left = Math.floor((new Date(expireAt).getTime() - Date.now()) / 1000);
        if (Number.isFinite(left)) return Math.max(0, left);
    }
    return PAYMENT_COUNTDOWN_SECONDS[type] ?? PAYMENT_COUNTDOWN_SECONDS[PAYMENT_TYPE.QR_CODE];
}

const MPAY_POLL_MS = 5000;

const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);

    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;

    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(secs).padStart(2, '0');

    return hours === 0 ? `${m}:${s}` : `${h}:${m}:${s}`;
};

const RegistrationPaymentConfirmation = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const order = useSelector(state => state.context.order) || {}

    const [qrCode, setQrCode] = useState(null);
    const [translip, setTranslip] = useState(null);

    const [refNo, setRefNo] = useState(null);
    const [rawSlipQR, setRawSlipQR] = useState(null);

    const [paymentType, setPaymentType] = useState(null);

    const [countdown, setCountdown] = useState(() => getCountdownByType(order?.paymentType, order?.qrExpireAt));
    const [showUploadSection, setShowUploadSection] = useState(false);
    const [isSettled, setIsSettled] = useState(false);
    const [isSlipVerifying, setIsSlipVerifying] = useState(false);

    const qrWrapperRef = useRef(null);

    // mPAY QR is confirmed by mPAY's webhook or our enquiry — no slip, no SCB webhook-log polling.
    const isMPayQr = order?.paymentProvider === 'MPAY' && paymentType === PAYMENT_TYPE.QR_CODE;

    const keyForWebhook = isMPayQr
        ? null
        : paymentType === PAYMENT_TYPE.QR_CODE
            ? (order?.orderNo ?? refNo)
            : (order?.outTradeNo || refNo);
    const applicationNo = order?.refNo || order?.orderNo || "—";
    const safeId = (applicationNo || '').toString().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'payment';
    const filename = `qr-${safeId}.png`;

    const { tranType, outTradeNo } = order;

    const alipayQrPayload = (() => {
        if (paymentType !== PAYMENT_TYPE.ALIPAY) return "";
        const n = normalizeAlipayCodeUrl(qrCode);
        return n.mode === "raw" ? n.value : (n.mode === "text" ? n.value : "");
    })();

    const { data, refetch, ...other } = backOfficeServices.useQueryFetchPaymentLogDetails({
        refNo: keyForWebhook,
    });

    const verifyPaymentMutation = backOfficeServices.useMutationVerifyPayment(
        () => { },
        () => { }
    );

    const handleUploadSlip = (file) => {
        setRawSlipQR(null);

        const reader = new FileReader();
        reader.onload = () => {
            const base64Image = reader.result;

            dispatch(SET_ORDER({ ...order, translip: base64Image }))
            setTranslip(base64Image);
            scanQRCode(file);
        };
        reader.onerror = (e) => console.error('[SLIP] read error:', e);
        reader.readAsDataURL(file);
        return false;
    };

    const scanQRCode = (file) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = function (e) {
            img.src = e.target.result;

            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const qrCodeData = jsQR(imageData.data, canvas.width, canvas.height);

                if (!qrCodeData?.data) {
                    message.error(t("back.reg.common.scanQrFailed"));
                    return;
                }

                const raw = qrCodeData.data;
                const parsed = extractMiniQR(raw);

                if (!parsed?.transRef) {
                    message.error(t("back.reg.common.invalidSlipQrData"));
                    return;
                }

                setRawSlipQR(raw);
                dispatch(SET_ORDER({
                    ...order,
                    qrScanResult: raw,
                }));
            };
        };

        reader.readAsDataURL(file);
    };

    const handleDownloadQRCode = async () => {
        const saveImage = async (blob) => {
            if (!blob) {
                message.error(t('back.reg.payment.qrFetchError'));
                return;
            }

            const file = new File([blob], filename, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ files: [file] });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                }
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };

        if (paymentType === PAYMENT_TYPE.QR_CODE && qrCode) {
            const dataUrl = `data:image/png;base64,${qrCode}`;

            const img = new Image();
            const imgLoaded = new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            img.src = dataUrl;
            await imgLoaded;

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => saveImage(blob), 'image/png');
            return;
        }

        const canvas = qrWrapperRef.current?.querySelector('canvas');
        if (canvas) {
            if (canvas.toBlob) {
                canvas.toBlob((blob) => saveImage(blob), 'image/png');
            } else {
                const url = canvas.toDataURL('image/png');
                const res = await fetch(url);
                saveImage(await res.blob());
            }
            return;
        }

        message.error(t('back.reg.payment.qrNotFound'));
    };

    const [isMPayChecking, setIsMPayChecking] = useState(false);
    const mpayCheckInFlight = useRef(false);

    const checkMPayStatus = async ({ silent = false } = {}) => {
        if (mpayCheckInFlight.current || isSettled) return;
        mpayCheckInFlight.current = true;
        if (!silent) setIsMPayChecking(true);
        try {
            const res = await verifyPaymentMutation.mutateAsync({ paymentType: 'MPAY', orderNo: order?.orderNo });
            if (res?.settled === true || res?.status === "SUCCESS" || res?.status === "REVIEW") {
                setIsSettled(true);
                if (res?.status !== "REVIEW") message.success(t("back.reg.common.updatePaymentStatusSuccess"));
                navigate(`/registrationPaymentResult?invoiceNo=${encodeURIComponent(order?.orderNo || "")}`);
                return;
            }
            if (!silent) message.warning(t("back.reg.payment.qr.notYet"));
        } catch (e) {
            if (!silent) message.error(e?.message || t("back.reg.common.updatePaymentStatusFailed"));
        } finally {
            mpayCheckInFlight.current = false;
            if (!silent) setIsMPayChecking(false);
        }
    };

    useEffect(() => {
        if (!isMPayQr || isSettled || !order?.orderNo) return;
        const id = setInterval(() => checkMPayStatus({ silent: true }), MPAY_POLL_MS);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMPayQr, isSettled, order?.orderNo]);

    const handleAlipayWechatInquire = async () => {
        try {
            const resolvedType = paymentType === PAYMENT_TYPE.ALIPAY ? 'ALIPAY' : 'WECHAT_PAY';
            const payload = { paymentType: resolvedType, tranType, outTradeNo, };
            const res = await verifyPaymentMutation.mutateAsync(payload);

            if (res?.settled === true || res?.status === "SUCCESS") {
                message.success(t("back.reg.common.updatePaymentStatusSuccess"));
                navigate("/registrationPaymentResult");
                return;
            }

            message.warning(t("back.reg.payment.paymentNotFoundOrFailed"));
            return;
        } catch (e) {
            message.error(e?.message || t("back.reg.common.updatePaymentStatusFailed"));
        }
    };

    // No scroll-into-view here: ScrollToTop opens the page at the top, and the QR card now sits
    // right under the steps, so scrolling to it only pushed the steps under the header.

    useEffect(() => {
        try {
            if (order) {
                if (order.refNo) {
                    setRefNo(order.refNo);
                }
                if (order.qrImage) {
                    setQrCode(order.qrImage);
                } else {
                    message.warning(t("back.reg.payment.qrNotFound"));
                }
                if (order.qrImage) {
                    setPaymentType(order.paymentType);
                    setCountdown(getCountdownByType(order.paymentType, order.qrExpireAt));
                }
            } else {
                message.warning(t("back.reg.payment.noRegistrationData"));
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการโหลด QR Code:", error);
            message.error(t("back.reg.payment.qrFetchError"));
        }
    }, []);

    useEffect(() => {
        if (!paymentType) return;

        const start = getCountdownByType(paymentType, order?.qrExpireAt);
        setCountdown(start);
        setShowUploadSection(start <= 0);
        if (start <= 0) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setShowUploadSection(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [paymentType]); // eslint-disable-line react-hooks/exhaustive-deps -- qrExpireAt is fixed per QR

    useEffect(() => {
        if (keyForWebhook) refetch();
    }, [keyForWebhook, refetch]);

    useEffect(() => {
        const run = async () => {
            if (!rawSlipQR) return;

            setIsSlipVerifying(true);
            try {
                const res = await verifyPaymentMutation.mutateAsync({
                    paymentType: "QR_CODE",
                    slipQrRawData: rawSlipQR,
                    orderNo: order?.orderNo,
                });

                if (res?.settled === true || res?.status === "SUCCESS") {
                    message.success(t("back.reg.common.updatePaymentStatusSuccess"));
                    navigate("/registrationPaymentResult");
                    return;
                }

                const reason = res?.reason;

                if (reason === "SLIP_NOT_MATCH_ORDER" || reason === "AMOUNT_MISMATCH" || reason === "MISSING_TRANS_REF") {
                    message.warning(t(`back.reg.payment.verifySlip.reason.${reason}`));
                } else {
                    message.warning(t("back.reg.payment.paymentNotFoundOrFailed"));
                }

                setRawSlipQR(null);
            } catch (e) {
                message.error(e?.message || t("back.reg.common.updatePaymentStatusFailed"));
                setRawSlipQR(null);
                setTranslip(null);
            } finally {
                setIsSlipVerifying(false);
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawSlipQR]);

    useEffect(() => {
        handleQueryStatus(other, async () => {
            if (data && !isSettled) {
                try {
                    const res = await verifyPaymentMutation.mutateAsync({
                        paymentType: 'LOG_SETTLE',
                        orderNo: refNo,
                    });

                    if (res?.settled === true || res?.status === "SUCCESS") {
                        setIsSettled(true);
                        setCountdown(0);
                        message.success(t('back.reg.common.updatePaymentStatusSuccess'));
                        navigate("/registrationPaymentResult");
                        return;
                    }
                } catch (e) {
                    console.error("Auto-settle check failed", e);
                }
            }
        }, () => { })
    }, [other.fetchStatus])

    const isQrType = paymentType === PAYMENT_TYPE.QR_CODE
        || paymentType === PAYMENT_TYPE.ALIPAY
        || paymentType === PAYMENT_TYPE.WECHAT_PAY;
    const expired = !!paymentType && countdown <= 0;

    // "เปิดแอปธนาคาร": no link opens every Thai bank app on a PromptPay QR, so save the QR first and
    // tell the runner to scan it from their photos in whichever bank app they use.
    const handleOpenBankApp = async () => {
        await handleDownloadQRCode();
        Modal.info({
            title: t("back.reg.payment.qr.openBankTitle"),
            content: t("back.reg.payment.qr.openBankBody"),
            okText: t("back.reg.payment.qr.gotIt"),
            centered: true,
        });
    };

    // "ฉันชำระเงินแล้ว": ask the gateway right away instead of waiting for the next poll.
    const handleIPaid = () => {
        if (isMPayQr) return checkMPayStatus();
        if (paymentType === PAYMENT_TYPE.ALIPAY || paymentType === PAYMENT_TYPE.WECHAT_PAY) return handleAlipayWechatInquire();
        setShowUploadSection(true); // legacy SCB QR: confirmed by uploading the slip
    };

    const steps = [t("back.reg.payment.qr.stepInfo"), t("back.reg.payment.qr.stepReview"), t("back.reg.payment.qr.stepPay")];

    // Layout follows the Stitch "ชำระเงินด้วย Thai QR Payment" screen (tester deck #13).
    return (
        <FrontLayout>
            <div className="mx-auto w-full max-w-[480px] px-1 pt-3" ref={qrWrapperRef}>
                <div className="mb-4 flex items-center justify-between gap-1">
                    {steps.map((label, i) => {
                        const current = i === steps.length - 1;
                        return (
                            <React.Fragment key={label}>
                                {i > 0 && <span className={`h-0.5 flex-1 rounded ${current ? "bg-[#0284C7]" : "bg-emerald-200"}`} />}
                                <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[13px] ${current ? "bg-white font-semibold text-[#003D6B] shadow-sm ring-1 ring-slate-200" : "text-slate-400"}`}>
                                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${current ? "bg-[#0284C7] text-white" : "bg-slate-100 text-slate-500"}`}>
                                        {current ? i + 1 : <CheckOutlined />}
                                    </span>
                                    {label}
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_20px_40px_-15px_rgba(2,61,107,0.18)]">
                    <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#0b233a] to-[#003D6B] px-4 py-4 min-[390px]:px-5">
                        {paymentType === PAYMENT_TYPE.ALIPAY ? (
                            <span className="rounded-md bg-white px-2 py-1"><AlipayIconComponent sizew={84} sizeh={26} /></span>
                        ) : paymentType === PAYMENT_TYPE.WECHAT_PAY ? (
                            <span className="rounded-md bg-white px-2 py-1"><WechatIconComponent sizew={84} sizeh={26} /></span>
                        ) : (
                            <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                                <span className="rounded-md bg-white px-2 py-1 text-[13px] font-extrabold tracking-wider text-[#003D6B] min-[390px]:px-2.5 min-[390px]:text-sm min-[390px]:tracking-widest">THAI QR</span>
                                <span className="text-[13px] font-semibold tracking-[0.12em] text-white/90 min-[390px]:text-sm min-[390px]:tracking-[0.18em]">PAYMENT</span>
                            </span>
                        )}
                        {paymentType === PAYMENT_TYPE.QR_CODE && (
                            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white min-[390px]:px-3 min-[390px]:text-[12px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                {t("back.reg.payment.qr.standard")}
                            </span>
                        )}
                    </div>

                    <div className="flex items-start justify-between gap-3 border-b border-dashed border-slate-200 px-5 py-4">
                        <div className="min-w-0">
                            <div className="text-[12px] text-slate-400">{t("back.reg.payment.orderNo")} / Ref Code</div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="truncate font-mono text-[15px] font-bold tracking-wide text-slate-900">{applicationNo}</span>
                                {applicationNo !== "—" && <CopyButton text={applicationNo} className="!border-0 !bg-transparent !text-[#0284C7]" />}
                            </div>
                        </div>
                        {isQrType && (
                            <div className="shrink-0 text-right">
                                <div className="text-[12px] text-slate-400">{t("back.reg.payment.qr.expiresIn")}</div>
                                <span className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[15px] font-bold ${expired ? "border-slate-200 bg-slate-50 text-slate-400" : "border-rose-200 bg-rose-50 text-rose-600"}`}>
                                    {!expired && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />}
                                    {formatTime(countdown)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="px-5 pb-4 pt-5 text-center">
                        {qrCode ? (
                            <div className={`relative mx-auto w-fit p-3 ${expired ? "opacity-30 grayscale" : ""}`}>
                                <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-[#0284C7]" />
                                <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-[#0284C7]" />
                                <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-[#0284C7]" />
                                <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-[#0284C7]" />
                                <div className="rounded-2xl border border-slate-100 bg-white p-2">
                                    {paymentType === PAYMENT_TYPE.QR_CODE && (
                                        <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="h-[220px] w-[220px]" />
                                    )}
                                    {paymentType === PAYMENT_TYPE.ALIPAY && alipayQrPayload ? (
                                        <QRCode value={alipayQrPayload} size={220} quietZone={8} />
                                    ) : null}
                                    {paymentType === PAYMENT_TYPE.WECHAT_PAY && (
                                        <QRCode value={qrCode} size={220} quietZone={8} />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="py-16 text-slate-500">{t("back.reg.payment.loadingQR")}</p>
                        )}
                        {paymentType === PAYMENT_TYPE.ALIPAY && typeof qrCode === "string" && qrCode.trim() !== "" && (
                            <a href={qrCode} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm">
                                ({t("back.reg.payment.alipayLink")})
                            </a>
                        )}

                        {expired ? (
                            <p className="mt-3 text-[15px] font-semibold text-rose-600">{t("back.reg.payment.qrExpiredRetry")}</p>
                        ) : (
                            <p className="mt-3 text-[15px] font-semibold text-slate-800">
                                {paymentType === PAYMENT_TYPE.QR_CODE ? t("back.reg.payment.qr.anyBank") : t("back.reg.payment.scanToPay")}
                            </p>
                        )}
                        {isMPayQr && !expired && (
                            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[13px] font-medium text-emerald-700">
                                <CheckOutlined /> {t("back.reg.payment.qr.autoConfirm")}
                            </span>
                        )}
                        {isMPayQr && !expired && (
                            <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-slate-500">
                                <LoadingOutlined className="text-[#0284C7]" /> {t("back.reg.payment.qr.waiting")}
                            </p>
                        )}

                        {paymentType === PAYMENT_TYPE.QR_CODE && (
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-[12px]">
                                <span className="w-full text-center text-slate-400">{t("back.reg.payment.qr.allBanks")}</span>
                                <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">K PLUS</span>
                                <span className="rounded-md border border-purple-100 bg-purple-50 px-2 py-0.5 font-semibold text-purple-700">SCB</span>
                                <span className="rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">KTB</span>
                                <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 font-semibold text-blue-800">BBL</span>
                                <span className="text-slate-400">{t("back.reg.payment.qr.others")}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-dashed border-slate-200 bg-slate-50/70 px-5 py-3 text-center text-[12px] text-slate-500">
                        {t("back.reg.payment.qr.expiryNote")}
                    </div>
                </div>

                {isQrType && (
                    <div className="mt-5 space-y-3">
                        <button
                            type="button"
                            onClick={handleDownloadQRCode}
                            disabled={!qrCode || expired}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#4f46e5] py-3.5 text-base font-semibold text-white shadow-[0_10px_24px_-8px_rgba(37,99,235,0.55)] transition-all active:scale-[0.99] disabled:opacity-50"
                        >
                            <DownloadOutlined /> {t("back.reg.payment.qr.saveQr")}
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handleOpenBankApp}
                                disabled={!qrCode || expired}
                                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-[15px] font-semibold text-slate-700 transition-all active:scale-[0.99] disabled:opacity-50"
                            >
                                <ExportOutlined className="text-[#2563eb]" /> {t("back.reg.payment.qr.openBank")}
                            </button>
                            <button
                                type="button"
                                onClick={handleIPaid}
                                disabled={isMPayChecking || verifyPaymentMutation.isPending}
                                className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 py-3 text-[15px] font-semibold text-emerald-700 transition-all active:scale-[0.99] disabled:opacity-60"
                            >
                                {isMPayChecking || verifyPaymentMutation.isPending ? <LoadingOutlined /> : <CheckCircleOutlined />}
                                {t("back.reg.payment.qr.iPaid")}
                            </button>
                        </div>
                    </div>
                )}

                {showUploadSection && paymentType === PAYMENT_TYPE.QR_CODE && !isMPayQr && (
                    <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 text-center">
                        <Spin spinning={isSlipVerifying} tip={t("back.reg.payment.verifyingSlip")}>
                            <div className="mb-2 text-base font-semibold text-gray-800">{t("back.reg.payment.uploadSlip")}</div>
                            <Upload beforeUpload={handleUploadSlip} showUploadList={false} accept="image/*" disabled={isSlipVerifying}>
                                <Button icon={<UploadOutlined />}>{t("back.reg.payment.chooseImage")}</Button>
                            </Upload>
                            {translip && (
                                <div className="mt-4 flex flex-col items-center">
                                    <div className="mb-2 text-base font-semibold text-gray-800">📃 {t("back.reg.payment.paymentProof")}</div>
                                    <img src={translip} alt="Translip" style={{ width: "100%", maxWidth: "300px", borderRadius: "8px" }} />
                                </div>
                            )}
                        </Spin>
                    </div>
                )}

                <div className="mt-5 text-center">
                    <Link to="/registrationPayment" className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-medium text-slate-600 hover:bg-slate-100">
                        <SwapOutlined /> {t("back.reg.payment.changePaymentMethod")}
                    </Link>
                </div>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-slate-400">
                    <SafetyCertificateOutlined /> {t("back.reg.payment.qr.secureNote")}
                </p>
            </div>
        </FrontLayout>
    );
}

export default RegistrationPaymentConfirmation;
