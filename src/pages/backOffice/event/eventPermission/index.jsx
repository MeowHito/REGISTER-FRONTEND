import React, { useEffect, useState, useMemo } from 'react';
import { Button, Spin, Input, Empty, Badge, Typography, Segmented, Pagination } from 'antd';
import {
    LeftOutlined, UserAddOutlined, SearchOutlined,
    SaveOutlined, UndoOutlined, TeamOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import backOfficeServices from 'services/backoffice.services';
import { AlertConfirm } from 'components/alert';
import { useMediaQuery } from 'react-responsive';
import useMe from 'hooks/useMe';
import InviteMemberModal from './InviteMemberModal';
import MemberPermissionCard from './MemberPermissionCard';

const { Title, Text } = Typography;

const ROLE_PRESETS = ['viewer', 'editor', 'admin'];

const EventPermission = ({ eventId, eventName, setView }) => {
    const { t } = useTranslation();
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
    const [members, setMembers] = useState([]);
    const [dirty, setDirty] = useState({});
    const [limitPage, setLimitPage] = useState(10);
    const [page, setPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [inviteModalOpen, setInviteModalOpen] = useState(false);

    const { data: me } = useMe({ retry: 0 });
    const userId = me?.id;
    const roleUser = me?.role?.roleType;

    const {
        data: dataEventPermission,
        refetch: refetchEventPermission,
        isFetching: isLoadingData,
    } = backOfficeServices.useQueryGetEventPermissionsByEvent({
        id: eventId,
        paging: { page: page - 1, size: limitPage },
    });

    const updateEventPermissions = backOfficeServices.useMutationUpdateEventPermissions();
    const inviteToEvent = backOfficeServices.useMutationInviteToEvent?.() || { mutate: () => { }, isLoading: false };

    const deriveRole = (n) => {
        if (n.role) return n.role;
        if (n.canUpdate || n.canDelete) return 'editor';
        return 'viewer';
    };

    useEffect(() => {
        const source = dataEventPermission;

        if (source?.content?.length > 0) {
            const mapped = source.content.map(n => {
                const name = [n?.firstName || '', n?.lastName || ''].filter(Boolean).join(' ');
                const role = deriveRole(n);
                return { ...n, name, role };
            });

            setMembers(mapped);
            setTotalData(source?.totalElements ?? 0);
        } else {
            setMembers([]);
            setTotalData(0);
        }
    }, [dataEventPermission, userId]);

    const myRole = useMemo(() => {
        const me_member = members.find(m => m.userId === userId);
        return me_member?.role || 'viewer';
    }, [members, userId]);

    const isMemberLocked = (member) => {
        if (roleUser === 'admin') return member.userId === userId;
        if (member.userId === userId) return true;
        if (member.role === 'owner') return true;
        if (member.role === 'admin' && myRole !== 'owner') return true;
        if (myRole !== 'owner' && myRole !== 'admin') return true;
        return false;
    };

    const handleRoleChange = (memberId, newRole) => {
        if (!ROLE_PRESETS.includes(newRole)) return;
        setMembers(prev =>
            prev.map(m => {
                if (m.userId !== memberId) return m;
                return { ...m, role: newRole };
            })
        );
        setDirty(prev => ({ ...prev, [memberId]: true }));
    };

    const handleRemoveMember = (memberId) => {
        AlertConfirm({
            title: t('back.event.eventPermission.confirmRemoveTitle'),
            text: t('back.event.eventPermission.confirmRemoveMessage'),
            onOk: () => {
                setMembers(prev => prev.filter(m => m.userId !== memberId));
                setDirty(prev => ({ ...prev, [memberId]: 'removed' }));
            },
        });
    };

    const handleCancel = () => {
        setDirty({});
        refetchEventPermission();
    };

    const handleSave = () => {
        AlertConfirm({
            title: t('back.event.eventPermission.confirmSavePermissionsTitle'),
            text: t('back.event.eventPermission.confirmSavePermissionsMessage'),
            onOk: () => {
                const payload = members
                    .filter(m => dirty[m.userId] && dirty[m.userId] !== 'removed')
                    .map(m => ({
                        userId: m.userId,
                        role: m.role,
                    }));

                const removedIds = Object.entries(dirty)
                    .filter(([, v]) => v === 'removed')
                    .map(([id]) => id);

                updateEventPermissions.mutate(
                    { eventId, permissions: payload, removedUserIds: removedIds },
                    {
                        onSuccess: () => {
                            setDirty({});
                            refetchEventPermission();
                        },
                    }
                );
            },
        });
    };

    const handleInvite = (invitees, onResults) => {
        inviteToEvent.mutate?.(
            { eventId, invitees },
            {
                onSuccess: (data) => {
                    refetchEventPermission();
                    const results = data?.data;
                    if (results && onResults) {
                        onResults(results);
                    } else {
                        setInviteModalOpen(false);
                    }
                },
            }
        );
    };

    const filteredMembers = useMemo(() => {
        let result = members;
        if (searchText) {
            const q = searchText.toLowerCase();
            result = result.filter(
                m =>
                    m.name?.toLowerCase().includes(q) ||
                    m.companyName?.toLowerCase().includes(q) ||
                    m.email?.toLowerCase().includes(q)
            );
        }
        if (filterRole !== 'all') {
            result = result.filter(m => m.role === filterRole);
        }
        return result;
    }, [members, searchText, filterRole]);

    const dirtyCount = Object.keys(dirty).length;

    const roleCounts = useMemo(() => {
        const counts = { all: members.length, owner: 0, admin: 0, editor: 0, viewer: 0 };
        members.forEach(m => {
            const r = m.role || 'viewer';
            counts[r] = (counts[r] || 0) + 1;
        });
        return counts;
    }, [members]);

    return (
        <div className="mb-4">
            <div className="flex items-center mb-6">
                <Button type="text" onClick={() => setView(null)} className="flex items-center text-gray-500 hover:text-gray-800">
                    <LeftOutlined className="text-lg" />
                    <span className="ml-1">{t('general.back')}</span>
                </Button>
            </div>

            <div className="w-full max-w-screen-lg mx-auto">
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start justify-between'} mb-6`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <TeamOutlined className="text-xl text-blue-500" />
                            <Title level={4} className="mb-0!">
                                {t('back.event.eventPermission.teamAccess')}
                            </Title>
                        </div>
                        <Text type="secondary">
                            {t('back.event.eventPermission.eventName')}: <Text strong>{eventName}</Text>
                        </Text>
                        <br />
                        <Text type="secondary" className="text-xs">
                            {t('back.event.eventPermission.teamAccessDescription')}
                        </Text>
                    </div>

                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        size="large"
                        onClick={() => setInviteModalOpen(true)}
                        className="shrink-0"
                    >
                        {t('back.event.eventPermission.inviteMembers')}
                    </Button>
                </div>

                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mb-4`}>
                    <Input
                        placeholder={t('back.event.eventPermission.searchPlaceholder')}
                        prefix={<SearchOutlined className="text-gray-400" />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="max-w-xs"
                        allowClear
                    />
                    <Segmented
                        value={filterRole}
                        onChange={setFilterRole}
                        options={[
                            { value: 'all', label: `${t('back.event.eventPermission.filterAll')} (${roleCounts.all})` },
                            { value: 'owner', label: `${t('back.event.eventPermission.roleOwner')} (${roleCounts.owner})` },
                            { value: 'admin', label: `${t('back.event.eventPermission.roleAdmin')} (${roleCounts.admin})` },
                            { value: 'editor', label: `${t('back.event.eventPermission.roleEditor')} (${roleCounts.editor})` },
                            { value: 'viewer', label: `${t('back.event.eventPermission.roleViewer')} (${roleCounts.viewer})` },
                        ]}
                        size={isMobile ? 'small' : 'middle'}
                    />
                </div>

                <Spin spinning={isLoadingData}>
                    {filteredMembers.length > 0 ? (
                        <div>
                            {filteredMembers.map(member => (
                                <MemberPermissionCard
                                    key={member.userId}
                                    member={member}
                                    isDirty={!!dirty[member.userId]}
                                    isLocked={isMemberLocked(member)}
                                    currentUserRole={myRole}
                                    systemRole={roleUser}
                                    onRemove={handleRemoveMember}
                                    onRoleChange={handleRoleChange}
                                />
                            ))}
                        </div>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                searchText
                                    ? t('back.event.eventPermission.noSearchResults')
                                    : t('back.event.eventPermission.noMembers')
                            }
                        />
                    )}

                    {totalData > limitPage && (
                        <div className="flex justify-end mt-4">
                            <Pagination
                                current={page}
                                pageSize={limitPage}
                                total={totalData}
                                onChange={(p, ps) => { setPage(p); setLimitPage(ps); }}
                                showSizeChanger
                                pageSizeOptions={['10', '20', '50', '100']}
                            />
                        </div>
                    )}
                </Spin>

                {dirtyCount > 0 && (
                    <div className="sticky bottom-0 z-40 -mx-4 mt-4">
                        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-5 py-3 flex items-center justify-between mx-4">
                            <Text>
                                <Badge count={dirtyCount} size="small" className="mr-2" />
                                {t('back.event.eventPermission.unsavedChanges')}
                            </Text>
                            <div className="flex gap-2">
                                <Button icon={<UndoOutlined />} onClick={handleCancel}>
                                    {t('back.event.eventPermission.cancel')}
                                </Button>
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={updateEventPermissions.isLoading}>
                                    {t('back.event.eventPermission.saveChanges')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <InviteMemberModal
                open={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                onInvite={handleInvite}
                loading={inviteToEvent.isLoading}
                currentUserRole={myRole}
                systemRole={roleUser}
            />
        </div>
    );
};

export default EventPermission;
