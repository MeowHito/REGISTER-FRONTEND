import React, { useState } from 'react';
import { Modal, Input, Select, Button, Form, Typography, Space, Divider, Alert, Tag } from 'antd';
import { PlusOutlined, SendOutlined, DeleteOutlined, UserAddOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const FAILED_STATUS_MAP = {
    already_member: 'back.event.eventPermission.inviteFailAlreadyMember',
    already_invited: 'back.event.eventPermission.inviteFailAlreadyInvited',
    invalid_role: 'back.event.eventPermission.inviteFailInvalidRole',
    forbidden_admin_invite: 'back.event.eventPermission.inviteFailForbiddenAdmin',
};

const InviteMemberModal = ({ open, onClose, onInvite, loading, currentUserRole, systemRole }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [invitees, setInvitees] = useState([]);
    const [emailInput, setEmailInput] = useState('');
    const [inviteResults, setInviteResults] = useState(null);

    const handleAddInvitee = () => {
        const email = emailInput.trim();
        if (!email) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            form.setFields([{ name: 'email', errors: [t('back.event.eventPermission.invalidEmail')] }]);
            return;
        }

        if (invitees.some(inv => inv.email === email)) {
            form.setFields([{ name: 'email', errors: [t('back.event.eventPermission.duplicateEmail')] }]);
            return;
        }

        setInvitees(prev => [...prev, { email, role: 'viewer' }]);
        setEmailInput('');
        form.setFields([{ name: 'email', errors: [] }]);
    };

    const handleRemoveInvitee = (email) => {
        setInvitees(prev => prev.filter(inv => inv.email !== email));
    };

    const handleRoleChange = (email, role) => {
        setInvitees(prev => prev.map(inv =>
            inv.email === email ? { ...inv, role } : inv
        ));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddInvitee();
        }
    };

    const handleSendInvites = () => {
        if (invitees.length === 0) return;

        const payload = invitees.map(inv => ({
            email: inv.email,
            role: inv.role,
        }));

        onInvite(payload, (results) => {
            if (results) {
                setInviteResults(results);
                setInvitees([]);
            }
        });
    };

    const handleClose = () => {
        setInvitees([]);
        setEmailInput('');
        setInviteResults(null);
        form.resetFields();
        onClose();
    };

    const ALL_ROLE_OPTIONS = [
        { value: 'viewer', dotColor: '#3b82f6' },
        { value: 'editor', dotColor: '#22c55e' },
        { value: 'admin', dotColor: '#a855f7' },
    ];

    const ROLE_OPTIONS = (currentUserRole === 'owner' || systemRole === 'admin')
        ? ALL_ROLE_OPTIONS
        : ALL_ROLE_OPTIONS.filter(o => o.value !== 'admin');

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            title={
                <div className="flex items-center gap-2">
                    <UserAddOutlined className="text-lg" />
                    <span>{t('back.event.eventPermission.inviteMembers')}</span>
                </div>
            }
            footer={null}
            width={600}
            destroyOnClose={true}
        >
            <Text type="secondary" className="block mb-4">
                {t('back.event.eventPermission.inviteDescription')}
            </Text>

            <Form form={form} layout="vertical">
                <Form.Item name="email" className="mb-3">
                    <div className="flex gap-2">
                        <Input
                            placeholder={t('back.event.eventPermission.emailPlaceholder')}
                            value={emailInput}
                            onChange={e => setEmailInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            prefix={<span className="text-gray-400">@</span>}
                            className="flex-1"
                            size="large"
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddInvitee}
                            size="large"
                        >
                            {t('back.event.eventPermission.add')}
                        </Button>
                    </div>
                </Form.Item>
            </Form>

            {invitees.length > 0 && (
                <>
                    <Divider className="my-3" />
                    <div className="mb-2">
                        <Text strong className="text-sm">
                            {t('back.event.eventPermission.pendingInvites')} ({invitees.length})
                        </Text>
                    </div>

                    <div className="max-h-70 overflow-y-auto pr-1 space-y-2">
                        {invitees.map((inv) => (
                            <div
                                key={inv.email}
                                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 hover:border-blue-200 transition-colors"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium shrink-0">
                                        {inv.email[0]?.toUpperCase()}
                                    </div>
                                    <Text className="truncate text-sm">{inv.email}</Text>
                                </div>

                                <Space size="small" className="shrink-0 ml-2">
                                    <Select
                                        value={inv.role}
                                        onChange={(val) => handleRoleChange(inv.email, val)}
                                        size="small"
                                        className="w-28"
                                        options={ROLE_OPTIONS.map(r => ({
                                            value: r.value,
                                            label: t(`back.event.eventPermission.role${r.value.charAt(0).toUpperCase() + r.value.slice(1)}`),
                                            dotColor: r.dotColor,
                                        }))}
                                        optionRender={(opt) => (
                                            <div className="flex items-center gap-2">
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: opt.data.dotColor, display: 'inline-block', flexShrink: 0 }} />
                                                {opt.label}
                                            </div>
                                        )}
                                        labelRender={(opt) => (
                                            <div className="flex items-center gap-1.5">
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: ROLE_OPTIONS.find(r => r.value === opt.value)?.dotColor, display: 'inline-block', flexShrink: 0 }} />
                                                {opt.label}
                                            </div>
                                        )}
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveInvitee(inv.email)}
                                    />
                                </Space>
                            </div>
                        ))}
                    </div>

                    <Divider className="my-3" />

                    <div className="flex justify-end">
                        <Space>
                            <Button onClick={handleClose}>
                                {t('back.event.eventPermission.cancel')}
                            </Button>
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleSendInvites}
                                loading={loading}
                            >
                                {t('back.event.eventPermission.sendInvitations')} ({invitees.length})
                            </Button>
                        </Space>
                    </div>
                </>
            )}
            {inviteResults && (
                <>
                    <Divider className="my-3" />

                    {inviteResults.sent?.length > 0 && (
                        <Alert
                            type="success"
                            showIcon
                            icon={<CheckCircleOutlined />}
                            className="mb-3"
                            message={t('back.event.eventPermission.inviteSentSuccess', 'ส่งคำเชิญสำเร็จ')}
                            description={
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {inviteResults.sent.map(item => (
                                        <Tag key={item.email} color="green">{item.email}</Tag>
                                    ))}
                                </div>
                            }
                        />
                    )}

                    {inviteResults.failed?.length > 0 && (
                        <Alert
                            type="warning"
                            showIcon
                            icon={<CloseCircleOutlined />}
                            className="mb-3"
                            message={t('back.event.eventPermission.inviteSentFailed', 'ไม่สามารถส่งคำเชิญได้')}
                            description={
                                <div className="space-y-1 mt-1">
                                    {inviteResults.failed.map(item => (
                                        <div key={item.email} className="flex items-center gap-2 text-sm">
                                            <Text>{item.email}</Text>
                                            <Text type="secondary">—</Text>
                                            <Text type="danger">
                                                {t(FAILED_STATUS_MAP[item.status] || 'back.event.eventPermission.inviteFailUnknown',
                                                    item.status === 'already_member' ? 'เป็นสมาชิกอยู่แล้ว' :
                                                    item.status === 'already_invited' ? 'ส่งคำเชิญแล้วและยังไม่หมดอายุ' :
                                                    item.status === 'invalid_role' ? 'บทบาทไม่ถูกต้อง' :
                                                    'เกิดข้อผิดพลาด'
                                                )}
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            }
                        />
                    )}

                    <div className="flex justify-end mt-3">
                        <Button type="primary" onClick={handleClose}>
                            {t('back.event.eventPermission.done', 'เสร็จสิ้น')}
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
};

export default InviteMemberModal;
