import { useState } from "react";
import { Badge, Button, Popover, Spin } from "antd";
import {
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined,
  ExclamationCircleOutlined,
  NotificationOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import backOfficeServices from "services/backoffice.services";
import { SYS_DATE_TIME_FORMAT } from "constants/helper";

const TYPE_STYLE = {
  ORGANIZER_PENDING: { icon: <UserAddOutlined />, className: "bg-[rgba(88,86,214,0.12)] text-[#5856d6]" },
  HELP_REQUEST: { icon: <CustomerServiceOutlined />, className: "bg-[rgba(255,159,10,0.14)] text-[#b36200]" },
  ANNOUNCEMENT_SUBMITTED: { icon: <NotificationOutlined />, className: "bg-[rgba(255,159,10,0.14)] text-[#b36200]" },
  EVENT_CALENDAR_SUBMITTED: { icon: <CalendarOutlined />, className: "bg-[rgba(48,176,199,0.14)] text-[#1f7f91]" },
  ORDER_REVIEW: { icon: <ExclamationCircleOutlined />, className: "bg-[rgba(255,59,48,0.1)] text-[#d70015]" },
  ORDER_PAID: { icon: <CheckCircleOutlined />, className: "bg-[rgba(52,199,89,0.12)] text-[#1d7c34]" },
  EVENT_INVITED: { icon: <TeamOutlined />, className: "bg-[rgba(0,113,227,0.1)] text-[#0071e3]" },
  EVENT_PERMISSION_GRANTED: { icon: <TeamOutlined />, className: "bg-[rgba(0,113,227,0.1)] text-[#0071e3]" },
};

function useTimeAgo() {
  const { t } = useTranslation();
  return (value) => {
    if (!value) return "";
    const minutes = dayjs().diff(dayjs(value), "minute");
    if (minutes < 1) return t("back.shell.notification.justNow");
    if (minutes < 60) return t("back.shell.notification.minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("back.shell.notification.hoursAgo", { count: hours });
    return dayjs(value).format(SYS_DATE_TIME_FORMAT);
  };
}

/** Bell with the signed-in user's latest notifications (polled every 30 s). */
export default function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const timeAgo = useTimeAgo();
  const [open, setOpen] = useState(false);

  const { data, isFetching } = backOfficeServices.useQueryGetMyNotifications();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["getMyNotifications"] });
  const { mutateAsync: markRead } = backOfficeServices.useMutationReadNotification(refresh);
  const { mutate: markAllRead, isPending: markingAll } = backOfficeServices.useMutationReadAllNotifications(refresh);

  const items = data?.items || [];
  const unread = data?.unreadCount || 0;

  const handleOpenItem = async (item) => {
    setOpen(false);
    if (!item.read) {
      try {
        await markRead({ id: item.id });
      } catch {
        // marking read is best-effort; still take the user where they wanted to go
      }
    }
    if (item.link) navigate(item.link);
  };

  const content = (
    <div className="w-[min(360px,calc(100vw-32px))]">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-[15px] font-semibold text-[#1d1d1f]">{t("back.shell.notification.title")}</span>
        {unread > 0 && (
          <Button type="link" size="small" className="!px-0" loading={markingAll} onClick={() => markAllRead()}>
            {t("back.shell.notification.markAllRead")}
          </Button>
        )}
      </div>
      <Spin spinning={isFetching && !data}>
        <div className="max-h-[420px] bo-scroll-y pb-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[#6e6e73] text-sm gap-2">
              <BellOutlined className="text-2xl text-[#c7c7cc]" />
              {t("back.shell.notification.empty")}
            </div>
          ) : (
            items.map((item) => {
              const style = TYPE_STYLE[item.type] || TYPE_STYLE.EVENT_INVITED;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenItem(item)}
                  className={`w-full text-left flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[rgba(0,0,0,0.04)] ${item.read ? "" : "bg-[rgba(0,113,227,0.04)]"}`}
                >
                  <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${style.className}`}>
                    {style.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className={`text-sm leading-snug ${item.read ? "text-[#424245]" : "text-[#1d1d1f] font-semibold"}`}>
                        {item.title}
                      </span>
                      {!item.read && <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-[#0071e3]" />}
                    </span>
                    {item.message && (
                      <span className="block text-xs text-[#6e6e73] mt-0.5 leading-relaxed break-words">{item.message}</span>
                    )}
                    <span className="block text-[11px] text-[#86868b] mt-1">{timeAgo(item.createdTime)}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </Spin>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      open={open}
      onOpenChange={setOpen}
      styles={{ body: { padding: 0, borderRadius: 14 } }}
    >
      <button
        type="button"
        aria-label={t("back.shell.notification.title")}
        className="relative w-9 h-9 flex items-center justify-center rounded-full text-[#424245] hover:bg-[rgba(0,0,0,0.05)] transition-colors cursor-pointer"
      >
        <Badge count={unread} size="small" offset={[2, -2]} color="#ff3b30">
          <BellOutlined className="text-[18px] text-[#424245]" />
        </Badge>
      </button>
    </Popover>
  );
}
