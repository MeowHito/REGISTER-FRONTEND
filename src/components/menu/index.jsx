import { logo_black } from "assets";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LanguageSelector from "components/languageSelector";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";
import { Avatar, Drawer, Dropdown } from "antd";
import { DownOutlined, HistoryOutlined, LogoutOutlined, MenuOutlined, SolutionOutlined, UserOutlined } from "@ant-design/icons";
import useMe, { useLogout } from "hooks/useMe";
import { isFullWidthPath } from "utils";
import { usePublicImageUrl } from "utils/fileUtils";

export default function Menu() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isTablet = useMediaQuery({ query: "(max-width: 992px)" });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: me, status } = useMe({ retry: 0 });
  const isLoggedIn = status === "success" && !!me;

  const logout = useLogout({ onSuccess: () => navigate("/login") });

  const menus = me?.role.permissions
    .map(p => p.menu)
    .sort((a, b) => a.position - b.position) || []
  const defaultMenu = menus?.[0] || { path: "/backoffice/setting" };

  const currentLanguage = i18n.language?.toLowerCase();

  const navMenu = useMemo(() => [
    { text: t("front.menu.eventCalendar"), link: "/eventCalendar" },
    { text: t("front.menu.contact"), link: "/contact" },
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
            label: <Link to="/backoffice/historyList">{t("front.menu.registrationHistory")}</Link>,
          },
        ]
      : []),
    {
      key: "profile",
      icon: <SolutionOutlined />,
      label: <Link to="/backoffice/setting">{t("front.menu.profile.title")}</Link>,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("front.menu.logout"),
    },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === "logout") handleLogout();
  };

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
          {!isTablet && <LanguageSelector className="flex" />}

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
            <>
              <LanguageSelector className="flex" />
              {isLoggedIn && (
                <Avatar
                  src={avatarUrl || undefined}
                  icon={<UserOutlined />}
                  size={30}
                  onClick={() => setDrawerOpen(true)}
                  className="!bg-brand cursor-pointer ring-1 ring-gray-200"
                />
              )}
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setDrawerOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-inkx-variant hover:bg-gray-100 active:scale-95 transition-all"
              >
                <MenuOutlined style={{ fontSize: 18 }} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      <Drawer
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={280}
        styles={{ body: { padding: 0 } }}
        title={<img src={logo_black} alt="Logo" className="h-8 w-auto" />}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4 space-y-1">
            {navMenu.map((item) => (
              <Link
                key={item.link}
                to={item.link}
                onClick={() => setDrawerOpen(false)}
                className={`block px-4 py-3 rounded-xl font-semibold ${
                  isActive(item.link) ? "text-brand bg-brand-fixed" : "text-inkx-variant hover:bg-gray-100"
                }`}
              >
                {item.text}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-3">
            {isLoggedIn ? (
              <>
                <div className="flex flex-col items-center text-center pb-2">
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
                {isGuestUser && (
                  <Link
                    to="/backoffice/historyList"
                    onClick={() => setDrawerOpen(false)}
                    className="w-full block text-center py-3 rounded-xl border-2 border-brand text-brand font-bold"
                  >
                    {t("front.menu.registrationHistory")}
                  </Link>
                )}
                <Link
                  to="/backoffice/setting"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full block text-center py-3 rounded-xl border-2 border-brand text-brand font-bold"
                >
                  {t("front.menu.profile.title")}
                </Link>
                <button
                  onClick={() => { setDrawerOpen(false); handleLogout(); }}
                  className="w-full py-3 rounded-xl bg-brand text-white font-bold"
                >
                  {t("front.menu.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full block text-center py-3 rounded-xl border-2 border-brand text-brand font-bold"
                >
                  {t("front.menu.loginRegister")}
                </Link>
                <Link
                  to="/organizer/register"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full block text-center py-3 rounded-xl bg-brand text-white font-bold"
                >
                  {t("front.menu.organizer")}
                </Link>
              </>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
