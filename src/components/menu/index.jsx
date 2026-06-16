import { logo_black } from "assets";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LanguageSelector from "components/languageSelector";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";
import { Drawer, Dropdown } from "antd";
import { LogoutOutlined, MenuOutlined, SolutionOutlined, UserOutlined } from "@ant-design/icons";
import useMe, { useLogout } from "hooks/useMe";

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
    { text: t("front.menu.event"), link: "/event" },
    { text: t("front.menu.eventCalendar"), link: "/eventCalendar" },
    { text: t("front.menu.contact"), link: "/contact" },
  ], [currentLanguage]);

  const isActive = (link) => location.pathname === link || location.pathname.startsWith(link + "/");
  const isFullWidth = location.pathname.startsWith("/backoffice") || location.pathname === "/";

  const handleLogout = async () => {
    await logout();
  };

  const currentName =
    currentLanguage === "en" && me?.firstNameEn
      ? [me?.firstNameEn, me?.lastNameEn].filter(Boolean).join(" ")
      : [me?.firstName, me?.lastName].filter(Boolean).join(" ");

  const userMenuItems = [
    {
      key: "name",
      icon: <UserOutlined />,
      label: (
        <span className="text-gray-500 cursor-default">
          {currentName || me?.email || ""}
        </span>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "profile",
      icon: <SolutionOutlined />,
      label: <Link to={defaultMenu.path}>{t("front.menu.profile.title")}</Link>,
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
            <img src={logo_black} alt="Logo" className="h-7 md:h-10 w-auto align-middle" />
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
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-inkx-variant hover:bg-gray-100 transition-colors">
                <UserOutlined />
                <span className="max-w-[140px] truncate">{currentName || me?.email}</span>
              </button>
            </Dropdown>
          ) : (
            !isTablet && (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg font-semibold text-inkx-variant hover:bg-gray-100 transition-colors"
                >
                  {t("front.menu.login")}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-lg font-semibold text-white bg-brand hover:bg-brand-dark shadow-md transition-all active:scale-95"
                >
                  {t("front.menu.register")}
                </Link>
              </>
            )
          )}

          {/* Mobile */}
          {isTablet && (
            <>
              <LanguageSelector className="flex" />
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
                <Link
                  to={defaultMenu.path}
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
                  {t("front.menu.login")}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full block text-center py-3 rounded-xl bg-brand text-white font-bold"
                >
                  {t("front.menu.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
