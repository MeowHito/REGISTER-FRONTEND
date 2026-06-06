import React from 'react';
import { Card, Avatar, Tag, Dropdown, Button, Typography } from 'antd';
import {
    EllipsisOutlined, DeleteOutlined, CrownOutlined,
    EyeOutlined, EditOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const ROLE_CONFIG = {
    viewer: { color: 'blue', icon: <EyeOutlined /> },
    editor: { color: 'green', icon: <EditOutlined /> },
    admin: { color: 'purple', icon: <SafetyCertificateOutlined /> },
    owner: { color: 'gold', icon: <CrownOutlined /> },
};

const MemberPermissionCard = ({ member, isDirty, isLocked, currentUserRole, systemRole, onRemove, onRoleChange }) => {
    const { t } = useTranslation();

    const role = member.role || 'viewer';
    const isOwner = role === 'owner';
    const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.viewer;

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleQuickRoleChange = (newRole) => {
        onRoleChange(member.userId, newRole);
    };

    const roleItems = [
        {
            key: 'role-viewer',
            label: t('back.event.eventPermission.setAsViewer'),
            icon: <EyeOutlined />,
            onClick: () => handleQuickRoleChange('viewer'),
        },
        {
            key: 'role-editor',
            label: t('back.event.eventPermission.setAsEditor'),
            icon: <EditOutlined />,
            onClick: () => handleQuickRoleChange('editor'),
        },
        ...(currentUserRole === 'owner' || systemRole === 'admin' ? [{
            key: 'role-admin',
            label: t('back.event.eventPermission.setAsAdmin'),
            icon: <SafetyCertificateOutlined />,
            onClick: () => handleQuickRoleChange('admin'),
        }] : []),
    ];

    const dropdownItems = {
        items: [
            ...roleItems,
            { type: 'divider' },
            {
                key: 'remove',
                label: t('back.event.eventPermission.removeMember'),
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => onRemove(member.userId),
            },
        ],
    };

    return (
        <Card
            className={`my-1! shadow-sm hover:shadow-md transition-all border ${isDirty
                    ? 'border-l-4! border-l-blue-500! bg-blue-50! border-blue-200!'
                    : 'border-gray-100!'
                }`}
            styles={{ body: { padding: '16px' } }}
        >
            <div className="flex items-center gap-3">
                <Avatar
                    size={44}
                    className="shrink-0"
                    style={{
                        backgroundColor: isOwner ? '#daa222' : '#337ab7',
                        fontSize: 16,
                        fontWeight: 600,
                    }}
                >
                    {getInitials(member.name)}
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Text strong className="text-base truncate">
                            {member.name}
                        </Text>

                        {isOwner ? (
                            <Tag color="gold" icon={<CrownOutlined />} className="m-0">
                                {t('back.event.eventPermission.eventOwner')}
                            </Tag>
                        ) : <Tag
                            color={roleConfig.color}
                            icon={roleConfig.icon}
                            className="m-0"
                        >
                            {t(`back.event.eventPermission.role${role.charAt(0).toUpperCase() + role.slice(1)}`)}
                        </Tag>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        {member.companyName && (
                            <Text type="secondary" className="text-xs truncate">
                                {member.companyName}
                            </Text>
                        )}
                        {member.email && (
                            <Text type="secondary" className="text-xs truncate">
                                {member.email}
                            </Text>
                        )}
                    </div>
                </div>

                {!isLocked && (
                    <div className="shrink-0">
                        <Dropdown menu={dropdownItems} trigger={['click']} placement="bottomRight">
                            <Button type="text" icon={<EllipsisOutlined className="text-lg" />} className="flex items-center justify-center" />
                        </Dropdown>
                    </div>
                )}
            </div>


        </Card>
    );
};

export default MemberPermissionCard;
