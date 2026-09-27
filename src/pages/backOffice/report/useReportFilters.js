import { useMemo, useState } from "react";
import dayjs from "dayjs";
import useMe from "hooks/useMe";
import useActiveEvent from "hooks/useActiveEvent";
import backOfficeServices from "services/backoffice.services";
import { SYS_DATE_FORMAT } from "constants/helper";

/**
 * One filter state shared by every report tab: the event (the starred one) and the period.
 * Every report counts orders by the date they were created (registration date), so the same
 * period applies to all of them; "month" is the billing view, "custom" any range of days.
 * Starts on the starred event (or the newest one) and the current month, so the page is never blank.
 */
export default function useReportFilters() {
  const { data: me } = useMe({ retry: 0 });
  const role = me?.role?.roleType;
  const isAdmin = role === "admin";
  const { activeEvent } = useActiveEvent();

  // Admin: every event; organizer: own + invited (same list the dashboard uses).
  const { data: events } = backOfficeServices.useQueryGetAllEventsDashboard();

  // The starred event in the top bar picks the report; without one, the newest event.
  const eventId = activeEvent?.id || events?.[0]?.id || null;
  const [periodMode, setPeriodMode] = useState("month");
  const [month, setMonth] = useState(() => dayjs());
  const [range, setRange] = useState(null);

  const period = useMemo(() => {
    if (periodMode === "month") return month ? [month.startOf("month"), month.endOf("month")] : null;
    return range?.[0] && range?.[1] ? [range[0].startOf("day"), range[1].endOf("day")] : null;
  }, [periodMode, month, range]);

  const event = useMemo(() => (events || []).find((e) => e.id === eventId) || null, [events, eventId]);

  return {
    role,
    isAdmin,
    events: events || [],
    event,
    eventId,
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
