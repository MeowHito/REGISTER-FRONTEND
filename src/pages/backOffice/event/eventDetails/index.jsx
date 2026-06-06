import React, { useState } from 'react';
import { Button, Row, Col, Popover, Collapse, Card } from 'antd';
import CommonForm from "components/commonForm";
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import FloatingLabel from 'components/floatingLabel';
import Tiptap from 'components/tiptap';
import DraggableFormItem from 'components/draggableFormItem';
import { useTranslation } from 'react-i18next';
import { eventDetailTypeOption } from 'constants/options/eventDetailTypeOption';

const EventDetails = ({ form }) => {
    const { t } = useTranslation();
    const [usedTypes, setUsedTypes] = useState([]);

    const updateUsedTypes = () => {
        const all = form.getFieldValue('eventDetails') || [];
        const types = all.map((et) => et?.type).filter(Boolean);
        setUsedTypes(types);
    };

    return (
        <CommonForm.List name="eventDetails">
            {(fields, { add, remove, move }) => (
                <>
                    {fields.map(({ key, name, ...restField }, index) => {
                        const currentType = form.getFieldValue(["eventDetails", name, "type"]);

                        const filteredOptions = eventDetailTypeOption.map(opt => ({
                            ...opt,
                            disabled:
                                ["shirt", "reward"].includes(opt.value) &&
                                usedTypes.includes(opt.value) &&
                                opt.value !== currentType
                        }));

                        const items = [
                            {
                                key: '1',
                                label: t("back.event.form.detail"),
                                children: (
                                    <CommonForm.Item {...restField} name={[name, "detail"]}>
                                        <Tiptap />
                                    </CommonForm.Item>
                                )
                            },
                        ];

                        return (
                            <DraggableFormItem key={key} index={index} move={move}>
                                <Card
                                    className='mb-3'
                                    size="small"
                                    title={t("back.event.form.extraInfoNumber", { number: name + 1 })}
                                    extra={
                                        <Popover content={t("general.buttonDelete")}>
                                            <CloseOutlined onClick={() => {
                                                remove(name);
                                                setTimeout(updateUsedTypes, 0);
                                            }} />
                                        </Popover>
                                    }
                                >
                                    <Row data-prevent-drag gutter={{ xs: 2, md: 8 }} align="start">
                                        <Col xs={18}>
                                            <CommonForm.Item {...restField} name={[name, "title"]}>
                                                <FloatingLabel
                                                    size="large"
                                                    label={t("back.event.form.title")}
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={6}>
                                            <CommonForm.Item {...restField} name={[name, "type"]}>
                                                <FloatingLabel
                                                    type="select"
                                                    label={t("back.event.form.selectEventType")}
                                                    required
                                                    size="large"
                                                    options={filteredOptions}
                                                    onChange={() => {
                                                        setTimeout(updateUsedTypes, 0);
                                                    }}
                                                    filterOption={(input, option) =>
                                                        option.label.toLowerCase().includes(input.toLowerCase())
                                                    }
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                    </Row>
                                    <Collapse
                                        data-prevent-drag
                                        className='cursor-auto'
                                        items={items}
                                        defaultActiveKey={["1"]}
                                    />
                                </Card>
                            </DraggableFormItem>
                        );
                    })}
                    <div className='mb-3'>
                        <Button
                            type="dashed"
                            onClick={() => {
                                const currentDetails = form.getFieldValue("eventDetails") || [];
                                const currentTypes = currentDetails.map(d => d?.type);

                                let newType = "general";
                                if (!currentTypes.includes("general")) newType = "general";
                                else if (!currentTypes.includes("shirt")) newType = "shirt";
                                else if (!currentTypes.includes("reward")) newType = "reward";
                                else newType = "general";

                                add({ id: uuidv4(), type: newType });
                                setTimeout(updateUsedTypes, 0);
                            }}
                            block
                            icon={<PlusOutlined />}
                        >
                            {t("back.event.form.addExtraInfo")}
                        </Button>
                    </div>
                </>
            )}
        </CommonForm.List>
    );
};

export default EventDetails;

