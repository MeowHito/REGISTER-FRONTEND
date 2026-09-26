import React from 'react';
import { Button, Row, Col, Popover, Card, Collapse, Tag, Tooltip, Space } from 'antd';
import CommonForm from "components/commonForm";
import { ArrowDownOutlined, ArrowUpOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import FloatingLabel from 'components/floatingLabel';
import ShirtSizes from '../shirtSizes';
import { useTranslation } from 'react-i18next';

const SHIRT_CATEGORIES = ["RACE", "FINISHER", "SPECIAL"];

const categoryColor = { RACE: "blue", FINISHER: "gold", SPECIAL: "purple" };

/**
 * Shirt styles of the event, each under a category (race / finisher / special) with its own
 * sizes. A runner picks one style per category the event offers; a style can be limited to
 * some distances (e.g. a finisher shirt only for 21K and up, a VIP shirt only for the VIP
 * distance).
 */
const ShirtTypes = ({ form }) => {
    const { t } = useTranslation();
    const shirtTypes = CommonForm.useWatch("shirtTypes", form) || [];
    const eventTypes = CommonForm.useWatch("eventTypes", form) || [];

    const eventTypeOptions = eventTypes
        .filter((et) => et?.id)
        .map((et) => ({ value: et.id, label: et.name || t("back.event.form.eventTypeName") }));

    const categoryOptions = SHIRT_CATEGORIES.map((c) => ({
        value: c,
        label: t(`back.event.form.shirtCategory.${c}`),
    }));

    const last = shirtTypes[shirtTypes.length - 1];
    const isAddDisabled = shirtTypes.length > 0 && !last?.name;

    return (
        <>
            <div className="rounded-xl bg-[#f0f6ff] border border-[#cfe2fb] text-[13px] text-[#0b4f99] px-4 py-3 mb-4">
                {t("back.event.form.shirtCategoryHelp")}
            </div>
            <CommonForm.List name="shirtTypes">
                {(fields, { add, remove, move }) => (
                    <>
                        {fields.map(({ key, name, ...restField }, index) => {
                            const category = shirtTypes?.[name]?.category || "RACE";
                            const used = (shirtTypes?.[name]?.shirtSizes || [])
                                .reduce((sum, s) => sum + Number(s?.usedCount || 0), 0);
                            const items = [{
                                key: '1',
                                label: t('back.event.form.shirtSize'),
                                children: <ShirtSizes form={form} shirtName={name} />
                            }];
                            return (
                                <Card
                                    className='mb-2'
                                    size="small"
                                    title={
                                        <Space size={6} wrap>
                                            <span>{`${t('back.event.form.shirtType')} ${index + 1}`}</span>
                                            <Tag color={categoryColor[category] || "blue"} className="!m-0 !rounded-full">
                                                {t(`back.event.form.shirtCategory.${category}`)}
                                            </Tag>
                                            {used > 0 && (
                                                <Tag color="orange" className="!m-0 !rounded-full">
                                                    {t('back.event.form.shirtSizeUsed', { count: used })}
                                                </Tag>
                                            )}
                                        </Space>
                                    }
                                    key={key}
                                    extra={
                                        <Space size={4}>
                                            <Tooltip title={t('back.event.form.moveUp')}>
                                                <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0}
                                                    onClick={() => move(index, index - 1)} />
                                            </Tooltip>
                                            <Tooltip title={t('back.event.form.moveDown')}>
                                                <Button size="small" icon={<ArrowDownOutlined />} disabled={index === fields.length - 1}
                                                    onClick={() => move(index, index + 1)} />
                                            </Tooltip>
                                            <Popover content={used > 0 ? t('back.event.form.shirtTypeDeleteBlocked') : t('general.buttonDelete')}>
                                                <Button size="small" danger icon={<CloseOutlined />} disabled={used > 0}
                                                    onClick={() => remove(name)} />
                                            </Popover>
                                        </Space>
                                    }
                                >
                                    <Row gutter={{ xs: 2, md: 8 }} key={key}>
                                        <Col xs={24} md={6}>
                                            <CommonForm.Item {...restField} name={[name, 'category']}>
                                                <FloatingLabel
                                                    type="select"
                                                    label={t("back.event.form.shirtCategoryLabel")}
                                                    options={categoryOptions}
                                                    allowClear={false}
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <CommonForm.Item
                                                {...restField}
                                                name={[name, 'name']}
                                                rules={[{ required: true, message: t("required.shirtTypeName") }]}
                                            >
                                                <FloatingLabel label={t("back.event.form.shirtTypeName")} required />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24} md={10}>
                                            <CommonForm.Item {...restField} name={[name, 'description']}>
                                                <FloatingLabel label={t("back.event.form.shirtTypeDescription")} />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24}>
                                            <CommonForm.Item
                                                {...restField}
                                                name={[name, 'eventTypeIds']}
                                                extra={t("back.event.form.shirtEventTypesHint")}
                                            >
                                                <FloatingLabel
                                                    type="select"
                                                    mode="multiple"
                                                    label={t("back.event.form.shirtEventTypes")}
                                                    options={eventTypeOptions}
                                                    allowClear
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
                                onClick={() => add({ id: uuidv4(), category: "RACE", eventTypeIds: [], shirtSizes: [] })}
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
        </>
    );
};

export default ShirtTypes;
