import React, { useState, useMemo } from 'react';
import { Button, Table, Space, Image, Switch, Popconfirm, Modal, Input, InputNumber, Select } from 'antd';
import CommonForm from "components/commonForm";
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import backOfficeServices from 'services/backoffice.services';
import useUploadFileHook from 'hooks/useUploadFileHook';
import ImageUpload from 'components/imageUpload';
import { getImageFileToUpload } from 'utils/fileUtils';

const { TextArea } = Input;

function BannerSetting() {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlider, setEditingSlider] = useState(null);
    const [form] = CommonForm.useForm();
    const prefix = "slider";
    
    const imageHooks = useUploadFileHook();
    const { fileList: imageFileList, setFileList: setImageFileList } = imageHooks;

    const paging = useMemo(() => ({
        size: 100,
        page: 0,
        sortField: 'position',
        sortDirection: 'asc'
    }), []);

    const queryKey = useMemo(() => ["getAllSliders", paging], [paging]);

    const { data: sliders, isLoading, refetch } = backOfficeServices.useQueryGetAllSliders({ paging, queryKey });
    const deleteMutation = backOfficeServices.useMutationDeleteSlider(() => refetch());
    const createMutation = backOfficeServices.useMutationCreateSlider(() => {
        setIsModalOpen(false);
        form.resetFields();
        setImageFileList([]);
        refetch();
    });
    const updateMutation = backOfficeServices.useMutationUpdateSlider(() => {
        setIsModalOpen(false);
        form.resetFields();
        setImageFileList([]);
        setEditingSlider(null);
        refetch();
    });

    const handleAdd = () => {
        setEditingSlider(null);
        form.resetFields();
        setImageFileList([]);
        
        const nextPosition = sliders?.totalElements || 0;
        
        form.setFieldsValue({
            alignment: 'text-center',
            position: nextPosition,
            active: true,
        });
        
        setIsModalOpen(true);
    };

    const handleEdit = (record) => {
        setEditingSlider(record);
        
        form.setFieldsValue({
            descriptionEn: record.descriptionEn,
            descriptionTh: record.descriptionTh,
            alignment: record.alignment || 'text-center',
            position: record.position || 0,
            active: record.active !== false,
        });
        
        if (record.imagePreviewUrl) {
            setImageFileList([{
                uid: '-1',
                name: record.imageUrl,
                status: 'done',
                url: record.imagePreviewUrl,
            }]);
        }
        
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        deleteMutation.mutate({ id });
    };

    const handleSubmit = async (values) => {
        const imageUrl = await getImageFileToUpload({
            fileList: imageFileList,
            prefix,
            oldKey: editingSlider?.imageUrl,
            isPublic: true
        });

        if (!imageUrl) {
            return;
        }

        const payload = {
            descriptionEn: values.descriptionEn,
            descriptionTh: values.descriptionTh,
            imageUrl,
            alignment: values.alignment || 'text-center',
            position: values.position,
            active: values.active !== false,
        };

        if (editingSlider) {
            updateMutation.mutate({ ...payload, id: editingSlider.id });
        } else {
            createMutation.mutate(payload);
        }
    };

    const columns = [
        {
            title: t("backOffice.slider.image"),
            dataIndex: 'imagePreviewUrl',
            key: 'imagePreviewUrl',
            width: 120,
            render: (imagePreviewUrl) => (
                <Image
                    src={imagePreviewUrl}
                    alt="Banner"
                    width={80}
                    height={50}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    placeholder
                />
            ),
        },
        {
            title: t("backOffice.slider.descriptionEn"),
            dataIndex: 'descriptionEn',
            key: 'descriptionEn',
            ellipsis: true,
        },
        {
            title: t("backOffice.slider.descriptionTh"),
            dataIndex: 'descriptionTh',
            key: 'descriptionTh',
            ellipsis: true,
        },
        {
            title: t("backOffice.slider.position"),
            dataIndex: 'position',
            key: 'position',
            width: 100,
            align: 'center',
        },
        {
            title: t("backOffice.slider.status"),
            dataIndex: 'active',
            key: 'active',
            width: 100,
            align: 'center',
            render: (active) => (
                <Switch checked={active} disabled />
            ),
        },
        {
            title: t("general.action"),
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        {t("general.edit")}
                    </Button>
                    <Popconfirm
                        title={t("general.confirmDelete")}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t("general.okConfirm")}
                        cancelText={t("general.cancelConfirm")}
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            {t("general.delete")}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">{t("backOffice.slider.management")}</h3>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    {t("backOffice.slider.addNew")}
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={sliders?.content || []}
                loading={isLoading}
                rowKey="id"
                pagination={false}
                scroll={{ x: true }}
            />

            <Modal
                title={editingSlider ? t("backOffice.slider.edit") : t("backOffice.slider.create")}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                    setImageFileList([]);
                    setEditingSlider(null);
                }}
                footer={null}
                width={800}
            >
                <CommonForm
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        alignment: 'text-center',
                        position: 0,
                        active: true,
                    }}
                >
                    <ImageUpload
                        label={t("backOffice.slider.image")}
                        prefix={prefix}
                        filename={editingSlider?.imageUrl}
                        hooks={imageHooks}
                        uploadText={t("backOffice.slider.uploadImage")}
                        alt={t("backOffice.slider.image")}
                        isEditable={true}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CommonForm.Item
                            label={t("backOffice.slider.descriptionEn")}
                            name="descriptionEn"
                        >
                            <TextArea 
                                rows={4} 
                                placeholder={t("backOffice.slider.descriptionEnPlaceholder")} 
                            />
                        </CommonForm.Item>

                        <CommonForm.Item
                            label={t("backOffice.slider.descriptionTh")}
                            name="descriptionTh"
                        >
                            <TextArea 
                                rows={4} 
                                placeholder={t("backOffice.slider.descriptionThPlaceholder")} 
                            />
                        </CommonForm.Item>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <CommonForm.Item
                            label={t("backOffice.slider.alignment")}
                            name="alignment"
                        >
                            <Select>
                                <Select.Option value="text-left">{t("backOffice.slider.alignLeft")}</Select.Option>
                                <Select.Option value="text-center">{t("backOffice.slider.alignCenter")}</Select.Option>
                                <Select.Option value="text-right">{t("backOffice.slider.alignRight")}</Select.Option>
                            </Select>
                        </CommonForm.Item>

                        <CommonForm.Item
                            label={t("backOffice.slider.position")}
                            name="position"
                            rules={[{ required: true, message: t("validation.required") }]}
                        >
                            <InputNumber min={0} className="w-full" />
                        </CommonForm.Item>

                        <CommonForm.Item
                            label={t("backOffice.slider.status")}
                            name="active"
                            valuePropName="checked"
                        >
                            <Switch 
                                checkedChildren={t("general.active")} 
                                unCheckedChildren={t("general.inactive")} 
                            />
                        </CommonForm.Item>
                    </div>

                    <CommonForm.Item className="mb-0 text-right">
                        <Space>
                            <Button onClick={() => {
                                setIsModalOpen(false);
                                form.resetFields();
                                setImageFileList([]);
                                setEditingSlider(null);
                            }}>
                                {t("general.cancel")}
                            </Button>
                            <Button 
                                type="primary" 
                                htmlType="submit"
                                loading={createMutation.isPending || updateMutation.isPending}
                            >
                                {t("general.save")}
                            </Button>
                        </Space>
                    </CommonForm.Item>
                </CommonForm>
            </Modal>
        </div>
    );
}

export default BannerSetting;

