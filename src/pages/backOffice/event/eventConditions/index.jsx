import React, { useMemo } from 'react';
import { Button, Row, Col, Popover } from 'antd';
import CommonForm from "components/commonForm";
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import FloatingLabel from 'components/floatingLabel';
import { useTranslation } from 'react-i18next';

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
                                        >
                                            <FloatingLabel
                                                size="large"
                                                label={t("back.event.form.conditionDescription")}
                                                required
                                            />
                                        </CommonForm.Item>
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

