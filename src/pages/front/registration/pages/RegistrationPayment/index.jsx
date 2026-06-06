import React, { useEffect, useState } from 'react';
import { Button, message } from 'antd';
import FrontLayout from 'components/frontLayout';
import RegistrationSteps from '../../components/RegistrationSteps';
import backOfficeServices from 'services/backoffice.services';
import { handleQueryStatus } from 'utils';
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
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const order = useSelector(state => state.context.order) || {};
    const navigate = useNavigate();

    const [selectedPayment, setSelectedPayment] = useState(null);
    const [applicants, setApplicants] = useState([]);

    const [totalShirtPrice, setTotalShirtPrice] = useState(0);
    const [totalDeliveryFee, setTotalDeliveryFee] = useState(0);
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

    const { data: orderDetail, refetch: refetchOrderDetail, isFetching: isFetchingOrderDetail } = backOfficeServices.useQuerygetHistoryDetail({ orderId: order?.orderNo });
    const { data: coupons, ...other } = backOfficeServices.useQueryGetCouponByEventIds({ eventIds });

    const { status: currentStatus, paymentDueDatetime } = resolvePaymentState(orderDetail, order);

    const isPayable = isPayablePayment(currentStatus, paymentDueDatetime);
    const isFreeOrder = totalAmountWithFee <= 0;
    const hasSelectedPayment = !!selectedPayment;
    const canProceed = !isProceeding && !isFetchingOrderDetail && isPayable && (hasSelectedPayment || isFreeOrder);

    useEffect(() => {
        if (!isFetchingOrderDetail && currentStatus && currentStatus !== "PENDING") {
            const params = order?.orderNo ? `?invoiceNo=${encodeURIComponent(order.orderNo)}` : '';
            navigate(`/registrationPaymentResult${params}`, { replace: true });
        }
    }, [currentStatus, isFetchingOrderDetail]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setPaymentDueTH(paymentDueDatetime ? convertDateToThaiFormat(paymentDueDatetime) : "");
    }, [paymentDueDatetime]);

    useEffect(() => {
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
        const coupon = 0;

        setTotalShirtPrice(shirt);
        setTotalDeliveryFee(delivery);
        setTotalDiscount(discount);
        const total = (shirt + delivery) - discount - coupon;
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
                message.error(t("back.reg.payment.checkStatusFailed"));
                return;
            }
            const { status: latestStatus, paymentDueDatetime: latestDue } = resolvePaymentState(fresh.data, order);

            const isPayableLatest = isPayablePayment(latestStatus, latestDue);
            if (!isPayableLatest) {
                message.error(t("back.reg.payment.unavailable"));
                return;
            }

            if (totalAmountWithFee > 0 && !selectedPayment) {
                message.error("กรุณาเลือกช่องทางการชำระเงิน");
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
                    paymentType: selectedPayment || 'free',
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
                message.error(resData?.message || t("back.reg.payment.cannotProceed"));
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
                    message.error("เกิดข้อผิดพลาดในการเชื่อมต่อระบบชำระเงิน");
                }
                return;
            }
        } catch (err) {
            console.error("[RegistrationPayment] cannotProceed:", err);
            message.error(t("back.reg.payment.cannotProceed"));
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
            const resetTotal = totalShirtPrice + totalDeliveryFee - totalDiscount;
            const resetFee = Math.ceil(resetTotal * (feePercent / 100) * 100) / 100;
            setFinalTotal(resetTotal);
            setFeeAmount(resetFee);
            setTotalAmountWithFee(Math.ceil((resetTotal + resetFee) * 100) / 100);
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
                    const personalDiscount = isValid ? Number((netPrice * deductionPercentage / 100).toFixed(2)) : 0;
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
                const newTotal = totalShirtPrice + totalDeliveryFee - totalDiscount - totalCouponDiscount;
                const newFee = Math.ceil(newTotal * (feePercent / 100) * 100) / 100;
                setFinalTotal(newTotal);
                setFeeAmount(newFee);
                setTotalAmountWithFee(Math.ceil((newTotal + newFee) * 100) / 100);

            } else {
                setCouponMsg(t("back.reg.payment.notEligible"));
                setCouponMsgType('warning');
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || error?.message || t("back.reg.payment.checkFailed");
            setCouponMsg(errorMessage);
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

        const newTotal = totalShirtPrice + totalDeliveryFee - totalDiscount;
        const newFeeAmount = Math.ceil(newTotal * (feePercent / 100) * 100) / 100;
        const newTotalWithFee = Math.ceil((newTotal + newFeeAmount) * 100) / 100;

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

        const shirt = totalShirtPrice;
        const delivery = totalDeliveryFee;
        const discount = totalDiscount;

        const total = (shirt + delivery - discount - totalCoupon);
        const feePercent = calculatePaymentFeePercent(type);
        const feeAmount = Math.ceil(total * (feePercent / 100) * 100) / 100;
        const totalAmountWithFee = Math.ceil((total + feeAmount) * 100) / 100;

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

    return (
        <FrontLayout>
            <RegistrationSteps currentStep={2} />
            <div className="payment-container" style={{ maxWidth: "700px", margin: "0 auto" }}>
                <div className="text-2xl font-bold text-center text-gray-800 mb-4">💳 {t("back.reg.payment.title")}</div>

                <OrderDetails
                    orderNo={orderNo}
                    currentStatus={currentStatus}
                />

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

                <OrderSummary
                    totalShirtPrice={totalShirtPrice}
                    totalDeliveryFee={totalDeliveryFee}
                    totalDiscount={totalDiscount}
                    totalCoupon={totalCoupon}
                    finalTotal={finalTotal}
                    feePercent={feePercent}
                    feeAmount={feeAmount}
                    totalAmountWithFee={totalAmountWithFee}
                    paymentDueTH={paymentDueTH}
                    formatMoney={formatMoney}
                />

                <PaymentMethods
                    selectedPayment={selectedPayment}
                    handlePaymentSelection={handlePaymentSelection}
                />

                <div className="flex justify-center mt-6">
                    <Button
                        type="primary"
                        style={{
                            padding: "0 24px",
                            height: "44px",

                            ...(canProceed
                                ? { backgroundColor: "#FFB946", borderColor: "#FFB946" }
                                : {}),
                        }}
                        onClick={handleNext}
                        disabled={!canProceed}
                        loading={isProceeding}
                    >
                        {isFreeOrder
                            ? t("back.reg.payment.confirmRegistration") || "ยืนยันการสมัคร"
                            : hasSelectedPayment
                                ? t("back.reg.payment.proceedPayment")
                                : t("back.reg.payment.selectMethod")}
                    </Button>
                </div>
            </div>
        </FrontLayout>
    );
}

export default RegistrationPayment;
