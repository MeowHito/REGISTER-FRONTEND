import { useEffect, useMemo, useState } from "react";
import { SearchOutlined, StarFilled } from "@ant-design/icons";
import { Select, Spin } from "antd";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import backOfficeServices from "services/backoffice.services";
import useActiveEvent from "hooks/useActiveEvent";
import { SYS_DATE_FORMAT } from "constants/helper";

const STATUS = { ALL: "all", ACTIVE: "active", DRAFT: "draft" };

/** Top-bar search that stars (switches to) another event without going back to the dashboard. */
export default function EventSwitcher({ className = "" }) {
  const { t } = useTranslation();
  const { activeEvent, confirmToggleActiveEvent } = useActiveEvent();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState(STATUS.ALL);

  // Debounce typing so the list isn't re-fetched per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearchText(input.trim()), 350);
    return () => clearTimeout(timer);
  }, [input]);

  const paging = useMemo(() => ({
    page: 0,
    size: 20,
    search: [
      searchText ? { searchField: "name", searchText } : null,
      status !== STATUS.ALL
        ? { searchField: "isDraft", searchText: String(status === STATUS.DRAFT), searchType: "BOOLEAN" }
        : null,
    ].filter(Boolean),
  }), [searchText, status]);

  // Only fetched while the dropdown is open.
  const { data, isFetching } = backOfficeServices.useQueryGetAllActiveEvents({
    paging,
    queryKey: ["getAllActiveEvents", "switcher", paging],
    enabled: open,
  });
  const events = data?.content ?? [];

  const options = events.map((e) => ({
    value: e.id,
    label: (
      <div className="flex items-center gap-2 min-w-0 py-0.5">
        <span className={`shrink-0 text-sm leading-none ${e.id === activeEvent?.id ? "text-[#f5b301]" : "text-transparent"}`}>
          <StarFilled />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-[#1d1d1f]">{e.name}</span>
          <span className="block text-xs text-[#6e6e73] tabular-nums">
            {e.eventDate ? dayjs(e.eventDate).format(SYS_DATE_FORMAT) : "-"}
            {" · "}
            {e.isDraft ? t("back.event.home.statusDraft") : t("back.event.home.statusActive")}
          </span>
        </span>
      </div>
    ),
  }));

  return (
    <div className={`items-center gap-2 ${className}`}>
      <Select
        showSearch
        value={null}
        open={open}
        onOpenChange={setOpen}
        searchValue={input}
        onSearch={setInput}
        filterOption={false}
        suffixIcon={<SearchOutlined className="text-[#6e6e73]" />}
        placeholder={t("back.event.home.searchPlaceholder")}
        notFoundContent={isFetching ? <div className="flex justify-center py-3"><Spin size="small" /></div> : undefined}
        options={options}
        onSelect={(id) => {
          const event = events.find((e) => e.id === id);
          // Picking the event that is already starred does nothing.
          if (event && event.id !== activeEvent?.id) confirmToggleActiveEvent(event);
          setInput("");
          setOpen(false);
        }}
        popupMatchSelectWidth={320}
        className="w-[200px] 2xl:w-[240px]"
        size="large"
      />
      <Select
        value={status}
        onChange={setStatus}
        size="large"
        className="w-[150px]"
        options={[
          { value: STATUS.ALL, label: `${t("back.event.home.statusTitle")}: ${t("general.all")}` },
          { value: STATUS.ACTIVE, label: `${t("back.event.home.statusTitle")}: ${t("back.event.home.statusActive")}` },
          { value: STATUS.DRAFT, label: `${t("back.event.home.statusTitle")}: ${t("back.event.home.statusDraft")}` },
        ]}
      />
    </div>
  );
}
