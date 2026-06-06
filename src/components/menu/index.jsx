import { logo_black } from "assets";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelector from "components/languageSelector";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";
import { Dropdown } from "antd";
import { LogoutOutlined, SolutionOutlined, UserOutlined } from "@ant-design/icons";
import useMe, { useLogout } from "hooks/useMe";

export default function Menu() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isTablet = useMediaQuery({ query: "(max-width: 992px)" });

  const { data: me, status } = useMe({ retry: 0 });
  const isLoggedIn = status === "success" && !!me;

  const logout = useLogout({ onSuccess: () => navigate("/login") });

  const menus = me?.role.permissions
    .map(p => p.menu)
    .sort((a, b) => a.position - b.position) || []
  const defaultMenu = menus?.[0] || { path: "/backoffice/setting" };

  const currentLanguage = i18n.language?.toLowerCase();

  const standartMenu = [
    { text: t("front.menu.event"), link: "/event" },
    { text: t("front.menu.eventCalendar"), link: "/eventCalendar" },
    { text: t("front.menu.contact"), link: "/contact" },
  ];

  const mainMenuNormal = [
    ...standartMenu,
    { text: t("front.menu.login"), link: "/login" },
  ];

  const truncate = (text, maxLength = 10) => {
    if (!text) return "";
    if (isTablet) return text;
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const mainMenu = useMemo(() => {
    return isLoggedIn ? standartMenu : mainMenuNormal;
  }, [isLoggedIn, currentLanguage]);

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
    if (key === "logout") {
      handleLogout();
    }
  };

  const navDropdownItems = [
    ...mainMenu.map((m) => ({
      key: `nav-${m.link}`,
      label: <Link to={m.link}>{m.text}</Link>,
    })),
    ...(isLoggedIn
      ? [
        { type: "divider" },
        ...userMenuItems,
      ]
      : []),
  ];

  return (
    <div className="sa-menu">
      <nav className="navbar navbar-expand-lg !p-0">
        <div className="w-full px-3 md:px-5 flex justify-between items-center h-[56px] md:h-[65px]">
          <div className="navbar-brand">
            <Link to="/">
              <img src={logo_black} alt="Logo" className="w-full h-auto align-middle" />
            </Link>
          </div>

          <div className="flex items-center">
            <LanguageSelector className={`flex ${isTablet ? "" : "hidden"}`} />

            {isTablet ? (
              <Dropdown
                menu={{ items: navDropdownItems, onClick: handleUserMenuClick }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <button
                  className="navbar-toggler"
                  type="button"
                  aria-label="Open menu"
                >
                  <span className="navbar-toggler-icon">
                    <i className="fas fa-bars"></i>
                  </span>
                </button>
              </Dropdown>
            ) : (
              <div className="navbar-nav">
                {mainMenu.map((menuItem, index) => (
                  <li
                    className={(menuItem.subMenu ? "sa-dropdown" : "") + " text-nowrap"}
                    key={menuItem.link || index}
                  >
                    {menuItem.subMenu ? (
                      <>
                        <a href="#">{menuItem.text}</a>
                        <ul className="sa-dropdown-menu">
                          {menuItem.subMenu.map((subMenuItem, subIndex) => (
                            <li key={subIndex}>
                              <Link to={subMenuItem.link}>{subMenuItem.text}</Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <Link to={menuItem.link}>{menuItem.text}</Link>
                    )}
                  </li>
                ))}

                {isLoggedIn && (
                  <li className={`cursor-pointer select-none text-nowrap font-medium py-2 ${isTablet ? "" : " center"}`}>
                    <Dropdown
                      menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
                      trigger={["click"]}
                      className="px-3"
                    >
                      <div className="w-full h-full flex items-center">
                        {truncate(currentName || me?.email || "", 16)}
                      </div>
                    </Dropdown>
                  </li>
                )}
              </div>
            )}

            <LanguageSelector className={`m-auto ${isTablet ? "hidden" : "flex"}`} />
          </div>
        </div>
      </nav>
    </div>
  );
}
