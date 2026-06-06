import { useState } from 'react';
import { Button, Table, Space, Tag, Modal, Input, Select, DatePicker, Switch, Popconfirm, message } from 'antd';
import CommonForm from "components/commonForm";
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import backOfficeServices from 'services/backoffice.services';
import dayjs from 'dayjs';

const { TextArea } = Input;

const TYPE_OPTIONS = [
  { value: 'INFO', label: 'Info', color: 'blue' },
  { value: 'WARNING', label: 'Warning', color: 'gold' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'default' },
  { value: 'IMPORTANT', label: 'Important', color: 'purple' },
];

const typeColorMap = Object.fromEntries(TYPE_OPTIONS.map(t => [t.value, t.color]));

export default function SystemAnnouncementList() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = CommonForm.useForm();

  const [paging, setPaging] = useState({
    size: 20,
    page: 0,
    sortField: 'id',
    sortDirection: 'desc'
  });

  const { data, isLoading, refetch } = backOfficeServices.useQueryGetAllSystemAnnouncements({ paging });

  const createMutation = backOfficeServices.useMutationCreateSystemAnnouncement(
    () => { message.success(t("backOffice.systemAnnouncement.createSuccess")); closeModal(); refetch(); },
    () => message.error(t("backOffice.systemAnnouncement.createError"))
  );

  const updateMutation = backOfficeServices.useMutationUpdateSystemAnnouncement(
    () => { message.success(t("backOffice.systemAnnouncement.updateSuccess")); closeModal(); refetch(); },
    () => message.error(t("backOffice.systemAnnouncement.updateError"))
  );

  const deleteMutation = backOfficeServices.useMutationDeleteSystemAnnouncement(
    () => { message.success(t("backOffice.systemAnnouncement.deleteSuccess")); refetch(); },
    () => message.error(t("backOffice.systemAnnouncement.deleteError"))
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: 'INFO', active: true });
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      title: record.title,
      message: record.message,
      type: record.type || 'INFO',
      active: record.active !== false,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (values) => {
    const payload = {
      title: values.title,
      message: values.message,
      type: values.type,
      active: values.active,
      startDate: values.startDate ? values.startDate.toISOString() : null,
      endDate: values.endDate ? values.endDate.toISOString() : null,
    };

    if (editing) {
      updateMutation.mutate({ ...payload, id: editing.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    {
      title: t("backOffice.systemAnnouncement.titleCol"),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 100,
      render: (text) => <span className="font-semibold text-gray-800">{text}</span>,
    },
    {
      title: t("backOffice.systemAnnouncement.messageCol"),
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      width: 250,
    },
    {
      title: t("backOffice.systemAnnouncement.typeCol"),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => <Tag color={typeColorMap[type] || 'blue'}>{type || 'INFO'}</Tag>,
    },
    {
      title: t("backOffice.systemAnnouncement.startDateCol"),
      dataIndex: 'startDate',
      key: 'startDate',
      width: 160,
      render: (d) => d ? dayjs(d).format('DD/MM/BBBB HH:mm') : '-',
    },
    {
      title: t("backOffice.systemAnnouncement.endDateCol"),
      dataIndex: 'endDate',
      key: 'endDate',
      width: 160,
      render: (d) => d ? dayjs(d).format('DD/MM/BBBB HH:mm') : '-',
    },
    {
      title: t("backOffice.systemAnnouncement.statusCol"),
      dataIndex: 'active',
      key: 'active',
      width: 80,
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? t("backOffice.systemAnnouncement.active") : t("backOffice.systemAnnouncement.inactive")}
        </Tag>
      ),
    },
    {
      title: t("backOffice.systemAnnouncement.actionCol"),
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title={t("backOffice.systemAnnouncement.confirmDelete")}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText={t("backOffice.systemAnnouncement.yes")}
            cancelText={t("backOffice.systemAnnouncement.no")}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{t("backOffice.systemAnnouncement.pageTitle")}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t("backOffice.systemAnnouncement.addNew")}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.content || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        pagination={{
          total: data?.totalElements || 0,
          pageSize: paging.size,
          current: paging.page + 1,
          showSizeChanger: false,
          onChange: (page) => setPaging(prev => ({ ...prev, page: page - 1 })),
        }}
      />

      <Modal
        title={editing
          ? t("backOffice.systemAnnouncement.editTitle")
          : t("backOffice.systemAnnouncement.addTitle")
        }
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={600}
      >
        <CommonForm form={form} onFinish={handleSubmit} layout="vertical">
          <CommonForm.Item
            name="title"
            label={t("backOffice.systemAnnouncement.titleCol")}
            rules={[{ required: true, message: t("backOffice.systemAnnouncement.titleRequired") }]}
          >
            <Input maxLength={200} />
          </CommonForm.Item>

          <CommonForm.Item
            name="message"
            label={t("backOffice.systemAnnouncement.messageCol")}
          >
            <TextArea rows={3} maxLength={500} />
          </CommonForm.Item>

          <CommonForm.Item
            name="type"
            label={t("backOffice.systemAnnouncement.typeCol")}
            rules={[{ required: true }]}
          >
            <Select options={TYPE_OPTIONS} />
          </CommonForm.Item>

          <div className="flex gap-4">
            <CommonForm.Item
              name="startDate"
              label={t("backOffice.systemAnnouncement.startDateCol")}
              className="flex-1"
            >
              <DatePicker showTime className="w-full" format="DD/MM/BBBB HH:mm" />
            </CommonForm.Item>

            <CommonForm.Item
              name="endDate"
              label={t("backOffice.systemAnnouncement.endDateCol")}
              className="flex-1"
            >
              <DatePicker showTime className="w-full" format="DD/MM/BBBB HH:mm" />
            </CommonForm.Item>
          </div>

          <CommonForm.Item
            name="active"
            label={t("backOffice.systemAnnouncement.statusCol")}
            valuePropName="checked"
          >
            <Switch />
          </CommonForm.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={closeModal}>{t("backOffice.systemAnnouncement.cancel")}</Button>
            <Button type="primary" htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? t("backOffice.systemAnnouncement.save") : t("backOffice.systemAnnouncement.create")}
            </Button>
          </div>
        </CommonForm>
      </Modal>
    </div>
  );
}
