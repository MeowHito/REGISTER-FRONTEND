import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, ConfigProvider, Drawer, Menu, Spin } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from "@ant-design/icons";
import * as Icons from "@ant-design/icons";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Footer from "components/footer";
import MenuItemBadge from "components/menuItemBadge";
import AnnouncementBanner from "components/announcementBanner";
import BackOfficeHeader from "components/backOfficeHeader";
import { useAvatarUrl, useDisplayName, useRoleLabel } from "hooks/useMeDisplay";
import useMe from "hooks/useMe";
import { PROFILE_LOADING } from "store/reducers/profileSlice";
import { handleQueryStatus } from "utils";
import { backOfficeTheme } from "./theme";
import "./index.css";

// Sidebar sections, keyed by menu title. Anything not listed is "manage".
const MENU_GROUPS = {
  dashboard: "main",
  historyList: "main",
  setting: "system",
  profile: "system",
  operations: "system",
  jobMonitoring: "system",
  emailQueue: "system",
  helpRequests: "system",
};
const GROUP_ORDER = ["main", "manage", "system"];

const BUILD_INFO = import.meta.env.VITE_BUILD_INFO || "";

export default function BackOfficeLayout() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery({ query: "(min-width: 1024px)" });

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

  const currentPathSegs = useMemo(() => location.pathname.split("/"), [location.pathname]);

  const { data: me, status: meStatus, fetchStatus: meFetchStatus } = useMe({ retry: 0 });
  const name = useDisplayName(me);
  const roleLabel = useRoleLabel(me);
  const avatarUrl = useAvatarUrl(me);

  useEffect(() => {
    handleQueryStatus(
      { status: meStatus, fetchStatus: meFetchStatus },
      () => {
        if (!me) return;
        dispatch(PROFILE_LOADING(false));

        const roleType = me?.role?.roleType;
        const hideHistory = roleType === "admin" || roleType === "organizer";

        const menus = me.role.permissions
          .map((p) => p.menu)
          .filter((m) => !(hideHistory && m.title === "historyList"))
          .sort((a, b) => a.position - b.position);

        if (menus.length === 0) return;

        const roleSeg = currentPathSegs[1] || null;
        const selected = menus.find((m) => m.title === roleSeg);

        if (!selected) {
          const firstMenu = menus.find((m) => m.path);
          if (firstMenu) {
            navigate(firstMenu.path, { replace: true });
          } else {
            navigate("/notFoundPage", { replace: true });
          }
          return;
        }

        setMenuItems(menus.filter((m) => m.isDisplay));
      },
      () => {
        navigate("/login", { replace: true });
      }
    );
  }, [meStatus, meFetchStatus, me, currentPathSegs, navigate, t, dispatch]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const groupedItems = useMemo(() => {
    const toItem = (m) => {
      const IconComponent = Icons[m.icon] || Icons.AppstoreOutlined;
      return {
        key: m.path,
        icon: <IconComponent />,
        disabled: !!m.disabled,
        label: (
          <Link
            to={m.path}
            title={t(`back.menu.${m.title}.name`)}
            className="flex items-center justify-between w-full overflow-hidden whitespace-nowrap"
          >
            <span className="truncate">{t(`back.menu.${m.title}.name`)}</span>
            {m.isNoti && <MenuItemBadge badgeKey={m.badgeKey} size="small" offset={[-2, 0]} showZero color="#8e8e93" />}
          </Link>
        ),
      };
    };
    return GROUP_ORDER.map((group) => ({
      type: "group",
      key: `group-${group}`,
      label: t(`back.shell.group.${group}`),
      children: menuItems.filter((m) => (MENU_GROUPS[m.title] || "manage") === group).map(toItem),
    })).filter((g) => g.children.length > 0);
  }, [menuItems, t]);

  // The selected key is the menu whose path prefixes the current URL.
  const selectedKey = useMemo(() => {
    const match = menuItems
      .filter((m) => m.path && (location.pathname === m.path || location.pathname.startsWith(`${m.path}/`)))
      .sort((a, b) => b.path.length - a.path.length)[0];
    return match?.path || location.pathname;
  }, [menuItems, location.pathname]);

  const spinning = meFetchStatus === "fetching" && !me;
  if (spinning) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <Spin />
      </div>
    );
  }

  const narrow = isDesktop && collapsed;

  const sidebarBody = (
    <div className="flex flex-col h-full">
      <div className={`border-b border-[#e5e5ea] ${narrow ? "py-4 flex justify-center" : "px-4 pt-5 pb-4 text-center"}`}>
        <Avatar
          src={avatarUrl || undefined}
          icon={<UserOutlined />}
          size={narrow ? 36 : 56}
          className="!bg-[rgba(0,113,227,0.1)] !text-[#0071e3] ring-1 ring-[#e5e5ea]"
        />
        {!narrow && (
          <>
            <p className="mt-2.5 mb-0 text-sm font-semibold text-[#1d1d1f] leading-tight truncate">{name || "-"}</p>
            <span className="inline-flex mt-1.5 items-center h-5 px-2 rounded-full bg-[rgba(0,113,227,0.1)] text-[#0071e3] text-[11px] font-semibold">
              {roleLabel}
            </span>
          </>
        )}
      </div>

      <div className="flex-1 bo-scroll-y py-2">
        <Menu
          mode="inline"
          inlineCollapsed={narrow}
          selectedKeys={[selectedKey]}
          items={groupedItems}
        />
      </div>

      {isDesktop && (
        <div className={`border-t border-[#e5e5ea] h-12 flex items-center ${narrow ? "justify-center" : "justify-between px-4"}`}>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-2 text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] cursor-pointer"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            {!narrow && t("back.shell.collapse")}
          </button>
          {!narrow && BUILD_INFO && <span className="text-[11px] text-[#a1a1a6] tabular-nums">{BUILD_INFO}</span>}
        </div>
      )}
    </div>
  );

  return (
    <ConfigProvider theme={backOfficeTheme}>
      <div className="bo-shell min-h-screen">
        <BackOfficeHeader onOpenMenu={isDesktop ? undefined : () => setDrawerOpen(true)} />
        <AnnouncementBanner />

        <div className="flex">
          {isDesktop && (
            <aside
              className={`bo-sidebar sticky top-16 h-[calc(100vh-4rem)] shrink-0 bg-white border-r border-[#e5e5ea] transition-[width] duration-200 ${narrow ? "w-[76px]" : "w-[248px]"}`}
            >
              {sidebarBody}
            </aside>
          )}

          <div className="flex-1 min-w-0 flex flex-col min-h-[calc(100vh-4rem)]">
            <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-6 xl:px-8 py-5 md:py-8">
              <Outlet />
            </main>
            <Footer layout="compact" />
          </div>
        </div>

        {!isDesktop && (
          <Drawer
            placement="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            width={272}
            closable={false}
            styles={{ body: { padding: 0 } }}
            rootClassName="bo-sidebar"
          >
            {sidebarBody}
          </Drawer>
        )}
      </div>
    </ConfigProvider>
  );
}
