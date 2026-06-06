import React, { useMemo } from 'react';
import { Button, Row, Col, Popover } from 'antd';
import CommonForm from "components/commonForm";
import { AlertConfirm } from 'components/alert';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import FloatingLabel from 'components/floatingLabel';
import { useTranslation } from 'react-i18next';

const PaymentTypes = ({ form }) => {
    const { t } = useTranslation();
    const paymentTypes = CommonForm.useWatch("paymentTypes", form) || [];
    const startRegistrationDate = CommonForm.useWatch("startRegistrationDate", form);
    const endRegistrationDate = CommonForm.useWatch("endRegistrationDate", form);

    const isAddDisabled = useMemo(() => {
        const last = paymentTypes[paymentTypes.length - 1];
        return paymentTypes.length > 0 &&
            (!last?.name || !last?.endDate);
    }, [paymentTypes]);

    const handleRemove = (remove, name) => {
        const paymentTypeToRemove = paymentTypes[name];
        const currentEventTypes = form.getFieldValue("eventTypes") || [];

        let isUsed = false;
        if (paymentTypeToRemove?.id && currentEventTypes.length > 0) {
            isUsed = currentEventTypes.some(eventType =>
                eventType.pricing && Array.isArray(eventType.pricing) &&
                eventType.pricing.some(price => price.paymentTypeId === paymentTypeToRemove.id)
            );
        }

        const executeRemove = () => {
            if (paymentTypeToRemove?.id && currentEventTypes.length > 0) {
                const updatedEventTypes = currentEventTypes.map(eventType => {
                    if (eventType.pricing && Array.isArray(eventType.pricing)) {
                        return {
                            ...eventType,
                            pricing: eventType.pricing.filter(price => price.paymentTypeId !== paymentTypeToRemove.id)
                        };
                    }
                    return eventType;
                });
                form.setFieldValue("eventTypes", updatedEventTypes);
            }
            remove(name);
        };

        if (isUsed) {
            AlertConfirm({
                title: t("general.confirmDelete"),
                text: t("back.event.form.removePaymentTypeConfirm"),
                onOk: executeRemove
            });
        } else {
            executeRemove();
        }
    };

    return (
        <CommonForm.List name="paymentTypes">
            {(fields, { add, remove }) => (
                <>
                    {fields.map(({ key, name, ...restField }, index) => {
                        const prevEndDate = index > 0 ? paymentTypes[index - 1]?.endDate : null;
                        const minDate = prevEndDate ? dayjs(prevEndDate).add(1, 'minute') : dayjs(startRegistrationDate);

                        return (
                            <React.Fragment key={key}>
                                <Row gutter={{ xs: 2, md: 8 }} align="start">
                                    <Col xs={0} md={1} className="mt-2 text-right">
                                        <div className="inline">{index + 1}.</div>
                                    </Col>
                                    <Col xs={24} md={16}>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, "name"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("required.paymentTypeName"),
                                                },
                                            ]}
                                        >
                                            <FloatingLabel
                                                size="large"
                                                label={t("back.event.form.paymentTypeName")}
                                                required
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={22} md={6}>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, "endDate"]}
                                            dependencies={['endRegistrationDate']}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("required.endDate"),
                                                },
                                                {
                                                    validator: (_, value) => {
                                                        if (!value || !prevEndDate) return Promise.resolve();
                                                        return dayjs(value).isAfter(dayjs(prevEndDate))
                                                            ? Promise.resolve()
                                                            : Promise.reject(t("validation.endDateAfterPrevious"));
                                                    },
                                                },
                                                {
                                                    validator: (_, value) => {
                                                        if (!value || !endRegistrationDate) return Promise.resolve();
                                                        return dayjs(value).isBefore(dayjs(endRegistrationDate)) || dayjs(value).isSame(dayjs(endRegistrationDate))
                                                            ? Promise.resolve()
                                                            : Promise.reject(new Error(t("validation.paymentEndDateBeforeRegistrationEnd")));
                                                    },
                                                },
                                            ]}
                                        >
                                            <FloatingLabel
                                                type="date"
                                                showTime
                                                size="large"
                                                label={t("back.event.form.endDate")}
                                                className="w-full"
                                                required
                                                minDate={minDate}
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={1} className="mt-2">
                                        <Popover content={t("general.buttonDelete")}>
                                            <CloseOutlined onClick={() => handleRemove(remove, name)} />
                                        </Popover>
                                    </Col>
                                </Row>
                            </React.Fragment>
                        );
                    })}

                    <CommonForm.Item className="mb-3">
                        <Button
                            type="dashed"
                            onClick={() => add({ id: uuidv4() })}
                            block
                            icon={<PlusOutlined />}
                            disabled={isAddDisabled}
                        >
                            {t("back.event.form.addPaymentType")}
                        </Button>
                    </CommonForm.Item>
                </>
            )}
        </CommonForm.List>

    );
};

export default PaymentTypes;

