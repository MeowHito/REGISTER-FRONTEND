import React from 'react';
import { Input, Select, Checkbox, DatePicker, Radio, Switch, Button } from 'antd';
import CommonForm from "components/commonForm";

const { Option } = Select;

const DynamicFieldForm = ({ fieldsData }) => {
    const [form] = CommonForm.useForm();

    const handleFinish = (values) => {
        console.log('Received values of form:', values);
    };

    return (
        <CommonForm
            form={form}
            name="dynamic_form"
            onFinish={handleFinish}
            autoComplete="off"
            layout="vertical"
        >
            {fieldsData.map((field, index) => (
                <CommonForm.Item
                    key={index}
                    name={field.name}
                    label={field.label}
                    rules={[{ required: field.required, message: field.message || 'กรุณากรอกข้อมูล' }]}
                >
                    {field.type === 'Dropdown' && (
                        <Select placeholder={field.placeholder || 'เลือกตัวเลือก'}>
                            {field.options.map((option, idx) => (
                                <Option key={idx} value={option.value}>{option.label}</Option>
                            ))}
                        </Select>
                    )}

                    {field.type === 'Checkbox' && (
                        <Checkbox.Group>
                            {field.options.map((option, idx) => (
                                <Checkbox key={idx} value={option.value}>{option.label}</Checkbox>
                            ))}
                        </Checkbox.Group>
                    )}

                    {field.type === 'Text' && (
                        <Input placeholder={field.placeholder || 'กรอกข้อมูล'} />
                    )}

                    {field.type === 'DatePicker' && (
                        <DatePicker placeholder={field.placeholder || 'เลือกวันที่'} />
                    )}

                    {field.type === 'Radio' && (
                        <Radio.Group>
                            {field.options.map((option, idx) => (
                                <Radio key={idx} value={option.value}>{option.label}</Radio>
                            ))}
                        </Radio.Group>
                    )}

                    {field.type === 'Switch' && (
                        <Switch defaultChecked={field.defaultChecked} />
                    )}
                </CommonForm.Item>
            ))}

            <CommonForm.Item>
                <Button type="primary" htmlType="submit">
                    Submit
                </Button>
            </CommonForm.Item>
        </CommonForm>
    );
};

export default DynamicFieldForm;
