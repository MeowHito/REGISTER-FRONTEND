import React, { useEffect, useState } from 'react';
import { Alert, Button, message } from 'antd';
import { ArrowRightOutlined, CreditCardOutlined } from '@ant-design/icons';
import FrontLayout from 'components/frontLayout';
import { AlertError } from 'components/alert';
import backOfficeServices from 'services/backoffice.services';
import { handleQueryStatus, scrollPageToTop } from 'utils';
import { useDispatch, useSelector } from 'react-redux';
import { SET_ORDER } from "store/reducers/contextSlice";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import dayjs from 'dayjs';

import OrderDetails from './components/OrderDetails';
import CouponSection from './components/CouponSection';
import OrderSummary from './components/OrderSummary';
import PaymentMethods from './components/PaymentMethods';

import {
    formatMoney,
    calculatePaymentFeePercent,
    calculateFeeAmount,
    addMoney,
    couponDiscountFor,
    convertDateToThaiFormat,
} from './utils';

const resolvePaymentState = (orderDetail, order) => {
    const status = orderDetail?.status ?? order?.paymentStatus ?? "PENDING";
    const paymentDueDatetime = orderDetail?.paymentDueDatetime ?? order?.paymentDueDatetime ?? null;
    return { status, paymentDueDatetime };
};

const isOverdueByDue = (paymentDueDatetime, now = dayjs()) => {
    if (!paymentDueDatetime) return false;
    return dayjs(paymentDueDatetime).isBefore(now);
};

const isPayablePayment = (status, paymentDueDatetime, now = dayjs()) => {
    return status === "PENDING" && !isOverdueByDue(paymentDueDatetime, now);
};

