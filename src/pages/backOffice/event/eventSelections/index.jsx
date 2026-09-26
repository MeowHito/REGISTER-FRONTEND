import { Button, Card, Row, Col, Popover, Checkbox, Space, Tooltip } from "antd";
import CommonForm from "components/commonForm";
import { ArrowDownOutlined, ArrowUpOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import FloatingLabel from "components/floatingLabel";
import { useTranslation } from "react-i18next";
import { useWatch } from "antd/es/form/Form";
import { useMemo } from "react";
import EventOptions from "../eventOptions";

/** Answer kinds an organizer can ask for; SINGLE / MULTIPLE need options, the others don't. */
const QUESTION_TYPES = ["SINGLE", "MULTIPLE", "TEXT", "RATING", "IMAGE"];
const hasOptions = (type) => type === "SINGLE" || type === "MULTIPLE";

/**
 * Extra questions, at event level (`eventName` undefined) or per distance. Event-level
 * questions can be filed under a sponsor questionnaire section.
 */
const EventSelections = ({ form, eventName }) => {
    const { t } = useTranslation();
    const namePath = eventName != undefined ? [eventName, "selectionFields"] : ["selectionFields"];

    const selectionFields = useWatch(eventName != undefined ? ["eventTypes", ...namePath] : namePath, form) || [];
    const sections = useWatch("questionSections", form) || [];
    const isEventLevel = eventName == undefined;

    const isAddDisabled = useMemo(() => {
        if (!selectionFields.length) return false;

        const last = selectionFields[selectionFields.length - 1];
        if (!last?.title || !last?.type) return true;
        if (!hasOptions(last.type)) return false;

        if (!Array.isArray(last?.options) || last.options.length === 0) return true;

        const lastOptions = last?.options[last?.options?.length - 1]
        const hasValidOption = lastOptions?.value
        if (!hasValidOption) return true;

        return false;
    }, [selectionFields]);

    const typeOptions = QUESTION_TYPES.map((v) => ({ value: v, label: t(`back.event.form.questionType.${v}`) }));
    const sectionOptions = sections
        .filter((s) => s?.id)
        .map((s) => ({ value: s.id, label: s.title || t("back.event.form.sectionUntitled") }));

    return (
        <CommonForm.List name={namePath}>
            {(fields, { add, remove, move }) => (
                <>
                    {fields.map(({ key, name, ...restField }, index) => {
                        const type = selectionFields?.[name]?.type;
                        return (
                            <Card
                                key={`event-selection-${key}`}
                                className="!mb-3"
                                size="small"
                                title={t("back.event.form.selectionFieldTitle", { number: name + 1 })}
                                extra={
                                    <Space size={4}>
                                        <Tooltip title={t("back.event.form.moveUp")}>
                                            <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0}
                                                onClick={() => move(index, index - 1)} />
                                        </Tooltip>
                                        <Tooltip title={t("back.event.form.moveDown")}>
                                            <Button size="small" icon={<ArrowDownOutlined />} disabled={index === fields.length - 1}
                                                onClick={() => move(index, index + 1)} />
                                        </Tooltip>
                                        <Popover content={t("general.buttonDelete")}>
                                            <Button size="small" danger icon={<CloseOutlined />} onClick={() => remove(name)} />
                                        </Popover>
                                    </Space>
                                }
                            >
                                <Row gutter={8}>
                                    <Col xs={24} md={12}>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, "title"]}
                                            rules={[{ required: true, message: t("required.title") }]}
                                        >
                                            <FloatingLabel label={t("back.event.form.selectionTitle")} required />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <CommonForm.Item {...restField} name={[name, "titleEn"]}>
                                            <FloatingLabel label={t("back.event.form.selectionTitleEn")} />
                                        </CommonForm.Item>
                                    </Col>
                                </Row>

                                <Row gutter={8}>
                                    <Col xs={24} md={isEventLevel ? 8 : 12}>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, "type"]}
                                            rules={[{ required: true, message: t("required.selectionType") }]}
                                        >
                                            <FloatingLabel
                                                type="select"
                                                label={t("back.event.form.selectionType")}
                                                required
                                                options={typeOptions}
                                                allowClear={false}
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                    {isEventLevel && (
                                        <Col xs={24} md={8}>
                                            <CommonForm.Item {...restField} name={[name, "sectionId"]}>
                                                <FloatingLabel
                                                    type="select"
                                                    label={t("back.event.form.questionSection")}
                                                    options={sectionOptions}
                                                    allowClear
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                    )}
                                    <Col xs={24} md={isEventLevel ? 8 : 12}>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, "required"]}
                                            valuePropName="checked"
                                        >
                                            <Checkbox className='!w-full !flex !items-center' size="large">
                                                {t("back.event.form.required")}
                                            </Checkbox>
                                        </CommonForm.Item>
                                    </Col>
                                </Row>

                                {hasOptions(type) ? (
                                    <EventOptions form={form} fieldName={[...namePath, name]} />
                                ) : type ? (
                                    <div className="text-xs text-[#6e6e73] -mt-2 mb-1">
                                        {t(`back.event.form.questionTypeHint.${type}`)}
                                    </div>
                                ) : null}
                            </Card>
                        );
                    })}
                    <CommonForm.Item>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => add({ type: "SINGLE", options: [], required: false })}
                            disabled={isAddDisabled}
                            block
                        >
                            {t("back.event.form.addSelectionField")}
                        </Button>
                    </CommonForm.Item>
                </>
            )}
        </CommonForm.List>
    );
};

export default EventSelections;
