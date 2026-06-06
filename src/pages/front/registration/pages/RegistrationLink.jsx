import React, { useCallback, useEffect, useState } from 'react';
import { Card, Row, message, Spin, Button, Result } from 'antd';
import { CheckCircleOutlined, HourglassOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import backOfficeServices from 'services/backoffice.services';
import { useTranslation } from 'react-i18next';
import { handleQueryStatus } from 'utils/index';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { SET_ORDER } from 'store/reducers/contextSlice';

const TOKEN_STATUS = { VALID: 'valid', EXPIRED: 'expired', NOT_FOUND: 'not_found' };
const ORDER_STATUS = { PENDING: "PENDING", SUCCESS: "SUCCESS", FAILED: "FAILED", CANCELLED: "CANCELLED", REVIEW: "REVIEW" };

const RegistrationLink = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [token, setToken] = useState('');
    const [tokenStatus, setTokenStatus] = useState(null);

    const { data: orderToken, isFetching, ...other } = backOfficeServices.useQueryValidateOrderToken({ token });

    const {
        data: orderDetail,
        isFetching: isFetchingDetail,
        ...detailQuery
    } = backOfficeServices.useQuerygetHistoryDetail({
        orderId: orderToken?.orderNo,
    });

    const orderStatus = String(orderDetail?.status || "").toUpperCase().trim();
    const isFinal = [ORDER_STATUS.SUCCESS, ORDER_STATUS.FAILED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REVIEW].includes(orderStatus);
    const showProceeding = tokenStatus === TOKEN_STATUS.VALID && (!orderDetail || !isFinal);

    useEffect(() => {
        const tokenFromURL = searchParams.get('token');
        if (tokenFromURL) {
            setToken(tokenFromURL);
            setTokenStatus(null);
        } else {
            message.warning(t('back.reg.common.tokenMissing'));
            setTokenStatus(TOKEN_STATUS.NOT_FOUND);
        }
    }, [searchParams, t]);

    useEffect(() => {
        handleQueryStatus(other, () => {
            const ts = String(orderToken?.status || "").toLowerCase().trim();
            if (ts === TOKEN_STATUS.VALID) {
                setTokenStatus(TOKEN_STATUS.VALID);
            } else if (ts === TOKEN_STATUS.EXPIRED) {
                setTokenStatus(TOKEN_STATUS.EXPIRED);
            } else {
                setTokenStatus(TOKEN_STATUS.NOT_FOUND);
            }
        });
    }, [other.fetchStatus, orderToken]);

    const buildRegistrationDataFromDetail = useCallback((raw) => {
        if (!raw) return null;

        const formatted = raw.paymentDueDatetime
            ? dayjs(raw.paymentDueDatetime).toISOString()
            : "";
        const applicants = (raw.details || []).map((d) => ({
            type: "self",
            firstName: d.firstName || "",
            lastName: d.lastName || "",
            firstNameEn: d.firstNameEn || "",
            lastNameEn: d.lastNameEn || "",
            gender: d.gender || "",
            birthDate: d.birthDate ? dayjs(d.birthDate).toISOString() : null,
            email: d.email || "",
            phone: d.phone || "",
            idNo: d.idNo || "",
            nationality: d.nationality || "",
            address: d.address || "",
            province: d.province || "",
            amphoe: d.amphoe || "",
            district: d.district || "",
            zipcode: d.zipcode || "",
            shippingAddress: d.shippingAddress || "",
            shippingProvince: d.shippingProvince || "",
            shippingAmphoe: d.shippingAmphoe || "",
            shippingDistrict: d.shippingDistrict || "",
            shippingZipcode: d.shippingZipcode || "",
            deliveryMethod: d.deliveryMethod || "pickup",
            eventTypeId: d.eventTypeId || null,
            eventTypeName: d.eventTypeName || "",
            pricingId: d.pricingId || null,
            shirtSizeId: d.shirtSizeId || null,
            shirtTypeId: d.shirtTypeId || null,
            shirtSizeName: d.shirtSizeName || "",
            shirtTypeName: d.shirtTypeName || "",
            price: Number(d.price || 0),
            finalPrice: Number(d.netPrice ?? d.price ?? 0),
            couponDiscount: Number(d.couponDiscount || 0),
            discountNoShirt: Number(d.discountShirt || 0),
            shippingFee: Number(d.shippingFee || 0),
            noShirt: Number(d.discountShirt || 0) > 0,
            useCustomPrice: false,
            couponApplied: !!d.couponDiscount,
            couponCode: "",
            healthIssues: "",
            bloodType: "",
            emergencyContact: "",
            emergencyRelation: "",
            emergencyPhone: "",
            pictureUrl: "",
        }));

        const totalPrice = applicants
            .reduce((sum, a) => sum + Number(a.finalPrice || 0), 0)
            .toFixed(2);

        return {
            applicants,
            eventConditions: [],
            eventId: raw.eventId || "",
            orderNo: raw.orderNo || "",
            refNo: "",
            paymentDueDatetime: formatted,
            totalPrice,
            qrImage: "",
            validCouponIdNos: applicants.map((a) => a.idNo).filter(Boolean),
            orderId: raw?.uuid,
            paymentStatus: raw.status || ORDER_STATUS.PENDING,
        };
    }, []);

    useEffect(() => {
        handleQueryStatus(detailQuery, () => {
            if (!orderDetail) return;

            const model = buildRegistrationDataFromDetail(orderDetail);
            if (model) dispatch(SET_ORDER(model));

            if (orderStatus === ORDER_STATUS.PENDING) {
                navigate("/registrationPayment");
            }
        });
    }, [detailQuery.fetchStatus, orderDetail, orderStatus, buildRegistrationDataFromDetail, dispatch, navigate]);

    const handleProceed = () => {
        if (!orderDetail) return;
        if (orderStatus && orderStatus !== ORDER_STATUS.PENDING) return;

        const model = buildRegistrationDataFromDetail(orderDetail);
        if (!model) return;
        dispatch(SET_ORDER(model));
        navigate('/registrationPayment');
    };

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
                {isFetching || (tokenStatus === TOKEN_STATUS.VALID && isFetchingDetail) ? (
                    <Row justify="center" style={{ marginBottom: 24 }}>
                        <Spin size="large" />
                    </Row>
                ) : (
                    <>
                        {showProceeding && (
                            <Result
                                icon={<HourglassOutlined style={{ color: '#5e81d8ff' }} />}
                                status="info"
                                title={t('back.reg.common.tokenValid')}
                                subTitle={
                                    <span style={{ whiteSpace: 'pre-line' }}>
                                        {t('back.reg.common.proceeding')}
                                    </span>
                                }
                                extra={
                                    <Button
                                        type="primary"
                                        onClick={handleProceed}
                                        loading={isFetchingDetail}
                                        disabled={!orderDetail || orderStatus !== ORDER_STATUS.PENDING}
                                    >
                                        {t('back.reg.common.linkhere')}
                                    </Button>
                                }
                            />
                        )}
                        {tokenStatus === TOKEN_STATUS.EXPIRED && (
                            <Result
                                status="error"
                                title={t('back.reg.common.tokenExpired')}
                                subTitle={t('back.reg.common.pleaseRegisterAgain')}
                            />
                        )}
                        {tokenStatus === TOKEN_STATUS.NOT_FOUND && (
                            <Result
                                status="error"
                                title={t('back.reg.common.tokenNotFound')}
                                subTitle={t('back.reg.common.tokenInvalid')}
                            />
                        )}
                        {tokenStatus === TOKEN_STATUS.VALID && orderStatus === ORDER_STATUS.SUCCESS && (
                            <Result
                                status="success"
                                icon={<CheckCircleOutlined />}
                                title={t("back.reg.common.registrationCompleted")}
                                extra={<Button onClick={() => navigate('/')}>{t("back.reg.common.backToHome")}</Button>}
                            />
                        )}
                        {tokenStatus === TOKEN_STATUS.VALID && orderStatus === ORDER_STATUS.FAILED && (
                            <Result
                                status="error"
                                title={t('back.reg.common.orderClosed')}
                                extra={<Button onClick={() => navigate('/')}>{t("back.reg.common.backToHome")}</Button>}
                            />
                        )}
                        {tokenStatus === TOKEN_STATUS.VALID && orderStatus === ORDER_STATUS.CANCELLED && (
                            <Result
                                status="error"
                                title={t('back.reg.common.orderCancelled')}
                                extra={<Button onClick={() => navigate('/')}>{t("back.reg.common.backToHome")}</Button>}
                            />
                        )}
                        {tokenStatus === TOKEN_STATUS.VALID && orderStatus === ORDER_STATUS.REVIEW && (
                            <Result
                                status="warning"
                                title={t('back.reg.common.orderReview')}
                                subTitle={t('back.reg.common.orderReviewSubTitle')}
                                extra={<Button onClick={() => navigate('/')}>{t("back.reg.common.backToHome")}</Button>}
                            />
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};

export default RegistrationLink;
