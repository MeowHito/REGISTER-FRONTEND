import React, { useEffect, useRef, useState } from 'react';
import { Card, Button, Row, message, Upload, Spin } from 'antd';
import { DownloadOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import FrontLayout from 'components/frontLayout';
import RegistrationSteps from '../components/RegistrationSteps';
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

function getCountdownByType(type) {
    return PAYMENT_COUNTDOWN_SECONDS[type] ?? PAYMENT_COUNTDOWN_SECONDS[PAYMENT_TYPE.QR_CODE];
}

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

    const [countdown, setCountdown] = useState(() => getCountdownByType(order?.paymentType));
    const [showUploadSection, setShowUploadSection] = useState(false);
    const [isSettled, setIsSettled] = useState(false);
    const [isSlipVerifying, setIsSlipVerifying] = useState(false);

    const qrWrapperRef = useRef(null);

    const keyForWebhook =
        paymentType === PAYMENT_TYPE.QR_CODE
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
                    setCountdown(getCountdownByType(order.paymentType));
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

        const start = getCountdownByType(paymentType);
        setCountdown(start);
        setShowUploadSection(false);

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
    }, [paymentType]);

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

    return (
        <FrontLayout>
            <RegistrationSteps currentStep={2} />

            <div className="payment-container md:max-w-screen-sm mx-auto" ref={qrWrapperRef}>
                <div className="text-2xl font-bold text-center text-gray-800 mb-4">💳 {t("back.reg.payment.title")}</div>
                <div className="flex justify-center">
                    <div className="flex flex-row gap-2 text-sm text-gray-700">
                        <div className="w-20">{t("back.reg.payment.orderNo")}:</div>
                        <div className="font-semibold">{applicationNo}</div>
                    </div>
                </div>
                {paymentType === PAYMENT_TYPE.ALIPAY && (
                    <div className="flex items-center justify-center my-2"><AlipayIconComponent sizew={104} sizeh={34} /></div>
                )}

                {paymentType === PAYMENT_TYPE.WECHAT_PAY && (
                    <div className="flex items-center justify-center my-2"><WechatIconComponent sizew={104} sizeh={34} /></div>
                )}

                {qrCode ? (
                    <div style={{ textAlign: "center" }}>
                        {paymentType === PAYMENT_TYPE.QR_CODE && qrCode && (
                            <img
                                src={`data:image/png;base64,${qrCode}`}
                                className="mx-auto"
                                alt="QR Code"
                                style={{ width: "200px", height: "200px" }}
                            />
                        )}

                        {paymentType === PAYMENT_TYPE.ALIPAY && (
                            <>
                                {alipayQrPayload ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            minHeight: "250px",
                                            width: "100%",
                                        }}
                                    >
                                        <QRCode value={alipayQrPayload} size={230} quietZone={12} />
                                    </div>
                                ) : null}

                                {typeof qrCode === "string" && qrCode.trim() !== "" ? (
                                    <div>
                                        <a
                                            href={qrCode}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ wordBreak: "break-all" }}
                                        >
                                            ({t("back.reg.payment.alipayLink")})
                                        </a>
                                    </div>
                                ) : null}
                            </>
                        )}

                        {paymentType === PAYMENT_TYPE.WECHAT_PAY && qrCode && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '220px',
                                    width: '100%',
                                }}
                            >
                                <QRCode
                                    value={qrCode}
                                    size={200}
                                    className="mx-auto"
                                />
                            </div>
                        )}

                        <p className="mt-2">{t("back.reg.payment.scanToPay")}</p>

                        {(
                            paymentType === PAYMENT_TYPE.QR_CODE ||
                            paymentType === PAYMENT_TYPE.ALIPAY ||
                            paymentType === PAYMENT_TYPE.WECHAT_PAY
                        ) && (
                                <Button
                                    icon={<DownloadOutlined />}
                                    onClick={handleDownloadQRCode}
                                    disabled={!qrCode}
                                    type="primary"
                                    className="mt-2"
                                >
                                    {t("back.reg.payment.downloadQr")}
                                </Button>
                            )}
                    </div>
                ) : (
                    <p>{t("back.reg.payment.loadingQR")}</p>
                )}
            </div>

            <Card style={{ marginTop: "20px", padding: "20px", textAlign: "center" }}>
                {!showUploadSection ? (
                    <div className="text-center !space-y-2">
                        <p className="text-base text-gray-700">{t("back.reg.payment.pleasePayWithin")}</p>
                        <p className="text-5xl font-semibold text-red-600">{formatTime(countdown)}</p>
                        <Button onClick={() => setShowUploadSection(true)}>
                            {t("back.reg.payment.confirmPayment")}
                        </Button>
                    </div>
                ) : (
                    <>
                        {paymentType === PAYMENT_TYPE.QR_CODE && (
                            <Spin
                                spinning={isSlipVerifying}
                                tip={t("back.reg.payment.verifyingSlip")}
                            >
                                <div className="text-base font-semibold text-gray-800 mb-2">{t("back.reg.payment.uploadSlip")}</div>
                                <Upload
                                    beforeUpload={handleUploadSlip}
                                    showUploadList={false}
                                    accept="image/*"
                                    disabled={isSlipVerifying}
                                >
                                    <Button icon={<UploadOutlined />}>{t("back.reg.payment.chooseImage")}</Button>
                                </Upload>
                                {translip && (
                                    <div className="flex flex-col items-center mt-4">
                                        <div className="text-base font-semibold text-gray-800 mb-2">📃 {t("back.reg.payment.paymentProof")}</div>
                                        <img src={translip} alt="Translip" style={{ width: "100%", maxWidth: "300px", borderRadius: "8px" }} />
                                    </div>
                                )}
                            </Spin>
                        )}
                        {(
                            paymentType === PAYMENT_TYPE.ALIPAY ||
                            paymentType === PAYMENT_TYPE.WECHAT_PAY
                        ) && (
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={handleAlipayWechatInquire}
                                    className="mt-2"
                                    loading={verifyPaymentMutation.isPending}
                                    disabled={verifyPaymentMutation.isPending}
                                >
                                    {t("back.reg.payment.checkPaymentStatus")}
                                </Button>
                            )}
                    </>
                )}
            </Card>
            <Row justify="center" style={{ marginTop: "24px" }}>
                <Link to="/registrationPayment">
                    <Button style={{ backgroundColor: "#FFF6E6", borderColor: "#FFF6E6" }}>{t("back.reg.payment.changePaymentMethod")}</Button>
                </Link>
            </Row>
        </FrontLayout>
    );
}

export default RegistrationPaymentConfirmation;
