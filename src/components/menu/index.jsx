import { logo_black } from "assets";
import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LanguageSelector from "components/languageSelector";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";
import { Avatar, Dropdown } from "antd";
import { CalendarOutlined, DashboardOutlined, DownOutlined, HistoryOutlined, LoginOutlined, LogoutOutlined, MenuOutlined, SolutionOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import useMe, { useLogout } from "hooks/useMe";
import { isFullWidthPath } from "utils";
import { usePublicImageUrl } from "utils/fileUtils";

export default function Menu() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isTablet = useMediaQuery({ query: "(max-width: 992px)" });

  const { data: me, status } = useMe({ retry: 0 });
  const isLoggedIn = status === "success" && !!me;

  const logout = useLogout({ onSuccess: () => navigate("/login") });

  const menus = me?.role.permissions
    .map(p => p.menu)
    .sort((a, b) => a.position - b.position) || []
  // Only roles granted the dashboard menu (admin, organizer) get the "manage events" shortcut,
  // which opens /dashboard (the event picker).
  const dashboardMenu = menus.find((m) => m.title === "dashboard" && m.path);

  const currentLanguage = i18n.language?.toLowerCase();

  // "Contact us" is hidden from the navigation for now (the /contact page still exists).
  const navMenu = useMemo(() => [
    { text: t("front.menu.eventCalendar"), link: "/eventCalendar" },
  ], [currentLanguage]);

  const isActive = (link) => location.pathname === link || location.pathname.startsWith(link + "/");
  const isFullWidth = isFullWidthPath(location.pathname);

  const handleLogout = async () => {
    await logout();
  };

  const { data: resolvedAvatarUrl } = usePublicImageUrl({
    key: me?.pictureUrl,
    prefix: me?.prefixPath || "userData",
  });
  const avatarUrl = me?.pictureUrl ? resolvedAvatarUrl : null;

  const currentName =
    currentLanguage === "en" && me?.firstNameEn
      ? [me?.firstNameEn, me?.lastNameEn].filter(Boolean).join(" ")
      : [me?.firstName, me?.lastName].filter(Boolean).join(" ");

  const isGuestUser = !me?.role?.roleType || me?.role?.roleType === "guest";

  const userMenuItems = [
    {
      type: "group",
      label: (
        <div className="flex flex-col items-center text-center px-2 pt-2 pb-1 min-w-[190px]">
          <Avatar
            src={avatarUrl || undefined}
            icon={<UserOutlined />}
            size={56}
            className="!bg-brand mb-2 ring-2 ring-gray-100"
          />
          <span className="font-semibold text-gray-800 leading-tight">
            {currentName || me?.email}
          </span>
          {me?.email && (
            <span className="text-xs text-gray-400 mt-0.5 break-all">{me.email}</span>
          )}
        </div>
      ),
    },
    { type: "divider" },
    ...(isGuestUser
      ? [
          {
            key: "history",
            icon: <HistoryOutlined />,
            label: <Link to="/historyList">{t("front.menu.registrationHistory")}</Link>,
          },
        ]
      : []),
    {
      key: "profile",
      icon: <SolutionOutlined />,
      label: <Link to="/setting">{t("front.menu.profile.title")}</Link>,
    },
    ...(dashboardMenu
      ? [
          {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link to={dashboardMenu.path}>{t("back.workspace.manageEvents")}</Link>,
          },
        ]
      : []),
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("front.menu.logout"),
    },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === "logout") handleLogout();
  };

  // Phone menu: a small dropdown under the ☰ / avatar. The calendar has its own icon next to
  // the logo, so the dropdown only carries account actions.
  const mobileMenuItems = isLoggedIn
    ? userMenuItems
    : [
        {
          key: "login",
          icon: <LoginOutlined />,
          label: <Link to="/login">{t("front.menu.loginRegister")}</Link>,
        },
        {
          key: "organizer",
          icon: <TeamOutlined />,
          label: <Link to="/organizer/register">{t("front.menu.organizer")}</Link>,
        },
      ];

  const navLinkClass = (link) =>
    `font-semibold text-[15px] transition-colors pb-1 ${
      isActive(link)
        ? "text-brand border-b-2 border-brand"
        : "text-inkx-variant hover:text-brand border-b-2 border-transparent"
    }`;

  return (
    <div className="bg-white/85 backdrop-blur-md border-b border-gray-200">
      <nav className={`flex justify-between items-center h-[56px] md:h-[65px] px-4 md:px-6 mx-auto ${isFullWidth ? "max-w-full" : "max-w-[1200px]"}`}>
        {/* Left: logo + desktop nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="shrink-0">
            <img src={logo_black} alt="Logo" className="h-9 md:h-12 w-auto align-middle" />
          </Link>

          {/* Phone: calendar shortcut right next to the logo */}
          {isTablet && (
            <Link
              to="/eventCalendar"
              aria-label={t("front.reg.calendar")}
              className={`-ml-4 w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-95 ${
                isActive("/eventCalendar") ? "bg-brand-fixed text-brand" : "text-inkx-variant hover:bg-gray-100"
              }`}
            >
              <CalendarOutlined style={{ fontSize: 19 }} />
            </Link>
          )}

          {!isTablet && (
            <div className="flex items-center gap-7">
              {navMenu.map((item) => (
                <Link key={item.link} to={item.link} className={navLinkClass(item.link)}>
                  {item.text}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSelector className="flex" />

          {isLoggedIn ? (
            !isTablet && (
              <Dropdown
                menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <button className="flex items-center gap-1 rounded-full transition-transform active:scale-95 hover:opacity-90">
                  <Avatar
                    src={avatarUrl || undefined}
                    icon={<UserOutlined />}
                    size={32}
                    className="!bg-brand cursor-pointer ring-1 ring-gray-200"
                  />
                  <DownOutlined className="text-[10px] text-gray-400" />
                </button>
              </Dropdown>
            )
          ) : (
            !isTablet && (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg font-semibold text-inkx-variant hover:bg-gray-100 transition-colors"
                >
                  {t("front.menu.loginRegister")}
                </Link>
                <Link
                  to="/organizer/register"
                  className="px-5 py-2 rounded-lg font-semibold text-white bg-brand hover:bg-brand-dark shadow-md transition-all active:scale-95"
                >
                  {t("front.menu.organizer")}
                </Link>
              </>
            )
          )}

          {/* Mobile */}
          {isTablet && (
            <Dropdown
              menu={{ items: mobileMenuItems, onClick: handleUserMenuClick }}
              trigger={["click"]}
              placement="bottomRight"
              overlayClassName="mobile-nav-dropdown"
            >
              <button
                type="button"
                aria-label={t("front.reg.menu")}
                className="flex items-center gap-1.5 h-9 pl-1 pr-2 rounded-full text-inkx-variant hover:bg-gray-100 active:scale-95 transition-all"
              >
                {isLoggedIn ? (
                  <Avatar
                    src={avatarUrl || undefined}
                    icon={<UserOutlined />}
                    size={28}
                    className="!bg-brand ring-1 ring-gray-200"
                  />
                ) : null}
                <MenuOutlined style={{ fontSize: 18 }} />
              </button>
            </Dropdown>
          )}
        </div>
      </nav>

    </div>
  );
}
