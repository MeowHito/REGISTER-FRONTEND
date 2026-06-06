import { Button, Card, Row, Col, Popover, Checkbox } from "antd";
import CommonForm from "components/commonForm";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import FloatingLabel from "components/floatingLabel";
import { useTranslation } from "react-i18next";
import { useWatch } from "antd/es/form/Form";
import { useMemo } from "react";
import EventOptions from "../eventOptions";

const EventSelections = ({ form, eventName }) => {
    const { t } = useTranslation();
    const namePath = eventName != undefined ? [eventName, "selectionFields"] : ["selectionFields"];

    const selectionFields = useWatch(eventName != undefined ? ["eventTypes", ...namePath] : namePath, form) || [];

    const isAddDisabled = useMemo(() => {
        if (!selectionFields.length) return false;

        const last = selectionFields[selectionFields.length - 1];
        if (!last?.title || !last?.type) return true;
        
        if (!Array.isArray(last?.options) || last.options.length === 0) return true;
        
        const lastOptions = last?.options[last?.options?.length - 1]
        const hasValidOption = lastOptions?.value
        if (!hasValidOption) return true;

        return false;
    }, [selectionFields]);

    return (
        <CommonForm.List name={namePath}>
            {(fields, { add, remove }) => (
                <>
                    {fields.map(({ key, name, ...restField }) => (
                        <Card
                            key={`event-selection-${key}`}
                            className="!mb-3"
                            size="small"
                            title={t("back.event.form.selectionFieldTitle", { number: name + 1 })}
                            extra={
                                <Popover content={t("general.buttonDelete")}>
                                    <CloseOutlined onClick={() => remove(name)} />
                                </Popover>
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
                                    <CommonForm.Item
                                        {...restField}
                                        name={[name, "titleEn"]}
                                    >
                                        <FloatingLabel label={t("back.event.form.selectionTitleEn")} />
                                    </CommonForm.Item>
                                </Col>
                            </Row>

                            <Row gutter={8}>
                                <Col xs={24} md={12}>
                                    <CommonForm.Item
                                        {...restField}
                                        name={[name, "type"]}
                                        rules={[{ required: true, message: t("required.selectionType") }]}
                                    >
                                        <FloatingLabel
                                            type="select"
                                            label={t("back.event.form.selectionType")}
                                            required
                                            options={[
                                                { label: "Single", value: "SINGLE" },
                                                { label: "Multiple", value: "MULTIPLE" },
                                            ]}
                                        />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <CommonForm.Item
                                        {...restField}
                                        name={[name, "required"]}
                                        valuePropName="checked"
                                    >
                                        <Checkbox
                                            className='!w-full !flex !items-center'
                                            size="large">
                                            {t("back.event.form.required")}
                                        </Checkbox>
                                    </CommonForm.Item>
                                </Col>
                            </Row>

                            <EventOptions form={form} fieldName={[...namePath, name]} />
                        </Card>
                    ))}
                    <CommonForm.Item>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => add({ options: [] })}
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

