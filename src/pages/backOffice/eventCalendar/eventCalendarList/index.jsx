import React, { useState, useEffect, useRef } from "react";
import { Button, Tag, Space, Input, Modal, Spin, Tooltip, App } from "antd";
import {
  CheckOutlined,
  SearchOutlined,
  DeleteOutlined,
  CloseOutlined,
  EyeOutlined,
  CloudDownloadOutlined,
  InfoCircleOutlined,
  ClearOutlined,
  StopOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import Highlighter from "react-highlight-words";
import backOfficeServices from "services/backoffice.services";
import createRequest from "utils/request";
import { AlertConfirm, AlertError } from "components/alert";
import { errorToMessage } from "hooks/functions/errorToMessage";
import { handleQueryStatus } from "utils";
import EventCalendarDetails from "../eventCalendarDetails";
import ImportSyncModal from "../importSyncModal";
import dayjs from "dayjs";
import { SYS_DATE_FORMAT, SYS_DATE_TIME_FORMAT } from "constants/helper";
import useMe from "hooks/useMe";
import PermissionActionTable from "components/permissionActionTable";
import PageHeader from 'components/pageHeader';

const { TextArea } = Input;

const VIEWS = {
  LIST: "list",
  DETAILS: "details",
};

// Long imported names get cut to one line; the full name is in the tooltip. (The table scrolls
// horizontally, so antd's column `ellipsis` can't apply — the cap has to live on the content.)
const EventName = ({ name, children }) => (
  <Tooltip title={name} placement="topLeft" mouseEnterDelay={0.3}>
    <div className="max-w-[340px] truncate">{children ?? name}</div>
  </Tooltip>
);

const EventCalendarList = () => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [eventCalendarData, setEventCalendarData] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [order, setOrder] = useState("asc");
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState(undefined);
  const [limitPage, setLimitPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortedField, setSortedField] = useState(undefined);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [view, setView] = useState(VIEWS.LIST);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectingAll, setSelectingAll] = useState(false);

  const { data: me } = useMe({ retry: 0 });
  const roleUser = me?.role?.roleType;
  const isAdmin = roleUser === "admin";


  const handleApprove = (eventId) => {
    AlertConfirm({
      text: t("back.eventCalendarList.confirm"),
      onOk: () => {
        setUpdateStatus(eventId);
        updateEventCalendarStatus({ eventId, isApproved: true });
      },
    });
  };

  const handleReject = (eventId, rejectReason) => {
    AlertConfirm({
      text: t("back.eventCalendarList.confirm"),
      onOk: () => {
        setUpdateStatus(eventId);
        updateEventCalendarStatus({
          eventId,
          isApproved: false,
          rejectReason,
        });
      },
    });
  };

  const handleDelete = (id) => {
    AlertConfirm({
      text: t("general.deleteConfirm"),
      onOk: () => {
        deleteEventCalendar({ id });
      },
    });
  };

  const {
    data,
    isFetching: isLoading,
    refetch: refetchEventCalendar,
    ...other
  } = backOfficeServices.useQueryGetAllEventCalendar({
    paging: {
      page: page - 1,
      size: limitPage,
      sortField: sortedField,
      sortDirection: order,
      searchField: searchedColumn,
      searchText:
        searchText !== "" && searchText !== undefined
          ? "%" + searchText + "%"
          : undefined,
    },
  });

  useEffect(() => {
    handleQueryStatus(other, () => {
      if (!data) return;
      setEventCalendarData(data.content);
      setTotalData(data.totalElements);
    });
  }, [other.fetchStatus]);

  // External import (joggingandrunning.com): poll while a run is in progress, then reload the list.
  const { data: importStatus, refetch: refetchImportStatus } =
    backOfficeServices.useQueryEventCalendarImportStatus({
      enabled: isAdmin,
      refetchInterval: (query) => (query.state.data?.running ? 4000 : false),
    });
  const wasRunningRef = useRef(false);
  useEffect(() => {
    const running = !!importStatus?.running;
    if (wasRunningRef.current && !running) {
      message.success(t("back.eventCalendarList.syncDone"));
      refetchEventCalendar();
    }
    wasRunningRef.current = running;
  }, [importStatus?.running, refetchEventCalendar, t, message]);

  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const { mutate: syncImport, isPending: isStartingSync } =
    backOfficeServices.useMutationSyncEventCalendarImport(
      (res) => {
        setSyncModalOpen(false);
        if (res?.success) {
          message.info(t("back.eventCalendarList.syncStarted"));
        } else {
          AlertError({ text: res?.message });
        }
        refetchImportStatus();
      },
      (err) => AlertError({ text: errorToMessage(err) })
    );

  const { mutate: stopImport, isPending: isStopping } =
    backOfficeServices.useMutationStopEventCalendarImport(
      (res) => {
        message.info(res?.message);
        refetchImportStatus();
      },
      (err) => AlertError({ text: errorToMessage(err) })
    );

  const { mutate: clearImported, isPending: isClearing } =
    backOfficeServices.useMutationClearEventCalendarImport(
      (res) => {
        if (res?.success) {
          message.success(t("back.eventCalendarList.clearImportedDone", { count: res?.data ?? 0 }));
          refetchEventCalendar();
        } else {
          AlertError({ text: res?.message });
        }
        refetchImportStatus();
      },
      (err) => AlertError({ text: errorToMessage(err) })
    );
  const handleClearImported = () => {
    AlertConfirm({
      text: t("back.eventCalendarList.clearImportedConfirm"),
      onOk: () => clearImported(),
    });
  };

  const { mutate: updateEventCalendarStatus } =
    backOfficeServices.useMutationUpdateEventCalendarStatus(
      () => {
        message.success(t("general.alertSuccess"));
        setUpdateStatus(null);
        refetchEventCalendar();
      },
      (err) => {
        setUpdateStatus(null);
        AlertError({ text: errorToMessage(err) });
      }
    );

  const { mutate: deleteEventCalendar } =
    backOfficeServices.useMutationDeleteEventCalendar(
      () => {
        message.success(t("general.alertSuccess"));
        refetchEventCalendar();
      },
      (err) => {
        AlertError({ text: errorToMessage(err) });
      }
    );

  const showRejectModal = (onReject, title = t("back.eventCalendarList.confirmReject")) => {
    let rejectReason = "";

    Modal.confirm({
      title,
      content: (
        <div>
          <TextArea
            rows={4}
            onChange={(e) => {
              rejectReason = e.target.value;
            }}
            placeholder={t("back.eventCalendarList.rejectReason")}
          />
        </div>
      ),
      okText: t("general.okConfirm"),
      cancelText: t("general.cancelConfirm"),
      onOk: () => onReject(rejectReason),
    });
  };

  const { mutate: bulkStatus, isPending: isBulkUpdating } =
    backOfficeServices.useMutationBulkEventCalendarStatus(
      (res) => {
        if (res?.success) {
          message.success(t("back.eventCalendarList.bulkDone", { count: res?.data ?? 0 }));
          setSelectedIds([]);
        } else {
          AlertError({ text: res?.message });
        }
        refetchEventCalendar();
      },
      (err) => AlertError({ text: errorToMessage(err) })
    );

  const { mutate: bulkDelete, isPending: isBulkDeleting } =
    backOfficeServices.useMutationBulkDeleteEventCalendar(
      (res) => {
        if (res?.success) {
          message.success(t("back.eventCalendarList.bulkDone", { count: res?.data ?? 0 }));
          setSelectedIds([]);
        } else {
          AlertError({ text: res?.message });
        }
        refetchEventCalendar();
      },
      (err) => AlertError({ text: errorToMessage(err) })
    );

  const [majorUpdating, setMajorUpdating] = useState(null);
  const { mutate: bulkMajor, isPending: isBulkMajor } =
    backOfficeServices.useMutationBulkEventCalendarMajor(
      (res) => {
        setMajorUpdating(null);
        if (res?.success) {
          message.success(res?.message);
        } else {
          AlertError({ text: res?.message });
        }
        refetchEventCalendar();
      },
      (err) => {
        setMajorUpdating(null);
        AlertError({ text: errorToMessage(err) });
      }
    );

  const toggleMajor = (record) => {
    setMajorUpdating(record.eventId);
    bulkMajor({ ids: [record.eventId], isMajor: !record.isMajor });
  };

  const handleBulkMajor = (isMajor) => {
    AlertConfirm({
      text: t(
        isMajor ? "back.eventCalendarList.bulkSetMajorConfirm" : "back.eventCalendarList.bulkUnsetMajorConfirm",
        { count: selectedIds.length }
      ),
      onOk: () => bulkMajor({ ids: selectedIds, isMajor }),
    });
  };

  const handleBulkApprove = () => {
    AlertConfirm({
      text: t("back.eventCalendarList.bulkApproveConfirm", { count: selectedIds.length }),
      onOk: () => bulkStatus({ ids: selectedIds, isApproved: true }),
    });
  };

  const handleBulkReject = () => {
    showRejectModal(
      (rejectReason) => bulkStatus({ ids: selectedIds, isApproved: false, rejectReason }),
      t("back.eventCalendarList.bulkRejectTitle", { count: selectedIds.length })
    );
  };

  const handleBulkDelete = () => {
    AlertConfirm({
      text: t("back.eventCalendarList.bulkDeleteConfirm", { count: selectedIds.length }),
      onOk: () => bulkDelete({ ids: selectedIds }),
    });
  };

  // The header checkbox only covers the current page; this pulls every id that matches the current search.
  const selectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const res = await createRequest.get(`api/eventCalendar/getEventCalendar`, {
        params: {
          paging: JSON.stringify({
            page: 0,
            size: Math.max(totalData, 1),
            searchField: searchedColumn,
            searchText: searchText ? "%" + searchText + "%" : undefined,
          }),
        },
      });
      setSelectedIds((res.data?.data?.content || []).map((r) => r.eventId));
    } catch (err) {
      AlertError({ text: errorToMessage(err) });
    } finally {
      setSelectingAll(false);
    }
  };

  const columns = [
    {
      title: t("back.eventCalendarList.no"),
      key: "index",
      align: "center",
      render: (_text, _record, index) => {
        return totalData - (page - 1) * limitPage - index;
      },
    },
    {
      title: t("back.eventCalendarList.eventName"),
      dataIndex: "eventName",
      key: "eventName",
      render: (name) => <EventName name={name} />,
      sorter: roleUser === "admin",
      search: roleUser === "admin",
    },
    // Major = headline race; the nearest upcoming one is the banner on /eventCalendar.
    isAdmin && {
      title: t("back.eventCalendarList.major"),
      dataIndex: "isMajor",
      key: "isMajor",
      align: "center",
      render: (isMajor, record) => (
        <Tooltip title={isMajor ? t("back.eventCalendarList.unsetMajor") : t("back.eventCalendarList.setMajor")}>
          <Button
            type="text"
            size="small"
            loading={majorUpdating === record.eventId}
            icon={isMajor ? <StarFilled className="!text-[#f5a623]" /> : <StarOutlined className="!text-[#c7c7cc]" />}
            onClick={() => toggleMajor(record)}
          />
        </Tooltip>
      ),
    },
    {
      title: t("back.eventCalendarList.eventDate"),
      dataIndex: "eventDate",
      key: "eventDate",
      render: (date) => (date ? dayjs(date).format(SYS_DATE_FORMAT) : null),
    },
    {
      title: t("back.eventCalendarList.source"),
      dataIndex: "source",
      key: "source",
      render: (source, record) =>
        source ? (
          <Tooltip title={record?.sourceUrl}>
            <Tag color="cyan">{t("back.eventCalendarList.sourceImported")}</Tag>
          </Tooltip>
        ) : (
          <Tag>{t("back.eventCalendarList.sourceManual")}</Tag>
        ),
    },
    {
      title: t("back.eventCalendarList.status"),
      dataIndex: "isApproved",
      key: "isApproved",
      render: (isApproved) => {
        let color = "orange";
        let label = t("back.eventCalendarList.pending");

        if (isApproved === true) {
          color = "green";
          label = t("back.eventCalendarList.approved");
        } else if (isApproved === false) {
          color = "red";
          label = t("back.eventCalendarList.rejected");
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
  ].filter(Boolean);

  const handleChange = (pagination, filters, sorter) => {
    setOrder(sorter.order == "descend" ? "desc" : "asc");
    setSortedField(sorter.field);
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
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
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      (record[dataIndex]?.toString().toLowerCase() || "").includes(
        value.toLowerCase()
      ),
    render: (text) => (
      <EventName name={text}>
        {searchedColumn === dataIndex ? (
          <Highlighter
            highlightStyle={{ backgroundColor: "#188fff55", padding: 0 }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={text?.toString() ?? ""}
          />
        ) : (
          text
        )}
      </EventName>
    ),
  });

  const lastRun = importStatus?.lastRun;
  const syncRunning = !!importStatus?.running;
  const importPanel = isAdmin && importStatus?.enabled !== false && (
    <div className="flex items-center flex-wrap gap-2">
      <div className="text-xs text-[#6e6e73] text-right leading-5">
        {syncRunning ? (
          <span className="text-[#0071e3] font-medium">
            {importStatus?.currentRun?.total
              ? t("back.eventCalendarList.syncProgress", {
                  done: importStatus.currentRun.listed ?? 0,
                  total: importStatus.currentRun.total,
                  created: importStatus.currentRun.created ?? 0,
                })
              : t("back.eventCalendarList.syncRunning")}
          </span>
        ) : lastRun?.finishedAt ? (
          <>
            <span>
              {t("back.eventCalendarList.syncLast")} {dayjs(lastRun.finishedAt).format(SYS_DATE_TIME_FORMAT)}
              {" · "}
              {t("back.eventCalendarList.syncSummary", {
                created: lastRun.created ?? 0,
                updated: lastRun.updated ?? 0,
                failed: lastRun.failed ?? 0,
              })}
            </span>
            {lastRun.error && (
              <Tooltip title={lastRun.error}>
                <span className="ml-1 text-[#d70015]">{t("back.eventCalendarList.syncError")}</span>
              </Tooltip>
            )}
            {importStatus?.pendingCount > 0 && (
              <div className="text-[#b36200]">
                {t("back.eventCalendarList.syncPending", { count: importStatus.pendingCount })}
              </div>
            )}
          </>
        ) : (
          <span>{t("back.eventCalendarList.syncNever")}</span>
        )}
      </div>
      <Tooltip title={t("back.eventCalendarList.syncDaily", { source: importStatus?.source })}>
        <InfoCircleOutlined className="text-[#6e6e73]" />
      </Tooltip>
      <Button
        icon={<CloudDownloadOutlined />}
        onClick={() => setSyncModalOpen(true)}
        loading={isStartingSync || syncRunning}
        disabled={syncRunning}
      >
        {t("back.eventCalendarList.syncNow")}
      </Button>
      {syncRunning && (
        <Button
          danger
          icon={<StopOutlined />}
          onClick={() => stopImport()}
          loading={isStopping || importStatus?.stopping}
        >
          {importStatus?.stopping ? t("back.eventCalendarList.syncStopping") : t("back.eventCalendarList.syncStop")}
        </Button>
      )}
      <Button
        danger
        icon={<ClearOutlined />}
        onClick={handleClearImported}
        loading={isClearing}
        disabled={syncRunning}
      >
        {t("back.eventCalendarList.clearImported")}
      </Button>
      <ImportSyncModal
        open={syncModalOpen}
        onCancel={() => setSyncModalOpen(false)}
        onConfirm={(options) => syncImport(options)}
        loading={isStartingSync}
        defaultMonths={importStatus?.horizonMonths}
      />
    </div>
  );

  const pageAllSelected =
    eventCalendarData.length > 0 && eventCalendarData.every((r) => selectedIds.includes(r.eventId));
  const bulkBar = isAdmin && selectedIds.length > 0 && (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 md:px-5 py-2.5 bg-[#f0f7ff] border-b border-[#e5e5ea] text-sm">
      <span className="font-medium text-[#1d1d1f]">
        {t("back.eventCalendarList.selectedCount", { count: selectedIds.length })}
      </span>
      {pageAllSelected && selectedIds.length < totalData && (
        <Button type="link" size="small" className="!px-0" loading={selectingAll} onClick={selectAllMatching}>
          {t("back.eventCalendarList.selectAllMatching", { count: totalData })}
        </Button>
      )}
      {selectedIds.length === totalData && totalData > eventCalendarData.length && (
        <span className="text-[#6e6e73]">{t("back.eventCalendarList.allMatchingSelected", { count: totalData })}</span>
      )}
      <Button type="link" size="small" className="!px-0" onClick={() => setSelectedIds([])}>
        {t("back.eventCalendarList.clearSelection")}
      </Button>
      <div className="flex flex-wrap gap-2 md:ml-auto">
        <Button size="small" type="primary" icon={<CheckOutlined />} loading={isBulkUpdating} onClick={handleBulkApprove}>
          {t("back.eventCalendarList.approve")}
        </Button>
        <Button size="small" danger icon={<CloseOutlined />} loading={isBulkUpdating} onClick={handleBulkReject}>
          {t("back.eventCalendarList.reject")}
        </Button>
        <Button size="small" icon={<StarFilled className="!text-[#f5a623]" />} loading={isBulkMajor} onClick={() => handleBulkMajor(true)}>
          {t("back.eventCalendarList.setMajor")}
        </Button>
        <Button size="small" icon={<StarOutlined />} loading={isBulkMajor} onClick={() => handleBulkMajor(false)}>
          {t("back.eventCalendarList.unsetMajor")}
        </Button>
        <Button size="small" danger type="primary" icon={<DeleteOutlined />} loading={isBulkDeleting} onClick={handleBulkDelete}>
          {t("general.buttonDelete")}
        </Button>
      </div>
    </div>
  );

  return (
    <Spin spinning={isLoading}>
      {view === VIEWS.LIST && (
        <div>
          <PageHeader menu="eventCalendarList" />
          <PermissionActionTable
            headerExtra={importPanel}
            subHeader={bulkBar}
            className="!w-full !text-nowrap"
            rowKey="eventId"
            rowSelection={
              isAdmin
                ? {
                    selectedRowKeys: selectedIds,
                    preserveSelectedRowKeys: true,
                    onChange: (keys) => setSelectedIds(keys),
                  }
                : undefined
            }
            columns={columns.map((c) => ({
              ...c,
              ...(c.search && getColumnSearchProps(c.dataIndex)),
            }))}
            dataSource={eventCalendarData}
            bordered
            scroll={{ x: true }}
            pagination={{
              pageSize: limitPage,
              current: page,
              onChange: (p, ps) => {
                setPage(p);
                setLimitPage(ps);
              },
              total: totalData,
              pageSizeOptions: ["10", "20", "50", "100"],
              showSizeChanger: true,
            }}
            onChange={handleChange}
            rawId="eventCalendarList"
            totalText={t("back.eventCalendarList.allEvents")}
            totalData={totalData}
            recordPermission={true}
            extraPosition="start"
            inlineActions
            extraActions={(record) =>
              [
                // Always four icons so they line up down the table; the one matching the current status is greyed out.
                roleUser === "admin" && (
                  <Button
                    key="approve"
                    type="link"
                    icon={<CheckOutlined />}
                    onClick={() => handleApprove(record?.eventId)}
                    disabled={record?.isApproved === true}
                    loading={updateStatus === record?.eventId}
                  >
                    {t("back.eventCalendarList.approve")}
                  </Button>
                ),
                roleUser === "admin" && (
                  <Button
                    key="reject"
                    type="link"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => showRejectModal((reason) => handleReject(record?.eventId, reason))}
                    disabled={record?.isApproved === false}
                    loading={updateStatus === record?.eventId}
                  >
                    {t("back.eventCalendarList.reject")}
                  </Button>
                ),
                <Button
                  key="view"
                  color="default"
                  variant="link"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setSelectedEvent(record?.eventId);
                    setView(VIEWS.DETAILS);
                  }}
                >
                  {t("back.couponList.view")}
                </Button>,
                roleUser === "admin" && (
                  <Button
                    key="delete"
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record?.eventId)}
                  >
                    {t("general.buttonDelete")}
                  </Button>
                ),
              ].filter(Boolean)
            }
          />
        </div>
      )}
      {view === VIEWS.DETAILS && selectedEvent && (
        <EventCalendarDetails
          eventId={selectedEvent}
          onBack={() => {
            setSelectedEvent(null);
            setView(VIEWS.LIST);
          }}
        />
      )}
    </Spin>
  );
};

export default EventCalendarList;
