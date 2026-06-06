import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NOT_FOUND_IMG } from "assets";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Image, Layout, Menu, Spin } from "antd";
import Footer from "components/footer";
import * as Icons from "@ant-design/icons";
import { useMediaQuery } from "react-responsive";
import MenuItemBadge from "components/menuItemBadge";
import { useTranslation } from "react-i18next";
import useMe from "hooks/useMe";
import { useDispatch } from "react-redux";
import { PROFILE_LOADING } from "store/reducers/profileSlice";
import { handleQueryStatus } from "utils";

const { Sider } = Layout;

export default function BackOfficeLayout() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [, setMenuDesc] = useState("");

  const currentPathSegs = useMemo(
    () => location.pathname.split("/"),
    [location.pathname]
  );
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const [menuBtnActive, setMenuBtnActive] = useState(false);
  const idleTimerRef = useRef(null);
  const scrollTickingRef = useRef(false);

  const bumpMenuBtnActive = useCallback(() => {
    setMenuBtnActive(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setMenuBtnActive(false), 800);
  }, []);

  useEffect(() => {
    if (!(isMobile && collapsed)) {
      setMenuBtnActive(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const onPointer = () => bumpMenuBtnActive();

    const onScroll = () => {
      if (scrollTickingRef.current) return;
      scrollTickingRef.current = true;
      requestAnimationFrame(() => {
        bumpMenuBtnActive();
        scrollTickingRef.current = false;
      });
    };

    globalThis.addEventListener("pointerdown", onPointer, { passive: true });
    globalThis.addEventListener("pointermove", onPointer, { passive: true });
    globalThis.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      globalThis.removeEventListener("pointerdown", onPointer);
      globalThis.removeEventListener("pointermove", onPointer);
      globalThis.removeEventListener("scroll", onScroll);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      scrollTickingRef.current = false;
    };
  }, [isMobile, collapsed, bumpMenuBtnActive]);

  const {
    data: me,
    status: meStatus,
    fetchStatus: meFetchStatus,
  } = useMe({ retry: 0 });

  useEffect(() => {
    handleQueryStatus(
      { status: meStatus, fetchStatus: meFetchStatus },
      () => {
        if (!me) return;
        dispatch(PROFILE_LOADING(false));

        const menus = me.role.permissions
          .map(p => p.menu)
          .sort((a, b) => a.position - b.position);

        if (menus.length === 0) return;

        const roleSeg = currentPathSegs[2] || null;
        const selected = menus.find((m) => m.title === roleSeg);

        if (!selected) {
          const firstMenu = menus.find(m => m.path);
          if (firstMenu) {
            navigate(firstMenu.path, { replace: true });
          } else {
            navigate("/notFoundPage", { replace: true });
          }
          return;
        }

        setMenuDesc(t(`back.menu.${selected.title}.desc`));
        setMenuItems(menus.filter((m) => m.isDisplay));
      },
      () => {
        navigate("/login", { replace: true });
      }
    );
  }, [
    meStatus,
    meFetchStatus,
    me,
    currentPathSegs,
    navigate,
    t,
    dispatch,
  ]);

  const toggleCollapsed = () => setCollapsed((c) => !c);

  const spinning = meFetchStatus === "fetching" && !me;
  if (spinning) {
    return (
      <Layout>
        <div className="w-full min-h-screen flex items-center justify-center">
          <Spin />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full min-h-[calc(100vh-40px)] md:min-h-[calc(100vh-65px)]">
        {collapsed && isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Open menu"
            className={[
              "fixed left-0 top-10 z-50 w-10 h-10 rounded-tr-sm rounded-br-sm bg-[#0b1a2c] text-white shadow-md transition-opacity duration-200 pointer-events-auto",
              menuBtnActive ? "opacity-90" : "opacity-10",
            ].join(" ")}
          >
            <Icons.MenuOutlined />
          </button>
        )}

        <Sider
          className="!z-[60] !fixed !h-full"
          style={{ ...(isMobile && { left: 0, top: 0, bottom: 0 }) }}
          breakpoint="lg"
          collapsedWidth={isMobile ? 0 : 80}
          collapsible={!isMobile}
          width="220"
          collapsed={collapsed}
          onCollapse={toggleCollapsed}
          theme="dark"
          trigger={isMobile ? null : undefined}
        >
          <div className="p-4 text-white text-center">
            {!collapsed && (
              <div className="mb-4">
                <div className="w-[60px] h-[60px] mx-auto rounded-full overflow-hidden">
                  <Image
                    src={me?.thumbPictureUrl || NOT_FOUND_IMG}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    preview={false}
                    fallback={NOT_FOUND_IMG}
                  />
                </div>
                <p className="mt-2 text-white font-medium">
                  {`${me?.firstName || ""} ${me?.lastName || ""}`.trim() || "username"}
                </p>
              </div>
            )}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={() => {
              if (isMobile) setCollapsed(true);
            }}
            items={menuItems.map((m) => {
              const IconComponent = Icons[m.icon] || Icons.AppstoreOutlined;
              return {
                key: m.path,
                icon: <IconComponent />,
                label: (
                  <Link
                    to={m.path}
                    title={t(`back.menu.${m.title}.name`)}
                    className="flex items-center justify-between w-full overflow-hidden whitespace-nowrap"
                  >
                    <span className="truncate">
                      {t(`back.menu.${m.title}.name`)}
                    </span>
                    {m.isNoti && (
                      <MenuItemBadge
                        badgeKey={m.badgeKey}
                        size="small"
                        offset={[-2, 0]}
                        showZero
                      />
                    )}
                  </Link>
                ),
                disabled: !!m.disabled,
              };
            })}
          />
        </Sider>

        {!collapsed && isMobile && (
          <div
            onClick={toggleCollapsed}
            className="fixed inset-0 bg-black opacity-50 z-[51]"
          />
        )}

        <div
          className={`flex flex-col max-w-full h-full transition-all duration-300 ${collapsed ? "md:!ml-[80px]" : "md:!ml-[220px]"
            }`}
        >
          <div className="flex flex-col flex-1 bg-white p-2 md:!p-6">
            <div className="flex-1">
              <Outlet />
            </div>
          </div>
          <Footer layout="compact" />
        </div>
      </div>
    </Layout>
  );
}
