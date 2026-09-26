import { CheckCircleOutlined, EditOutlined, PlusOutlined, SearchOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Image, Input, Popover, Segmented, Space, Spin, Switch, Table, Tag } from 'antd';
import { NOT_FOUND_IMG } from 'assets';
import UseModalHook from 'hooks/useModalHook';
import React, { useEffect, useMemo, useState } from 'react'
import User from './user';
import backOfficeServices from 'services/backoffice.services';
import Highlighter from 'react-highlight-words';
import { AlertConfirm, AlertSuccess, AlertError } from 'components/alert';
import { errorToMessage } from 'hooks/functions/errorToMessage';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';
import masterService from 'services/master.services';
import { genderOption } from "constants/options/genderOption";
import { bloodGroupOption } from "constants/options/bloodGroupOption";
import ResetPassword from './resetPassword';
import UserProfile from './userProfile';
import RoleSelect from './roleSelect';

function UserSetting() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const [mode, setMode] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [order, setOrder] = useState('asc');
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState(undefined);
  const [limitPage, setLimitPage] = useState(10);
  const [roleFilter, setRoleFilter] = useState('all');
  const [nameInput, setNameInput] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [userData, setUserData] = useState([]);
  const [sortedField, setSortedField] = useState(undefined);
  const [editResetPassword, setEditResetPassword] = useState(null);
  const [editUserProfile, setEditUserProfile] = useState(null);
  const [nationalityOption, setNationalityOption] = useState([]);

  const {
    open: openCreateUser,
    handleOpen: handleOpenCreateUser,
    handleClose: handleCloseCreateUser,
  } = UseModalHook();

  const {
    open: openCreateResetPassword,
    handleOpen: handleOpenCreateResetPassword,
    handleClose: handleCloseCreateResetPassword,
  } = UseModalHook();

  const {
    open: openCreateUserProfile,
    handleOpen: handleOpenCreateUserProfile,
    handleClose: handleCloseCreateUserProfile,
  } = UseModalHook();

  useEffect(() => {
    const timer = setTimeout(() => {
      setNameSearch(nameInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [nameInput]);

  const queryKey = useMemo(() => ["getAllUsers", { page, limitPage, roleFilter, nameSearch }], [page, limitPage, roleFilter, nameSearch]);

  const paging = {
    size: limitPage,
    page: page - 1,
    sortField: sortedField,
    sortDirection: order,
    searchField: searchedColumn,
    searchText: (searchText != "" && searchText != undefined) ? "%" + searchText + "%" : undefined,
    search: [
      roleFilter !== 'all' && { searchField: "roleType", searchText: roleFilter, searchType: "EQUAL" },
      nameSearch && { searchField: "name", searchText: nameSearch },
    ].filter(Boolean)
  };

  const { data: users, refetch: refetchUser, isFetching: isLoadingUser } = backOfficeServices.useQueryGetAllUser({ paging, queryKey });
  const { data: roles } = backOfficeServices.useQueryGetAllRole();
  const { data: roleCounts, refetch: refetchRoleCounts } = backOfficeServices.useQueryCountUserByRoleType();

  const refetchUsers = () => {
    refetchUser();
    refetchRoleCounts();
  };

  const roleCount = (roleType) => roleCounts?.[roleType] ?? 0;
  const allCount = Object.values(roleCounts || {}).reduce((sum, n) => sum + n, 0);

  const { mutate: updateUserRole } = backOfficeServices.useMutationUpdateUserRole();

  const getRoleNameById = (id) =>
    roles?.content?.find(r => r.id === id)?.role ?? id ?? '';

  const handleChangeRole = (record, newRoleId) => {
    const oldRoleName = record.role;
    const newRoleName = getRoleNameById(newRoleId);
    const who =
      record.email ||
      `${record.firstName ?? ''} ${record.lastName ?? ''}`.trim() ||
      record.id;

    updateUserRole(
      { userId: record.id, roleId: newRoleId },
      {
        onSuccess: () => {
          AlertSuccess({
            text: t("back.setting.user.role.successfulUpdate", {
              who,
              oldRole: oldRoleName,
              newRole: newRoleName,
            }),
          });
          refetchUsers();
        },
        onError: (err) => {
          AlertError({ text: errorToMessage(err) });
        },
      }
    );
  };

  const { data: nationalities, isFetching: isLoadingNationality } = masterService.useQueryGetNationality();

  const { mutate: updateUserApprover } = backOfficeServices.useMutationUpdateUserApprover(
    () => refetchUser(),
    (err) => AlertError({ text: errorToMessage(err) })
  );

  const { mutate: updateUserStatus } = backOfficeServices.useMutationUpdateUserStatus(
    () => {
      AlertSuccess({});
      refetchUser();
    },
    (err) => {
      AlertError({ text: errorToMessage(err) });
    }
  );

  useEffect(() => {
    if (users?.content?.length > 0) {
      setUserData(users.content)
      setTotalData(users.totalElements)
    } else {
      setUserData([])
      setTotalData(0);
    }
  }, [users]);

  useEffect(() => {
    if (nationalities?.length > 0) {
      let options = nationalities.map((n) => {
        return { value: n.alpha_3_code, label: n.nationality };
      });
      setNationalityOption(options);
    } else {
      setNationalityOption([])
    }
  }, [nationalities]);

  useEffect(() => {
    refetchUser();
  }, [page]);

  useEffect(() => {
    refetchUser();
  }, [sortedField, order]);

  const handleChange = (pagination, filters, sorter) => {
    setOrder(sorter.order == 'descend' ? 'desc' : 'asc')
    setSortedField(sorter.field)
  };

  const handleUserProfile = (id) => {
    setEditUserProfile({
      id
    });
    handleOpenCreateUserProfile();
  };

  const handleResetPassword = (id, email) => {
    setEditResetPassword({
      id, email,
    });
    setMode("edit")
    handleOpenCreateResetPassword();
  };

  const handleToggleUserStatus = (id, newStatus) => {
    AlertConfirm({
      text: newStatus ? t("back.setting.user.home.activateConfirm") : t("back.setting.user.home.deactivateConfirm"),
      onOk: () => {
        updateUserStatus({ id, active: newStatus });
      },
    });
  };
  const columns = [
    {
      key: 'index',
      width: 50,
      render: (_text, _record, index) => {
        return totalData - ((page - 1) * limitPage) - index;
      }
    },
    {
      title: t("back.setting.user.home.firstName"),
      dataIndex: 'firstName',
      key: 'firstName',
      sorter: true,
      search: true,
    },
    {
      title: t("back.setting.user.home.lastName"),
      dataIndex: 'lastName',
      key: 'lastName',
      sorter: true,
      search: true,
    },
    {
      title: t("back.setting.user.home.companyName"),
      dataIndex: 'companyName',
      key: 'companyName',
      sorter: true,
      search: true,
      hidden: roleFilter === 'guest' || roleFilter === 'admin',
    },
    {
      title: t("back.setting.user.home.role"),
      dataIndex: 'role',
      key: 'role',
      sorter: true,
      search: true,
      hidden: roleFilter !== 'all',
    },
    {
      title: t("back.setting.user.home.email"),
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      search: true,
    },
    {
      title: t("back.setting.user.home.thumbPictureUrl"),
      dataIndex: "thumbPictureUrl",
      key: "thumbPictureUrl",
      align: 'center',
      render: (_, { thumbPictureUrl }) => (
        <Image
          style={{ borderRadius: "9999px", objectFit: "cover" }}
          width={36}
          height={36}
          src={thumbPictureUrl || NOT_FOUND_IMG}
          alt="profile_img"
          fallback={NOT_FOUND_IMG}
        />
      ),
    },
    {
      title: t("back.setting.user.home.activeText"),
      dataIndex: "active",
      key: "active",
      sorter: true,
      render: (active) => (
        <Tag color={active ? "success" : "default"} bordered={false} className="!m-0 !rounded-full !px-2.5">
          {active ? t("general.active") : t("general.inactive")}
        </Tag>
      ),
    },
    {
      title: t("back.setting.user.home.approver"),
      dataIndex: "canApproveOrganizer",
      key: "canApproveOrganizer",
      align: 'center',
      hidden: roleFilter !== 'admin' && roleFilter !== 'all',
      render: (v, record) => record.roleType === 'admin' ? (
        <Popover content={t("back.setting.user.home.approverHint")} trigger={isMobile ? "none" : "hover"}>
          <Switch
            size="small"
            checked={!!v}
            onChange={(checked) => updateUserApprover({ id: record.id, canApproveOrganizer: checked })}
          />
        </Popover>
      ) : null,
    },
    {
      title: t("back.setting.tab.role"),
      dataIndex: "role",
      key: "roleAction",
      render: (_, record) => {
        const currentRole = roles?.content.find(r => r.role === record.role);

        return (
          <RoleSelect
            roles={roles}
            value={currentRole?.id}
            onChange={(roleId) => handleChangeRole(record, roleId)}
          />
        );
      }
    },
    {
      title: t("back.setting.user.home.manage"),
      dataIndex: "manage",
      key: "manage",
      width: 150,
      align: 'center',
      fixed: "right",
      render: (_, { id, email, roleType, active }) => (
        <>
          <div className="center !justify-end gap-2">
            {!(roleType === "admin") && (
              <Popover content={t("back.setting.user.home.buttonResetPassword")} trigger={isMobile ? "none" : "hover"}>
                <Button
                  className="center"
                  icon={<span role="img" aria-label="key" className="text-lg leading-none">🔑</span>}
                  onClick={() => handleResetPassword(id, email)}
                >
                </Button>
              </Popover>
            )}
            <Popover content={t("back.setting.user.home.edit")} trigger={isMobile ? "none" : "hover"}>
              <Button
                className="center"
                icon={<EditOutlined />}
                onClick={() => handleUserProfile(id)}
              >
              </Button>
            </Popover>
            <Popover content={active ? t("general.buttonDeactivate") : t("general.buttonActivate")} trigger={isMobile ? "none" : "hover"}>
              <Button
                className="center tw-gap-1"
                danger={active}
                type={active ? "default" : "primary"}
                icon={active ? <StopOutlined /> : <CheckCircleOutlined />}
                onClick={() => handleToggleUserStatus(id, !active)}
              >
                {active ? t("general.deactivate") : t("general.activate")}
              </Button>
            </Popover>
          </div>
        </>
      ),
    },
  ];


  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      (record[dataIndex]?.toString().toLowerCase() || '').includes(value.toLowerCase()),
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#188fff55', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text.toString()}
        />
      ) : (
        text
      ),
  });

  return (
    <>
      <Spin spinning={isLoadingUser}>
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="text-lg font-semibold text-[#1d1d1f]">
            {t("back.setting.user.home.allUsers")}
            <span className="ml-2 text-[#6e6e73] font-normal tabular-nums">({totalData || 0})</span>
          </div>
          <Button
            type="primary"
            className="center"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditUser(null);
              handleOpenCreateUser();
              setMode("new")
            }}
          >
            {t("back.setting.user.home.buttonUser")}
          </Button>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-full overflow-x-auto">
          <Segmented
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: `${t("back.setting.user.home.filterAll")} (${allCount})` },
              { value: 'organizer', label: `${t("back.setting.user.home.filterOrganizer")} (${roleCount('organizer')})` },
              { value: 'guest', label: `${t("back.setting.user.home.filterGuest")} (${roleCount('guest')})` },
              { value: 'admin', label: `${t("back.setting.user.home.filterAdmin")} (${roleCount('admin')})` },
            ]}
            size={isMobile ? 'small' : 'middle'}
          />
          </div>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-[#a1a1a6]" />}
            placeholder={t("back.setting.user.home.searchName")}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className={isMobile ? "w-full" : "!w-72"}
          />
        </div>
        <div className="rounded-xl border border-[#e5e5ea] overflow-hidden bg-white [&_.ant-table-pagination]:!px-4">
        <Table className="!w-full !text-nowrap"
          rowKey={"id"}
          columns={columns.filter(column => !column.hidden).map(column => ({
            ...column,
            ...(column.search && getColumnSearchProps(column.dataIndex))
          }))}
          dataSource={userData}
          scroll={{ x: true }}
          pagination={{
            pageSize: limitPage,
            current: page,
            onChange: (page, pageSize) => {
              setPage(page);
              setLimitPage(pageSize);
            },
            total: totalData,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true
          }}
          onChange={handleChange}
        />
        </div>
      </Spin>
      <User
        isEditable={mode === "new" || mode === "edit"}
        data={editUser}
        open={openCreateUser}
        onOk={handleCloseCreateUser}
        onCancel={handleCloseCreateUser}
        refetch={refetchUsers}
        mode={mode}
      />
      <ResetPassword
        isEditable={mode === "new" || mode === "edit"}
        data={editResetPassword}
        open={openCreateResetPassword}
        onOk={handleCloseCreateResetPassword}
        onCancel={handleCloseCreateResetPassword}
        refetch={refetchUser}
        mode={mode}
      />
      <UserProfile
        data={editUserProfile}
        open={openCreateUserProfile}
        onOk={handleCloseCreateUserProfile}
        onCancel={handleCloseCreateUserProfile}
        refetch={refetchUser}
        nationalityOption={nationalityOption}
        isLoadingNationality={isLoadingNationality}
        genderOption={genderOption}
        bloodGroupOption={bloodGroupOption}
      />
    </>
  )
}

export default UserSetting
