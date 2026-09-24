import { Avatar, Dropdown } from "antd";
import { DownOutlined, HistoryOutlined, LogoutOutlined, MenuOutlined, SolutionOutlined, UserOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { logo_black } from "assets";
import LanguageSelector from "components/languageSelector";
import NotificationBell from "components/notificationBell";
import useMe, { useLogout } from "hooks/useMe";
import { useAvatarUrl, useDisplayName, useRoleLabel } from "hooks/useMeDisplay";

/** Top bar of the back office ("Console"). The public site keeps components/menu. */
export default function BackOfficeHeader({ onOpenMenu }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: me } = useMe({ retry: 0 });
  const logout = useLogout({ onSuccess: () => navigate("/login") });

  const name = useDisplayName(me);
  const roleLabel = useRoleLabel(me);
  const avatarUrl = useAvatarUrl(me);
  const isGuest = !me?.role?.roleType || me?.role?.roleType === "guest";

  const navMenu = [
    { text: t("front.menu.eventCalendar"), link: "/eventCalendar" },
    { text: t("front.menu.contact"), link: "/contact" },
  ];

  const userMenuItems = [
    {
      type: "group",
      label: (
        <div className="flex flex-col items-center text-center px-2 pt-2 pb-1 min-w-[200px]">
          <Avatar src={avatarUrl || undefined} icon={<UserOutlined />} size={52} className="!bg-[#0071e3] mb-2" />
          <span className="font-semibold text-[#1d1d1f] leading-tight">{name}</span>
          {me?.email && <span className="text-xs text-[#6e6e73] mt-0.5 break-all">{me.email}</span>}
        </div>
      ),
    },
    { type: "divider" },
    ...(isGuest
      ? [{ key: "history", icon: <HistoryOutlined />, label: <Link to="/backoffice/historyList">{t("front.menu.registrationHistory")}</Link> }]
      : []),
    { key: "profile", icon: <SolutionOutlined />, label: <Link to="/backoffice/setting">{t("front.menu.profile.title")}</Link> },
    { key: "logout", icon: <LogoutOutlined />, danger: true, label: t("front.menu.logout") },
  ];

  return (
    <header className="bo-header sticky top-0 z-50 h-16">
      <div className="h-full flex items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-8 min-w-0">
          {onOpenMenu && (
            <button
              type="button"
              aria-label="Open menu"
              onClick={onOpenMenu}
              className="lg:hidden w-9 h-9 -ml-1 flex items-center justify-center rounded-full text-[#424245] hover:bg-[rgba(0,0,0,0.05)] cursor-pointer"
            >
              <MenuOutlined className="text-[17px]" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={logo_black} alt="Action" className="h-8 md:h-9 w-auto" />
            <span className="hidden sm:inline-flex items-center h-6 px-2 rounded-md bg-[rgba(0,113,227,0.1)] text-[#0071e3] text-[11px] font-bold tracking-[0.08em]">
              CONSOLE
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            {navMenu.map((item) => (
              <Link
                key={item.link}
                to={item.link}
                className={`text-sm font-medium transition-colors ${location.pathname.startsWith(item.link) ? "!text-[#0071e3]" : "!text-[#424245] hover:!text-[#1d1d1f]"}`}
              >
                {item.text}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <LanguageSelector variant="pill" />
          <NotificationBell />
          <span className="hidden md:block w-px h-6 bg-[#e5e5ea] mx-1" />
          <Dropdown
            menu={{ items: userMenuItems, onClick: ({ key }) => key === "logout" && logout() }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <button type="button" className="flex items-center gap-2.5 rounded-full pl-1 pr-2 py-1 hover:bg-[rgba(0,0,0,0.04)] transition-colors cursor-pointer">
              <Avatar src={avatarUrl || undefined} icon={<UserOutlined />} size={34} className="!bg-[#0071e3] shrink-0" />
              <span className="hidden md:flex flex-col items-start leading-tight text-left max-w-[180px]">
                <span className="text-[13px] font-semibold text-[#1d1d1f] truncate max-w-full">{name}</span>
                <span className="text-[11px] text-[#6e6e73] truncate max-w-full">{roleLabel}</span>
              </span>
              <DownOutlined className="hidden md:inline text-[10px] text-[#6e6e73]" />
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
