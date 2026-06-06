import React, { useState, useEffect } from "react";
import { Button, Tag, Space, message, Input, Modal, Spin } from "antd";
import {
  CheckOutlined,
  SearchOutlined,
  DeleteOutlined,
  CloseOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import Highlighter from "react-highlight-words";
import backOfficeServices from "services/backoffice.services";
import { AlertConfirm, AlertError } from "components/alert";
import { errorToMessage } from "hooks/functions/errorToMessage";
import { handleQueryStatus } from "utils";
import EventCalendarDetails from "../eventCalendarDetails";
import dayjs from "dayjs";
import { SYS_DATE_FORMAT } from "constants/helper";
import useMe from "hooks/useMe";
import PermissionActionTable from "components/permissionActionTable";

const { TextArea } = Input;

const VIEWS = {
  LIST: "list",
  DETAILS: "details",
};

const EventCalendarList = () => {
  const { t } = useTranslation();
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

  const { data: me } = useMe({ retry: 0 });
  const roleUser = me?.role?.roleType;

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

  const showRejectModal = (eventId) => {
    let rejectReason = "";

    Modal.confirm({
      title: t("back.eventCalendarList.confirmReject"),
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
      onOk: () => {
        handleReject(eventId, rejectReason);
      },
    });
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
      sorter: roleUser === "admin",
      search: roleUser === "admin",
    },
    {
      title: t("back.eventCalendarList.eventDate"),
      dataIndex: "eventDate",
      key: "eventDate",
      render: (date) => (date ? dayjs(date).format(SYS_DATE_FORMAT) : null),
    },
    {
      title: t("back.eventCalendarList.submitterName"),
      dataIndex: "submitterName",
      key: "submitterName",
      sorter: roleUser === "admin",
      search: roleUser === "admin",
    },
    {
      title: t("back.eventCalendarList.phone"),
      dataIndex: "phone",
      key: "phone",
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
  ];

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
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#188fff55", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text.toString()}
        />
      ) : (
        text
      ),
  });

  return (
    <Spin spinning={isLoading}>
      {view === VIEWS.LIST && (
        <div>
          <PermissionActionTable
            className="!w-full !text-nowrap"
            rowKey="eventId"
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
            extraActions={(record) =>
              [
                roleUser === "admin" && record?.isApproved !== true && (
                  <Button
                    key="approve"
                    type="link"
                    icon={<CheckOutlined />}
                    onClick={() => handleApprove(record?.eventId)}
                    loading={updateStatus === record?.eventId}
                  >
                    {t("back.eventCalendarList.approve")}
                  </Button>
                ),
                roleUser === "admin" && record?.isApproved !== false && (
                  <Button
                    key="reject"
                    type="link"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => showRejectModal(record?.eventId)}
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