const RegistrationPayment = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const order = useSelector(state => state.context.order) || {};
    const navigate = useNavigate();

    const [selectedPayment, setSelectedPayment] = useState(null);
    const [selectedBank, setSelectedBank] = useState(null);
    const [applicants, setApplicants] = useState([]);

    const [totalShirtPrice, setTotalShirtPrice] = useState(0);
    const [totalDeliveryFee, setTotalDeliveryFee] = useState(0);
    const [totalAddOns, setTotalAddOns] = useState(0);
    const [totalDiscount, setTotalDiscount] = useState(0);
    const [totalCoupon, setTotalCoupon] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);
    const [feeAmount, setFeeAmount] = useState(0);
    const [feePercent, setFeePercent] = useState(0);
    const [totalAmountWithFee, setTotalAmountWithFee] = useState(0);

    const [paymentDueTH, setPaymentDueTH] = useState("");
    const [orderNo, setOrderNo] = useState("");
    const [eventIds, setEventIds] = useState([]);

    const [couponType, setCouponType] = useState("");
    const [couponCode, setCouponCode] = useState("");
    const [isApplying, setIsApplying] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [couponMsg, setCouponMsg] = useState('');
    const [couponMsgType, setCouponMsgType] = useState('');
    const [couponMeta, setCouponMeta] = useState({
        couponCode: '',
        deductionPercentage: 0,
    });

    const [isProceeding, setIsProceeding] = useState(false);

    const { mutateAsync: validateCoupon } = backOfficeServices.useMutationValidateCoupon({});
    const { mutateAsync: updateOrder } = backOfficeServices.useUpdateOrder();
    const { data: paymentOptions, isLoading: isLoadingPaymentOptions } = backOfficeServices.useQueryPaymentOptions();

    const { data: orderDetail, refetch: refetchOrderDetail, isFetching: isFetchingOrderDetail } = backOfficeServices.useQuerygetHistoryDetail({ orderId: order?.orderNo });
    const { data: coupons, ...other } = backOfficeServices.useQueryGetCouponByEventIds({ eventIds });

    const { status: currentStatus, paymentDueDatetime } = resolvePaymentState(orderDetail, order);

    const isPayable = isPayablePayment(currentStatus, paymentDueDatetime);
    // Admin-flagged test event: the backend completes the order without payment.
    const isTestMode = orderDetail?.testMode === true;
    const isFreeOrder = totalAmountWithFee <= 0;
    // Mobile Banking also needs the bank before mPAY can send the runner to it.
    const hasSelectedPayment = !!selectedPayment && (selectedPayment !== 'mobilebanking' || !!selectedBank);
    const canProceed = !isProceeding && !isFetchingOrderDetail && isPayable && (hasSelectedPayment || isFreeOrder || isTestMode);
    const needsMethod = isPayable && !isFreeOrder && !isTestMode && !hasSelectedPayment;
    const promptForMethod = () => {
        if (selectedPayment === 'mobilebanking' && !selectedBank) {
            message.warning(t("back.reg.payment.selectBankFirst"));
            document.getElementById("payment-banks")?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        message.warning(t("front.reg.selectPaymentFirst"));
        document.getElementById("payment-methods")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    useEffect(() => {
        if (!isFetchingOrderDetail && currentStatus && currentStatus !== "PENDING") {
            const params = order?.orderNo ? `?invoiceNo=${encodeURIComponent(order.orderNo)}` : '';
            navigate(`/registrationPaymentResult${params}`, { replace: true });
        }
    }, [currentStatus, isFetchingOrderDetail]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setPaymentDueTH(paymentDueDatetime ? convertDateToThaiFormat(paymentDueDatetime, i18n.language) : "");
    }, [paymentDueDatetime, i18n.language]);

    useEffect(() => {
        scrollPageToTop();
        if (!order?.orderNo || !order?.applicants?.length) {
            message.warning(t("back.reg.payment.orderNotFound"));
            navigate("/", { replace: true });
        }
    }, [order?.orderNo, order?.applicants?.length]);

    useEffect(() => {
        if (!order?.orderNo || !order?.applicants?.length) return;

        setApplicants(order.applicants);
        setOrderNo(order.orderNo);

        const eventId = order.eventId;
        setEventIds([eventId]);

        const shirt = order.applicants.reduce((sum, a) => sum + (a.price || 0), 0);
        const delivery = order.applicants.reduce((sum, a) => sum + (a.deliveryMethod === "post" ? a.shippingFee : 0), 0);
        const discount = order.applicants.reduce((sum, a) => sum + (a.discountNoShirt || 0), 0);
        const addOn = (order.addOns || []).reduce((sum, a) => sum + (Number(a.totalPrice) || 0), 0);
        const coupon = 0;

        setTotalShirtPrice(shirt);
        setTotalDeliveryFee(delivery);
        setTotalDiscount(discount);
        setTotalAddOns(addOn);
        const total = (shirt + delivery + addOn) - discount - coupon;
        setFinalTotal(total);
        setTotalAmountWithFee(total);
        setTotalCoupon(0);
    }, [order?.orderNo]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        handleQueryStatus(other, () => {
            setAvailableCoupons(coupons);
        })
    }, [other.fetchStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    const updatePaymentMethodBeforeProceed = async () => {
        const payload = {
            orderId: order.orderId,
            paymentMethod: selectedPayment || 'free',
            bankCode: selectedPayment === 'mobilebanking' ? selectedBank : undefined,
            couponDiscount: Number((order.couponDiscount || 0).toFixed(2)),
            couponType: order.couponType,
            couponCode: order.couponCode,
            totalPrice: Number(finalTotal.toFixed(2)),
            fee: Number(feeAmount.toFixed(2)),
            feePercent: feePercent,
            totalAmountWithFee: Number(totalAmountWithFee.toFixed(2)),
            runnerCoupons: (order.applicants || [])
                .filter(a => a.couponApplied)
                .map(a => ({
                    idNo: a.idNo,
                    couponDiscount: Number((a.personalCouponDiscount || 0).toFixed(2)),
                    netPrice: Number(((a.price || 0) - (a.discountNoShirt || 0) - (a.personalCouponDiscount || 0) + (a.shippingFee || 0)).toFixed(2))
                }))
        };
        const res = await updateOrder(payload);
        return res;
    };

    // Payment problems stay on screen until the runner closes them (a 3-second toast is easy to
    // miss on a phone) and always say whether money was taken and what to do next.
    const showPayFailed = (code) => {
        const closed = code === 'ORDER_OVERDUE' || code === 'ORDER_STATUS_NOT_PENDING';
        AlertError({
            title: t(closed ? "back.reg.payment.failClosedTitle" : "back.reg.payment.failTitle"),
            text: t(closed ? "back.reg.payment.unavailable" : "back.reg.payment.failText"),
            confirmButtonText: t(closed ? "back.reg.payment.goHistory" : "back.reg.payment.tryAgain"),
            onOk: closed ? () => navigate("/historyList") : undefined,
        });
    };

    const handleNext = async () => {
        if (!order?.orderNo || !order?.applicants?.length) {
            message.warning(t("back.reg.payment.orderNotFound"));
            return;
        }

        if (isProceeding || isFetchingOrderDetail) return;

        setIsProceeding(true);
        try {
            let fresh;
            try {
                fresh = await refetchOrderDetail();
            } catch (err) {
                console.error("[RegistrationPayment] refetchOrderDetail failed:", err);
                showPayFailed();
                return;
            }
            const { status: latestStatus, paymentDueDatetime: latestDue } = resolvePaymentState(fresh.data, order);

            const isPayableLatest = isPayablePayment(latestStatus, latestDue);
            if (!isPayableLatest) {
                showPayFailed('ORDER_STATUS_NOT_PENDING');
                return;
            }

            if (totalAmountWithFee > 0 && !hasSelectedPayment && !fresh.data?.testMode) {
                message.error(t(selectedPayment === 'mobilebanking' ? "back.reg.payment.selectBankFirst" : "front.reg.selectPaymentFirst"));
                return;
            }

            dispatch(SET_ORDER({ ...order, qrImage: "" }));

            const updateRes = await updatePaymentMethodBeforeProceed();
            const resData = updateRes?.data;
            const skipPayment = resData?.skipPayment === true;

            if (skipPayment) {
                dispatch(SET_ORDER({
                    ...order,
                    paymentStatus: 'SUCCESS',
                    paymentType: isTestMode ? 'test' : (selectedPayment || 'free'),
                    totalPrice: '0.00',
                    totalAmountWithFee: 0,
                    fee: 0,
                    feePercent: 0,
                }));
                navigate("/registrationPaymentResult");
                return;
            }

            const paymentData = resData?.paymentData;
            if (!paymentData) {
                showPayFailed(resData?.message);
                return;
            }

            // mPAY: QR is shown on our confirmation page and confirmed by webhook/enquiry; every
            // other method is a hosted page (card form, bank, wallet) that returns to the result page.
            if (paymentData.provider === 'MPAY') {
                const mpayOrder = {
                    ...order,
                    totalPrice: finalTotal.toFixed(2),
                    refNo: paymentData.refNo,
                    paymentType: selectedPayment,
                    paymentProvider: 'MPAY',
                    totalAmountWithFee: totalAmountWithFee,
                };
                if (selectedPayment === 'qrcode') {
                    dispatch(SET_ORDER({ ...mpayOrder, qrImage: paymentData.qrImage, qrExpireAt: paymentData.qrExpireAt }));
                    navigate("/registrationPaymentConfirmation");
                    return;
                }
                const isPhone = /Mobi|Android|iPhone|iPad/i.test(globalThis.navigator?.userAgent || "");
                const target = (isPhone && paymentData.appPaymentUrl) || paymentData.webPaymentUrl;
                if (!target) {
                    showPayFailed();
                    return;
                }
                dispatch(SET_ORDER(mpayOrder));
                message.loading(t("back.reg.payment.redirecting"), 5);
                globalThis.location.href = target;
                return;
            }

            if (selectedPayment === 'qrcode') {
                dispatch(SET_ORDER({
                    ...order,
                    qrImage: paymentData.qrImage,
                    totalPrice: finalTotal.toFixed(2),
                    refNo: paymentData.refNo,
                    paymentType: selectedPayment,
                    totalAmountWithFee: totalAmountWithFee,
                }));
                navigate("/registrationPaymentConfirmation");
                return;
            }

            if (selectedPayment === 'alipay' || selectedPayment === 'wechatpay') {
                dispatch(SET_ORDER({
                    ...order,
                    qrImage: paymentData.qrImage,
                    totalPrice: finalTotal.toFixed(2),
                    refNo: paymentData.refNo,
                    paymentType: selectedPayment,
                    totalAmountWithFee: totalAmountWithFee,
                    tranType: paymentData.tranType,
                    outTradeNo: paymentData.outTradeNo,
                }));
                navigate("/registrationPaymentConfirmation");
                return;
            }

            if (selectedPayment === 'ewallet' || selectedPayment === 'creditcard') {
                if (paymentData.respCode === '9015') {
                    const params = paymentData.payload
                        ? `payload=${encodeURIComponent(paymentData.payload)}`
                        : `invoiceNo=${encodeURIComponent(orderNo)}`;
                    navigate(`/registrationPaymentResult?${params}`);
                } else if (paymentData.webPaymentUrl) {
                    globalThis.location.href = paymentData.webPaymentUrl;
                } else if (paymentData.payload) {
                    const params = `payload=${encodeURIComponent(paymentData.payload)}`;
                    navigate(`/registrationPaymentResult?${params}`);
                } else {
                    showPayFailed();
                }
                return;
            }
        } catch (err) {
            console.error("[RegistrationPayment] cannotProceed:", err);
            showPayFailed();
            return;
        } finally {
            setIsProceeding(false);
        }
    };

    const processCoupon = async (code, type, isSelectMode = false) => {
        setIsApplying(true);
        setCouponMsg("");
        setCouponMsgType('');

        if (isSelectMode) {
            const storedData = _.cloneDeep(order);
            delete storedData.couponCode; delete storedData.couponDiscount; delete storedData.deductionPercentage;
            dispatch(SET_ORDER(storedData));
            setCouponMeta({ couponCode: '', deductionPercentage: 0 });
            setTotalCoupon(0);
            const resetTotal = totalShirtPrice + totalDeliveryFee + totalAddOns - totalDiscount;
            const resetFee = calculateFeeAmount(resetTotal, feePercent);
            setFinalTotal(resetTotal);
            setFeeAmount(resetFee);
            setTotalAmountWithFee(addMoney(resetTotal, resetFee));
        }

        const idNo = applicants.map(a => String(a.idNo).trim());

        try {
            const res = await validateCoupon({ eventId: order.eventId, couponCode: code, idNo, orderId: order.orderId });
            const validIdNoMap = res?.idNo || {};
            const validIdNos = Object.entries(validIdNoMap).filter(([_, isValid]) => isValid).map(([id]) => id);

            if (res.status === "success") {
                if (validIdNos.length === 0) {
                    setCouponMsg(t("back.reg.payment.noEligibleApplicants"));
                    setCouponMsgType('warning');
                    setIsApplying(false);
                    return;
                }

                let deductionPercentage = 0;
                let detectedType = type || res?.type || "";

                if (isSelectMode) {
                    const foundCoupon = availableCoupons.find(c => c.couponCode === code);
                    deductionPercentage = foundCoupon?.deductionPercentage || 0;
                } else {
                    deductionPercentage = res?.deductionPercentage ?? 0;
                }

                setCouponMeta({ couponCode: code, deductionPercentage });
                setCouponType(detectedType);

                let totalCouponDiscount = 0;
                const updatedApplicants = applicants.map(app => {
                    const shirtPrice = app.price || 0;
                    const noShirtDiscount = app.discountNoShirt || 0;
                    const netPrice = Math.max(shirtPrice - noShirtDiscount, 0);
                    const isValid = validIdNos.includes(app.idNo);
                    const personalDiscount = isValid ? couponDiscountFor(netPrice, deductionPercentage) : 0;
                    if (isValid) totalCouponDiscount += personalDiscount;
                    return { ...app, couponApplied: isValid, personalCouponDiscount: personalDiscount };
                });
                totalCouponDiscount = Number(totalCouponDiscount.toFixed(2));

                dispatch(SET_ORDER({
                    ...order,
                    couponCode: code,
                    couponType: detectedType,
                    couponDiscount: totalCouponDiscount,
                    validCouponIdNos: validIdNos,
                    deductionPercentage: deductionPercentage,
                    applicants: updatedApplicants
                }));

                setApplicants(updatedApplicants);
                setTotalCoupon(totalCouponDiscount);
                const newTotal = totalShirtPrice + totalDeliveryFee + totalAddOns - totalDiscount - totalCouponDiscount;
                const newFee = calculateFeeAmount(newTotal, feePercent);
                setFinalTotal(newTotal);
                setFeeAmount(newFee);
                setTotalAmountWithFee(addMoney(newTotal, newFee));

            } else {
                setCouponMsg(t("back.reg.payment.notEligible"));
                setCouponMsgType('warning');
            }
        } catch (error) {
            // Never show raw server/axios text ("Request failed with status code 404") to a runner.
            // A 400 from the coupon check carries the business reason ("ไม่พบคูปองนี้ หรือคูปองถูกใช้ไปแล้ว");
            // anything else (network, 5xx) keeps the generic message and is a real failure.
            const body = error?.response?.status === 400 ? error.response.data : null;
            const reason = body?.status === "error" && typeof body?.message === "string" ? body.message.trim() : "";
            if (!reason) console.error("[RegistrationPayment] validateCoupon failed:", error);
            setCouponMsg(reason || t("back.reg.payment.checkFailed"));
            setCouponMsgType('warning');
        }
        setIsApplying(false);
    };

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) {
            setCouponMsg(t("back.reg.payment.enterCode"));
            setCouponMsgType('warning');
            return;
        }
        processCoupon(couponCode.trim(), couponType, false);
    };

    const handleApplyCouponSelected = (selectedCode, _, type) => {
        setCouponCode(selectedCode);
        processCoupon(selectedCode, type, true);
    };

    const handleRemoveCoupon = () => {
        const storedData = _.cloneDeep(order);
        delete storedData.couponCode;
        delete storedData.couponDiscount;
        delete storedData.deductionPercentage;

        setCouponType("");
        setCouponCode("");
        setCouponMeta({ couponCode: '', deductionPercentage: 0 });
        setTotalCoupon(0);

        const newTotal = totalShirtPrice + totalDeliveryFee + totalAddOns - totalDiscount;
        const newFeeAmount = calculateFeeAmount(newTotal, feePercent);
        const newTotalWithFee = addMoney(newTotal, newFeeAmount);

        setFinalTotal(newTotal);
        setFeeAmount(newFeeAmount);
        setTotalAmountWithFee(newTotalWithFee);

        const resetApplicants = applicants.map(a => ({ ...a, couponApplied: false, personalCouponDiscount: 0 }));
        setApplicants(resetApplicants);

        dispatch(SET_ORDER({
            ...storedData,
            applicants: resetApplicants,
            totalPrice: newTotal,
            fee: newFeeAmount,
            feePercent: feePercent,
            totalAmountWithFee: newTotalWithFee,
        }));

        message.info(t("back.reg.payment.removeSuccess"));
    }

    const handlePaymentSelection = (type) => {
        setSelectedPayment(type);
        if (type !== 'mobilebanking') setSelectedBank(null);

        const shirt = totalShirtPrice;
        const delivery = totalDeliveryFee;
        const discount = totalDiscount;

        const total = (shirt + delivery + totalAddOns - discount - totalCoupon);
        const feePercent = calculatePaymentFeePercent(type);
        const feeAmount = calculateFeeAmount(total, feePercent);
        const totalAmountWithFee = addMoney(total, feeAmount);

        setFeeAmount(feeAmount);
        setFeePercent(feePercent);
        setFinalTotal(total);
        setTotalAmountWithFee(totalAmountWithFee);

        dispatch(SET_ORDER({
            ...order,
            paymentType: type,
            fee: feeAmount,
            feePercent: feePercent,
            totalPrice: total,
            totalAmountWithFee: totalAmountWithFee,
        }));
    };

    const payButtonLabel = isTestMode
        ? t("back.reg.payment.confirmTestRegistration")
        : isFreeOrder
            ? t("back.reg.payment.confirmRegistration") || "ยืนยันการสมัคร"
            : hasSelectedPayment
                ? t("back.reg.payment.proceedPayment")
                : t("back.reg.payment.selectMethod");

    // Layout follows the Stitch "ชำระเงิน - สรุปรายการคำสั่งซื้อ" screen (tester deck #12).
    return (
        <FrontLayout>
            <div className="mx-auto w-full max-w-[560px] px-4 pt-4">
                <div className="mb-4 flex items-center justify-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-[#4338ca]">
                        <CreditCardOutlined />
                    </span>
                    <h1 className="m-0 text-xl font-bold tracking-tight text-slate-900">{t("back.reg.payment.title")}</h1>
                </div>

                <div className="space-y-4">
                    <OrderDetails
                        orderNo={orderNo}
                        currentStatus={currentStatus}
                    />

                    <div>
                        <CouponSection
                            availableCoupons={availableCoupons}
                            couponCode={couponCode}
                            setCouponCode={setCouponCode}
                            setCouponType={setCouponType}
                            handleApplyCoupon={handleApplyCoupon}
                            handleApplyCouponSelected={handleApplyCouponSelected}
                            handleRemoveCoupon={handleRemoveCoupon}
                            isApplying={isApplying}
                            couponMsg={couponMsg}
                            couponMsgType={couponMsgType}
                            setCouponMsg={setCouponMsg}
                            setCouponMsgType={setCouponMsgType}
                            totalCoupon={totalCoupon}
                            couponMeta={couponMeta}
                            applicants={applicants}
                        />
                    </div>

                    <OrderSummary
                        itemCount={applicants?.length || 0}
                        totalShirtPrice={totalShirtPrice}
                        totalDeliveryFee={totalDeliveryFee}
                        totalAddOns={totalAddOns}
                        addOns={order?.addOns || []}
                        totalDiscount={totalDiscount}
                        totalCoupon={totalCoupon}
                        finalTotal={finalTotal}
                        feePercent={feePercent}
                        feeAmount={feeAmount}
                        totalAmountWithFee={totalAmountWithFee}
                        paymentDueTH={paymentDueTH}
                        formatMoney={formatMoney}
                    />

                    {isTestMode ? (
                        <Alert type="warning" showIcon message={t("back.reg.payment.testModeNotice")} />
                    ) : (
                        <PaymentMethods
                            selectedPayment={selectedPayment}
                            handlePaymentSelection={handlePaymentSelection}
                            options={paymentOptions}
                            optionsLoading={isLoadingPaymentOptions}
                            selectedBank={selectedBank}
                            onSelectBank={setSelectedBank}
                        />
                    )}
                </div>
            </div>

            {/* Net amount + pay button pinned to the bottom (Stitch). Before a method is picked the
                button stays bright and tapping it points at the method list. */}
            <div className="sticky bottom-0 z-30 mx-auto mt-6 w-full max-w-[528px] border-t border-slate-100 bg-white/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.04)] sm:rounded-t-2xl sm:border-x">
                {/* Narrower than 399px the bar tightens its gaps and, under 410px, the button drops its
                    arrow, so the label (TH and EN) stays on one line from 350px up; on narrower phones it
                    wraps rather than pushing the page sideways. */}
                <div className="flex w-full items-center justify-between gap-3 px-4 py-3 max-[399px]:gap-2 max-[399px]:px-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
                    <div className="flex shrink-0 flex-col">
                        <span className="text-[12px] text-slate-400">{t("back.reg.payment.netPay")}</span>
                        <span className="leading-tight">
                            <span className="text-xl font-bold text-[#4338ca]">{formatMoney(totalAmountWithFee)}</span>
                            <span className="ml-1 text-xs font-medium text-slate-600">{t("general.unitBaht")}</span>
                        </span>
                    </div>
                    <Button
                        type="primary"
                        className="min-w-0 !h-auto min-h-12 !py-2 max-[399px]:!px-3 max-[389px]:!text-[15px] !whitespace-normal flex-1 !rounded-xl !border-0 !font-semibold !text-base !text-white !shadow-[0_6px_18px_-4px_rgba(79,70,229,0.5)] !bg-gradient-to-r !from-[#4f46e5] !via-indigo-600 !to-[#3730a3]"
                        onClick={needsMethod ? promptForMethod : handleNext}
                        disabled={!canProceed && !needsMethod}
                        loading={isProceeding}
                    >
                        <span className="inline-flex items-center gap-2 text-center leading-tight">{payButtonLabel} <ArrowRightOutlined className="max-[410px]:!hidden" /></span>
                    </Button>
                </div>
            </div>
        </FrontLayout>
    );
}

export default RegistrationPayment;
