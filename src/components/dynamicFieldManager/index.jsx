import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Input, Button, Select, Row, Col, Popover, Switch } from 'antd';
import CommonForm from "components/commonForm";
import { BorderOutlined, CalendarOutlined, CheckSquareOutlined, DeleteOutlined, DownCircleOutlined, FontColorsOutlined, CloseOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

const { Option, OptGroup } = Select;
const DynamicFieldManager = ({ sendFieldsChange }) => {
    const [form] = CommonForm.useForm();
    const inputRefs = useRef({});
    const [focusIndex, setFocusIndex] = useState(null);
    const [optionFocusIndex, setOptionFocusIndex] = useState(null);

    const fielType = useMemo(() => [
        {
            label: 'Input Types',
            options: [
                { value: 'Text', label: <><FontColorsOutlined /> Text</> },
                { value: 'DatePicker', label: <><CalendarOutlined /> Date</> }
            ]
        },
        {
            label: 'Selection Types',
            options: [
                { value: 'Dropdown', label: <><DownCircleOutlined /> Dropdown</> },
                { value: 'Checkbox', label: <><CheckSquareOutlined /> Checkbox</> },
                { value: 'Radio', label: <>⦿ Radio</> }
            ]
        }
    ], []);

    useEffect(() => {
        if (focusIndex !== null && optionFocusIndex !== null) {
            const key = `${focusIndex}-${optionFocusIndex}`;
            if (inputRefs.current[key]) {
                inputRefs.current[key].focus();
                setFocusIndex(null);
                setOptionFocusIndex(null);
            }
        }
    }, [focusIndex, optionFocusIndex]);

    useEffect(() => {
        const fields = form.getFieldsValue().fields || [];
        const updatedFields = [];

        fields.forEach((field, index) => {
            if (field && (field.fieldType === 'Text' || field.fieldType === 'DatePicker') && field.options?.length) {
                updatedFields.push({
                    name: ['fields', index, 'options'],
                    value: [],
                });
            }
        });

        if (updatedFields.length > 0) {
            form.setFields(updatedFields);
        }
    }, [form.getFieldsValue().fields]);


    const formatFields = (fields) => {
        return fields?.map(field => ({
            fieldName: field?.fieldName || '',
            fieldType: field?.fieldType || '',
            fieldRequired: field?.fieldRequired || false,
            fieldOptions: field?.options ? field.options.map(option => option?.dataOptions || '') : [],
        }));
    };

    const debouncedHandleFieldsChange = debounce(() => {
        const values = form.getFieldsValue();
        const formattedFields = formatFields(values.fields || []);
        sendFieldsChange(formattedFields);
    }, 2000);

    return (
        <CommonForm
            form={form}
            name="dynamic_form_nest_item"
            autoComplete="off"
            layout="vertical"
            onFieldsChange={debouncedHandleFieldsChange}
        >
            <CommonForm.List name="fields">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }, index) => (
                            <div key={key} >
                                <Row gutter={16} align="middle">
                                    <Col span={10}>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, 'fieldName']}
                                            label={`${index + 1} . ชื่อหัวข้อ`}
                                            rules={[{ required: true, message: 'กรุณากรอกชื่อหัวข้อ' }]}
                                        >
                                            <Input placeholder="กรอกชื่อหัวข้อ" />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col span={11}>
                                        <CommonForm.Item
                                            {...restField}
                                            name={[name, 'fieldType']}
                                            label="ประเภทของฟิลด์"
                                            rules={[{ required: true, message: 'กรุณาเลือกประเภทของฟิลด์' }]}
                                        >
                                            <Select placeholder="เลือกประเภทของฟิลด์">
                                                {fielType.map(group => (
                                                    <OptGroup key={group.label} label={group.label}>
                                                        {group.options.map(option => (
                                                            <Option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </Option>
                                                        ))}
                                                    </OptGroup>
                                                ))}
                                            </Select>
                                        </CommonForm.Item>
                                    </Col>
                                    <Col span={2}>
                                        <CommonForm.Item
                                            {...restField}
                                            label="จำเป็น"
                                            name={[name, "fieldRequired"]}
                                        >
                                            <Switch />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col span={1} style={{ textAlign: 'right' }} >
                                        <Popover content="ลบ">
                                            <DeleteOutlined
                                                onClick={() => {
                                                    Object.keys(inputRefs.current).forEach(key => {
                                                        if (key.startsWith(`${index}-`)) {
                                                            delete inputRefs.current[key];
                                                        }
                                                    });
                                                    remove(name);
                                                }}
                                                style={{ fontSize: '26px', color: 'gray', cursor: 'pointer' }}
                                            />
                                        </Popover>
                                    </Col>
                                </Row>
                                <CommonForm.Item
                                    shouldUpdate={(prevValues, curValues) =>
                                        prevValues.fields?.[index]?.fieldType !== curValues.fields?.[index]?.fieldType
                                    }
                                    noStyle={!['Checkbox', 'Dropdown', 'Radio'].includes(form.getFieldValue(['fields', index, 'fieldType']))}
                                >
                                    {() => {
                                        const fieldType = form.getFieldValue(['fields', index, 'fieldType']);
                                        if (['Checkbox', 'Dropdown', 'Radio'].includes(fieldType)) {
                                            return (
                                                <CommonForm.List name={[name, 'options']} >
                                                    {(optionFields, { add: addOption, remove: removeOption }) => (
                                                        <>
                                                            {optionFields.map(({ key: optionKey, name: optionName, ...restOptionField }, optionIndex) => (
                                                                <Row key={optionKey} gutter={16} align="top">
                                                                    <Col span={1} style={{ fontSize: '20px', textAlign: 'right' }}>
                                                                        {fieldType === 'Checkbox' && <BorderOutlined />}
                                                                        {fieldType === 'Dropdown' && <MinusOutlined />}
                                                                        {fieldType === 'Radio' && <span style={{ fontSize: '20px' }}>◯</span>}
                                                                    </Col>
                                                                    <Col span={22}>
                                                                        <CommonForm.Item
                                                                            {...restOptionField}
                                                                            name={[optionName, 'dataOptions']}
                                                                            rules={[{ required: true, message: 'กรุณากรอกตัวเลือก' }]}
                                                                            className="mb-2"
                                                                        >
                                                                            <Input
                                                                                placeholder="กรอกตัวเลือก"
                                                                                ref={el => {
                                                                                    if (el) {
                                                                                        const optionKey = `${index}-${optionIndex}`;
                                                                                        inputRefs.current[optionKey] = el;
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </CommonForm.Item>
                                                                    </Col>
                                                                    <Col span={1} style={{ textAlign: 'right' }} >
                                                                        <Popover content="นำออก">
                                                                            <CloseOutlined
                                                                                onClick={() => {
                                                                                    delete inputRefs.current[`${index}-${optionKey}`];
                                                                                    removeOption(optionName);
                                                                                }}
                                                                                style={{ fontSize: '26px', color: 'gray', cursor: 'pointer', }}
                                                                            />
                                                                        </Popover>
                                                                    </Col>
                                                                </Row>
                                                            ))}
                                                            <CommonForm.Item noStyle>
                                                                <Row gutter={16} align="top">
                                                                    <Col span={1} style={{ fontSize: '20px', textAlign: 'right' }}>
                                                                        {fieldType === 'Checkbox' && <BorderOutlined />}
                                                                        {fieldType === 'Dropdown' && <MinusOutlined />}
                                                                        {fieldType === 'Radio' && <span style={{ fontSize: '20px' }}>◯</span>}
                                                                    </Col>
                                                                    <Col span={22}>
                                                                        <Button type="dashed" className="w-full text-start" onClick={() => {
                                                                            addOption();
                                                                            setFocusIndex(index);
                                                                            setOptionFocusIndex(optionFields.length);
                                                                        }}>
                                                                            เพิ่มตัวเลือก
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                            </CommonForm.Item>
                                                        </>
                                                    )}
                                                </CommonForm.List>
                                            );
                                        }
                                        return null;
                                    }}
                                </CommonForm.Item>
                            </div>
                        ))}
                        <CommonForm.Item>
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                เพิ่มฟิลด์
                            </Button>
                        </CommonForm.Item>
                    </>
                )}
            </CommonForm.List>
        </CommonForm>
    );
};

export default DynamicFieldManager;

