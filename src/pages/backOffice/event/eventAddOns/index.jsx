import React from 'react';
import { Button, Row, Col, Popover, Card, Collapse, Tag, Switch } from 'antd';
import CommonForm from "components/commonForm";
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import FloatingLabel from 'components/floatingLabel';
import Tiptap from 'components/tiptap';
import DraggableFormItem from 'components/draggableFormItem';
import { useTranslation } from 'react-i18next';

/**
 * Optional packages an admin / organizer sells alongside the race entry —
 * accommodation, a photo package, a shuttle seat…
 *
 * Each row decides how it is bought: `perApplicant` off means one purchase for
 * the whole order with a quantity (2 hotel rooms), on means it is ticked per
 * runner (a photo package each). The registration page renders the matching
 * control, so this switch is the only thing the organizer has to think about.
 */
const EventAddOns = ({ form, isEditable = true }) => {
    const { t } = useTranslation();
    const addOns = CommonForm.useWatch("addOns", form) || [];

    return (
        <CommonForm.List name="addOns">
            {(fields, { add, remove, move }) => (
                <>
                    {fields.map(({ key, name, ...restField }, index) => {
                        const current = addOns[name] || {};
                        const perApplicant = !!current.perApplicant;
                        const soldOut = current.isSoldOut;
                        const usedQuota = current.usedQuota;

                        const items = [
                            {
                                key: 'description',
                                label: t("back.event.form.addOnDescription"),
                                children: (
                                    <CommonForm.Item {...restField} name={[name, "description"]}>
                                        <Tiptap />
                                    </CommonForm.Item>
                                ),
                            },
                        ];

                        return (
                            <DraggableFormItem key={key} index={index} move={move}>
                                <Card
                                    className="mb-3"
                                    size="small"
                                    title={
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span>{t("back.event.form.addOnNumber", { number: name + 1 })}</span>
                                            <Tag color={perApplicant ? "blue" : "green"}>
                                                {perApplicant
                                                    ? t("back.event.form.addOnPerApplicant")
                                                    : t("back.event.form.addOnPerOrder")}
                                            </Tag>
                                            {usedQuota > 0 ? (
                                                <Tag color="orange">
                                                    {t("back.event.form.addOnSoldCount", { count: usedQuota })}
                                                </Tag>
                                            ) : null}
                                            {soldOut ? <Tag color="red">{t("back.event.form.addOnSoldOut")}</Tag> : null}
                                        </div>
                                    }
                                    extra={
                                        isEditable ? (
                                            <Popover content={t("general.buttonDelete")}>
                                                <CloseOutlined onClick={() => remove(name)} />
                                            </Popover>
                                        ) : null
                                    }
                                >
                                    <Row data-prevent-drag gutter={{ xs: 2, md: 8 }}>
                                        <Col xs={24} md={12}>
                                            <CommonForm.Item
                                                {...restField}
                                                name={[name, "name"]}
                                                rules={[{ required: true, message: t("required.addOnName") }]}
                                            >
                                                <FloatingLabel
                                                    label={t("back.event.form.addOnName")}
                                                    required
                                                    readOnly={!isEditable}
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <CommonForm.Item {...restField} name={[name, "nameEn"]}>
                                                <FloatingLabel
                                                    label={t("back.event.form.addOnNameEn")}
                                                    readOnly={!isEditable}
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                    </Row>

                                    <Row data-prevent-drag gutter={{ xs: 2, md: 8 }}>
                                        <Col xs={24} md={8}>
                                            <CommonForm.Item {...restField} name={[name, "category"]}>
                                                <FloatingLabel
                                                    label={t("back.event.form.addOnCategory")}
                                                    readOnly={!isEditable}
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24} md={5}>
                                            <CommonForm.Item
                                                {...restField}
                                                name={[name, "price"]}
                                                rules={[{ required: true, message: t("required.addOnPrice") }]}
                                            >
                                                <FloatingLabel
                                                    type="number"
                                                    className="w-full"
                                                    min={0}
                                                    label={t("back.event.form.addOnPrice")}
                                                    addonAfter={t("general.unitBaht")}
                                                    required
                                                    readOnly={!isEditable}
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                        {/* Blank quota = unlimited; the backend treats null that way. */}
                                        <Col xs={12} md={5}>
                                            <CommonForm.Item {...restField} name={[name, "quota"]}>
                                                <FloatingLabel
                                                    type="number"
                                                    className="w-full"
                                                    min={0}
                                                    label={t("back.event.form.addOnQuota")}
                                                    readOnly={!isEditable}
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <CommonForm.Item
                                                {...restField}
                                                name={[name, "maxPerOrder"]}
                                                hidden={perApplicant}
                                            >
                                                <FloatingLabel
                                                    type="number"
                                                    className="w-full"
                                                    min={1}
                                                    label={t("back.event.form.addOnMaxPerOrder")}
                                                    readOnly={!isEditable}
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                    </Row>

                                    <Row data-prevent-drag gutter={{ xs: 2, md: 8 }} className="mb-3">
                                        <Col xs={24} md={12}>
                                            <div className="flex items-center gap-3">
                                                <CommonForm.Item
                                                    {...restField}
                                                    name={[name, "perApplicant"]}
                                                    valuePropName="checked"
                                                    className="!mb-0"
                                                >
                                                    <Switch disabled={!isEditable} />
                                                </CommonForm.Item>
                                                <span className="text-sm">
                                                    {t("back.event.form.addOnPerApplicantHelp")}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <div className="flex items-center gap-3">
                                                <CommonForm.Item
                                                    {...restField}
                                                    name={[name, "active"]}
                                                    valuePropName="checked"
                                                    className="!mb-0"
                                                >
                                                    <Switch disabled={!isEditable} />
                                                </CommonForm.Item>
                                                <span className="text-sm">{t("back.event.form.addOnActive")}</span>
                                            </div>
                                        </Col>
                                    </Row>

                                    <Row data-prevent-drag gutter={{ xs: 2, md: 8 }}>
                                        <Col xs={24} md={10}>
                                            <CommonForm.Item {...restField} name={[name, "noteLabel"]}>
                                                <FloatingLabel
                                                    label={t("back.event.form.addOnNoteLabel")}
                                                    readOnly={!isEditable}
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24} md={10}>
                                            <CommonForm.Item {...restField} name={[name, "noteLabelEn"]}>
                                                <FloatingLabel
                                                    label={t("back.event.form.addOnNoteLabelEn")}
                                                    readOnly={!isEditable}
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24} md={4}>
                                            <div className="flex items-center gap-2 h-[40px]">
                                                <CommonForm.Item
                                                    {...restField}
                                                    name={[name, "noteRequired"]}
                                                    valuePropName="checked"
                                                    className="!mb-0"
                                                >
                                                    <Switch size="small" disabled={!isEditable || !current.noteLabel} />
                                                </CommonForm.Item>
                                                <span className="text-sm">{t("back.event.form.addOnNoteRequired")}</span>
                                            </div>
                                        </Col>
                                    </Row>

                                    <Collapse data-prevent-drag className="cursor-auto" items={items} />
                                </Card>
                            </DraggableFormItem>
                        );
                    })}
                    {isEditable ? (
                        <div className="mb-3">
                            <Button
                                type="dashed"
                                onClick={() =>
                                    add({
                                        id: uuidv4(),
                                        perApplicant: false,
                                        active: true,
                                        noteRequired: false,
                                    })
                                }
                                block
                                icon={<PlusOutlined />}
                            >
                                {t("back.event.form.addAddOn")}
                            </Button>
                        </div>
                    ) : null}
                </>
            )}
        </CommonForm.List>
    );
};

export default EventAddOns;
