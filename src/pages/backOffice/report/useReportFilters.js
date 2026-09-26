import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import useMe from "hooks/useMe";
import useActiveEvent from "hooks/useActiveEvent";
import backOfficeServices from "services/backoffice.services";
import { SYS_DATE_FORMAT } from "constants/helper";

/**
 * One filter state shared by every report tab: the event and the period.
 * Every report counts orders by the date they were created (registration date), so the same
 * period applies to all of them; "month" is the billing view, "custom" any range of days.
 * Starts on the starred event (or the newest one) and the current month, so the page is never blank.
 */
export default function useReportFilters() {
  const { t } = useTranslation();
  const { data: me } = useMe({ retry: 0 });
  const role = me?.role?.roleType;
  const isAdmin = role === "admin";
  const { activeEvent } = useActiveEvent();

  // Admin: every event; organizer: own + invited (same list the dashboard uses).
  const { data: events, isFetching: loadingEvents } = backOfficeServices.useQueryGetAllEventsDashboard();

  const [eventId, setEventId] = useState(activeEvent?.id || null);
  const [periodMode, setPeriodMode] = useState("month");
  const [month, setMonth] = useState(() => dayjs());
  const [range, setRange] = useState(null);

  // Follow the star when it changes; otherwise fall back to the newest event.
  useEffect(() => {
    if (activeEvent?.id) setEventId(activeEvent.id);
  }, [activeEvent?.id]);
  useEffect(() => {
    if (!eventId && !activeEvent?.id && events?.length) setEventId(events[0].id);
  }, [events, eventId, activeEvent?.id]);

  const period = useMemo(() => {
    if (periodMode === "month") return month ? [month.startOf("month"), month.endOf("month")] : null;
    return range?.[0] && range?.[1] ? [range[0].startOf("day"), range[1].endOf("day")] : null;
  }, [periodMode, month, range]);

  const event = useMemo(() => (events || []).find((e) => e.id === eventId) || null, [events, eventId]);

  // Admin sees the list grouped by organizer so a long list stays scannable.
  const eventOptions = useMemo(() => {
    const list = events || [];
    if (!isAdmin) return list.map((e) => ({ value: e.id, label: e.name }));
    const groups = new Map();
    list.forEach((e) => {
      const key = e.organizerName || t("general.unknown");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ value: e.id, label: e.name });
    });
    return [...groups].map(([label, options]) => ({ label, options }));
  }, [events, isAdmin, t]);

  return {
    role,
    isAdmin,
    events: events || [],
    eventOptions,
    loadingEvents,
    event,
    eventId,
    setEventId,
    periodMode,
    setPeriodMode,
    month,
    setMonth,
    range,
    setRange,
    startDate: period?.[0].toISOString(),
    endDate: period?.[1].toISOString(),
    periodText: period ? `${period[0].format(SYS_DATE_FORMAT)} – ${period[1].format(SYS_DATE_FORMAT)}` : "",
  };
}
