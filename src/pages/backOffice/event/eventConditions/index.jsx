import React, { useMemo } from 'react';
import { Button, Row, Col, Popover } from 'antd';
import CommonForm from "components/commonForm";
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import FloatingLabel from 'components/floatingLabel';
import { useTranslation } from 'react-i18next';
import ConditionText from 'components/conditionText';
import { parseCondition } from 'components/conditionText/parse';

/** How the condition will look to runners, plus a nudge when {braces} have no detail yet. */
const ConditionPreview = ({ cond }) => {
    const { t } = useTranslation();
    const text = cond?.description || "";
    const braced = parseCondition(text).some((p) => p.link);
    const hasDetail = !!String(cond?.detail || "").trim();
    if (!braced && !hasDetail) return null; // a plain condition looks exactly like what was typed
    const noDetail = braced && !hasDetail;
    return (
        <div className="mb-4 rounded-lg bg-[#f5f5f7] px-3 py-2 text-[13px] text-[#3f4850]">
            <span className="text-[#86868b] mr-1.5">{t("back.event.form.conditionPreview")}</span>
            <ConditionText text={text} detail={cond?.detail} onOpen={() => {}} />
            {noDetail ? <div className="mt-1 text-[#c2410c]">{t("back.event.form.conditionBraceNoDetail")}</div> : null}
        </div>
    );
};

const EventConditions = ({ form }) => {
    const { t } = useTranslation();
    const eventConditions = CommonForm.useWatch("eventConditions", form) || [];

    const isAddDisabled = useMemo(() => {
        const last = eventConditions[eventConditions.length - 1];
        return eventConditions.length > 0 &&
            (!last?.description);
    }, [eventConditions]);

    return (
        <CommonForm.List name="eventConditions">
            {(fields, { add, remove }) => {

                return (
                    <>
                        <p className="mb-3 text-[13px] leading-relaxed text-[#6e6e73]">{t("back.event.form.conditionHint")}</p>
                        {fields.map(({ key, name, ...restField }, index) => (
                            <React.Fragment key={key}>
                                <Row gutter={{ xs: 2, md: 8 }} align="start" >
                                    <Col xs={0} md={1} className='mt-2 text-right'>
                                        <div className='inline'>{index + 1}.</div>
                                    </Col>
                                    <Col xs={23} md={22}>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, "description"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("required.condition"),
                                                },
                                            ]}
                                            className="mb-2"
                                        >
                                            <FloatingLabel
                                                size="large"
                                                label={t("back.event.form.conditionDescription")}
                                                required
                                            />
                                        </CommonForm.Item>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, "detail"]}
                                            rules={[{ max: 20000, message: t("back.event.form.conditionDetailTooLong") }]}
                                            className="mb-2"
                                        >
                                            <FloatingLabel
                                                type="textarea"
                                                label={t("back.event.form.conditionDetail")}
                                                autoSize={{ minRows: 2, maxRows: 10 }}
                                            />
                                        </CommonForm.Item>
                                        <ConditionPreview cond={eventConditions[index]} />
                                    </Col>
                                    <Col xs={1} className='mt-2'>
                                        <Popover content={t("general.buttonDelete")}>
                                            <CloseOutlined
                                                onClick={() => {
                                                    remove(name);
                                                }}
                                            />
                                        </Popover>
                                    </Col>
                                </Row>
                            </React.Fragment>
                        ))}
                        <CommonForm.Item className="mb-3">
                            <Button
                                type="dashed"
                                onClick={() => add({ id: uuidv4() })}
                                block
                                icon={<PlusOutlined />}
                                disabled={isAddDisabled}
                            >
                                {t("back.event.form.addCondition")}
                            </Button>
                        </CommonForm.Item>
                    </>
                )
            }}
        </CommonForm.List>
    );
};

export default EventConditions;

