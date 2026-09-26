import { useEffect, useMemo, useState } from "react";
import { Input, Select, Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import backOfficeServices from "services/backoffice.services";
import EventStarButton from "components/eventStarButton";
import useActiveEvent from "hooks/useActiveEvent";
import { SYS_DATE_FORMAT } from "constants/helper";

const STATUS = { ALL: "all", OPEN: "open", CLOSED: "closed" };

// Same rule as the backend's "registrationStatus" filter: published and now inside the
// registration window (a missing bound means unbounded).
const isRegistrationOpen = (event) => {
  if (event?.isDraft) return false;
  const now = dayjs();
  if (event?.startRegistrationDate && now.isBefore(dayjs(event.startRegistrationDate))) return false;
  if (event?.endRegistrationDate && now.isAfter(dayjs(event.endRegistrationDate))) return false;
  return true;
};

const formatDateTime = (value) => (value ? dayjs(value).format(`${SYS_DATE_FORMAT} HH:mm`) : "-");

/** Every event the user can see, each with a star to make it the active event. */
export default function DashboardEventTable() {
  const { t } = useTranslation();
  const { activeEvent } = useActiveEvent();
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState(STATUS.ALL);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sortField, setSortField] = useState(undefined);
  const [order, setOrder] = useState("asc");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchText(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const paging = useMemo(() => ({
    size,
    page: page - 1,
    sortField,
    sortDirection: order,
    search: [
      searchText ? { searchField: "name", searchText } : null,
      status !== STATUS.ALL ? { searchField: "registrationStatus", searchText: status } : null,
    ].filter(Boolean),
  }), [size, page, sortField, order, searchText, status]);

  const { data, isFetching } = backOfficeServices.useQueryGetAllActiveEvents({
    paging,
    queryKey: ["getAllActiveEvents", "dashboard", paging],
  });

  const columns = [
    {
      key: "star",
      width: 56,
      align: "center",
      render: (_, record) => <EventStarButton event={record} />,
    },
    {
      title: t("back.event.home.eventName"),
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (value) => (
        <span className="block font-semibold text-[#1d1d1f] truncate max-w-[360px]" title={value}>{value}</span>
      ),
    },
    {
      title: t("back.event.home.eventDate"),
      dataIndex: "eventDate",
      key: "eventDate",
      sorter: true,
      render: (value) => <span className="tabular-nums">{value ? dayjs(value).format(SYS_DATE_FORMAT) : "-"}</span>,
    },
    {
      title: t("back.workspace.registrationPeriod"),
      key: "registration",
      render: (_, record) => (
        <span className="text-[13px] text-[#424245] tabular-nums whitespace-nowrap">
          {formatDateTime(record?.startRegistrationDate)} – {formatDateTime(record?.endRegistrationDate)}
        </span>
      ),
    },
    {
      title: t("back.event.home.statusTitle"),
      key: "status",
      width: 140,
      render: (_, record) => {
        const open = isRegistrationOpen(record);
        return (
          <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap ${open ? "text-[#1a7f37]" : "text-[#6e6e73]"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${open ? "bg-[#34c759]" : "bg-[#a1a1a6]"}`} />
            {open ? t("general.openRegistration") : t("general.closedRegistration")}
          </span>
        );
      },
    },
  ];

  return (
    <div className="bo-card bo-card-flat flex-1 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 md:px-5 border-b border-[#e5e5ea]">
        <div className="min-w-0 md:mr-auto">
          <div className="text-[15px] font-semibold text-[#1d1d1f]">{t("back.workspace.pickTitle")}</div>
          <div className="text-[13px] text-[#6e6e73]">{t("back.workspace.pickDesc")}</div>
        </div>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-[#6e6e73]" />}
          placeholder={t("back.event.home.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="md:!max-w-[280px]"
        />
        <Select
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          className="md:!w-[180px]"
          options={[
            { value: STATUS.ALL, label: `${t("back.event.home.statusTitle")}: ${t("general.all")}` },
            { value: STATUS.OPEN, label: `${t("back.event.home.statusTitle")}: ${t("general.openRegistration")}` },
            { value: STATUS.CLOSED, label: `${t("back.event.home.statusTitle")}: ${t("general.closedRegistration")}` },
          ]}
        />
      </div>

      <Table
        className="bo-flush-table"
        rowKey="id"
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching && !data}
        scroll={{ x: "max-content" }}
        rowClassName={(record) => (record.id === activeEvent?.id ? "bo-row-starred" : "")}
        onChange={(_pagination, _filters, sorter) => {
          setOrder(sorter.order === "descend" ? "desc" : "asc");
          setSortField(sorter.order ? sorter.field : undefined);
        }}
        pagination={{
          current: page,
          pageSize: size,
          total: data?.totalElements ?? 0,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          onChange: (p, ps) => {
            if (ps !== size) {
              setSize(ps);
              setPage(1);
            } else {
              setPage(p);
            }
          },
          showTotal: (count, range) => t("back.shell.showing", { from: range[0], to: range[1], total: count }),
        }}
      />
    </div>
  );
}
