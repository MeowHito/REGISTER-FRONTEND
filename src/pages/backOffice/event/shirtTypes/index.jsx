import React, { useMemo } from 'react';
import { Button, Row, Col, Popover, Card, Collapse } from 'antd';
import CommonForm from "components/commonForm";
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import FloatingLabel from 'components/floatingLabel';
import ShirtSizes from '../shirtSizes';
import { useTranslation } from 'react-i18next';

const ShirtTypes = ({ form }) => {
    const { t } = useTranslation();
    const eventTypes = CommonForm.useWatch("eventTypes", form) || [];

    const isAddDisabled = useMemo(() => {
        const shirtTypes = eventTypes?.shirtTypes || [];
        const last = shirtTypes[shirtTypes?.length - 1];

        return (
            eventTypes.length > 0 && shirtTypes.length > 0 &&
            (!last?.name)
        );
    }, [eventTypes]);

    return (
        <CommonForm.List name="shirtTypes">
            {(fields, { add, remove }) => (
                <>
                    {fields.map(({ key, name, ...restField }) => {
                        const items = [
                            {
                                key: '1',
                                label: t('back.event.form.shirtSize'),
                                children: <ShirtSizes form={form} shirtName={name} />
                            }
                        ];
                        return (
                            <Card
                                className='mb-2'
                                size="small"
                                title={`${t('back.event.form.shirtType')} ${name + 1}`}
                                key={key}
                                extra={
                                    <Popover content={t('general.buttonDelete')}>
                                        <CloseOutlined
                                            onClick={() => {
                                                remove(name);
                                            }}
                                        />
                                    </Popover>
                                }
                            >
                                <Row gutter={{ xs: 2, md: 8 }} key={key}>
                                    <Col xs={24} md={8}>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, 'name']}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("required.shirtTypeName"),
                                                },
                                            ]}
                                        >
                                            <FloatingLabel
                                                label={t("back.event.form.shirtTypeName")}
                                                required
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={24} md={16}>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, 'description']}
                                        >
                                            <FloatingLabel
                                                label={t("back.event.form.shirtTypeDescription")}
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                </Row>

                                <Collapse items={items} defaultActiveKey={["1"]} />
                            </Card>
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
                            {t("back.event.form.addShirtType")}
                        </Button>
                    </CommonForm.Item>
                </>
            )}
        </CommonForm.List>
    );
};

export default ShirtTypes;

